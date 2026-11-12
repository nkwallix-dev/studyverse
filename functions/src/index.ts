import {createHash} from "node:crypto";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {
  BOSS_QUESTIONS, BOSS_REWARD, QUIZ_REWARD, QUIZ_XP, BOSS_XP, FUNCTION_REGION,
  currentDay, validAnswer, validChallengeId, safeNonNegativeInteger,
  quizGrant, bossGrant, parseCounter, isBlockedPublicText,
} from "./core";

initializeApp();
const db = getFirestore();
const authUid = (auth: {uid: string} | undefined): string => {
  if (!auth?.uid) throw new HttpsError("unauthenticated", "Studyverse-Login erforderlich");
  return auth.uid;
};
const walletPath = (uid: string) => db.doc(`users/${uid}/wallet/tokens`);
const ledgerPath = (uid: string, day: string, key: string) =>
  db.doc(`users/${uid}/verifiedAttempts/${day}-${createHash("sha256").update(key).digest("hex")}`);
const counterPath = (uid: string, day: string) =>
  db.doc(`users/${uid}/verifiedAttempts/counter-${day}`);
const walletGuard = (data: FirebaseFirestore.DocumentData | undefined) => {
  if (!data?.migrationApproved) {
    throw new HttpsError("failed-precondition", "Wallet noch nicht vom Administrator freigegeben");
  }
};

/**
 * Only brand-new accounts (without any legacy /users/{uid} doc) can get
 * an empty wallet automatically. Existing players require manual migration.
 */
export const initializeWallet = onCall({region: FUNCTION_REGION}, async request => {
  const uid = authUid(request.auth);
  const legacy = db.doc(`users/${uid}`);
  const wallet = walletPath(uid);
  return db.runTransaction(async tx => {
    const [old, active] = await tx.getAll(legacy, wallet);
    if (active.exists) return {ready: active.data()?.migrationApproved === true};
    if (old.exists) throw new HttpsError("failed-precondition",
      "Alter Spielstand vorhanden: Admin-Migration und manuelle Prüfung erforderlich");
    tx.create(wallet, {tokens: 0, xp: 0, inventory: [], migrationApproved: true,
      version: 1, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()});
    return {ready: true};
  });
});

/**
 * Server-only challenge data lives in /questionBank. Current Studyverse
 * public question scripts expose answers, so this prevents balance forging
 * and double-credit but is NOT a proof that a human learned a question.
 */
export const submitAnswer = onCall({region: FUNCTION_REGION}, async request => {
  const uid = authUid(request.auth);
  const challengeId: unknown = request.data?.challengeId;
  const answer: unknown = request.data?.answer;
  if (!validChallengeId(challengeId) || !validAnswer(answer)) {
    throw new HttpsError("invalid-argument", "Ungültige Frage oder Antwort");
  }
  const question = await db.doc(`questionBank/${challengeId}`).get();
  const expected = question.data();
  if (!question.exists || expected?.active !== true || expected?.kind !== "quiz") {
    throw new HttpsError("not-found", "Frage aktuell nicht verfügbar");
  }
  if (answer !== expected?.answer) return {correct: false, tokensAwarded: 0, xpAwarded: 0};
  const day = currentDay(), wallet = walletPath(uid);
  const attempt = ledgerPath(uid, day, `quiz:${challengeId}`);
  const counter = counterPath(uid, day);
  return db.runTransaction(async tx => {
    const [w, a, c] = await tx.getAll(wallet, attempt, counter);
    walletGuard(w.data());
    if (a.exists) return {correct: true, tokensAwarded: 0, xpAwarded: 0, reason: "already-credited-today"};
    const current = parseCounter(c.data());
    const credit = quizGrant(current);
    if (!credit) return {correct: true, tokensAwarded: 0, xpAwarded: 0, reason: "daily-cap-reached"};
    const newTokens = safeNonNegativeInteger(w.data()?.tokens) + credit;
    const newXp = safeNonNegativeInteger(w.data()?.xp) + QUIZ_XP;
    tx.create(attempt, {challengeId, type: "quiz", day, tokensAwarded: credit,
      xpAwarded: QUIZ_XP, creditedAt: FieldValue.serverTimestamp()});
    tx.set(counter, {...current, quizTokens: current.quizTokens + credit,
      totalTokens: current.totalTokens + credit, quizQuestions: current.quizQuestions + 1,
      updatedAt: FieldValue.serverTimestamp()});
    tx.update(wallet, {tokens: newTokens, xp: newXp, updatedAt: FieldValue.serverTimestamp()});
    return {correct: true, tokensAwarded: credit, xpAwarded: QUIZ_XP,
      walletTokens: newTokens, walletXp: newXp};
  });
});

/** A boss run contains 20 answers, checked again by the server; no claimed
 * score or percentage is accepted from the caller. */
export const submitDailyBoss = onCall({region: FUNCTION_REGION}, async request => {
  const uid = authUid(request.auth);
  const answers: unknown = request.data?.answers;
  if (!Array.isArray(answers) || answers.length !== BOSS_QUESTIONS ||
      !answers.every((item: unknown) => item && typeof item === "object" &&
        validChallengeId((item as Record<string, unknown>).challengeId) &&
        validAnswer((item as Record<string, unknown>).answer))) {
    throw new HttpsError("invalid-argument", "Der Boss benötigt genau 20 Antworten");
  }
  const typed = answers as Array<{challengeId: string; answer: string}>;
  if (new Set(typed.map(x => x.challengeId)).size !== BOSS_QUESTIONS) {
    throw new HttpsError("invalid-argument", "Bossfragen müssen unterschiedlich sein");
  }
  const questions = await db.getAll(...typed.map(x => db.doc(`questionBank/${x.challengeId}`)));
  if (questions.some(q => !q.exists || q.data()?.active !== true ||
      q.data()?.kind !== "quiz" || q.data()?.examEligible !== true)) {
    throw new HttpsError("invalid-argument", "Boss enthält Fragen, die nicht für die Prüfungssimulation zugelassen sind");
  }
  const correct = questions.filter((q, i) => q.data()?.answer === typed[i].answer).length;
  if (correct < 14) return {passed: false, correct, tokensAwarded: 0, xpAwarded: 0};
  const day = currentDay(), wallet = walletPath(uid), counter = counterPath(uid, day),
    attempt = ledgerPath(uid, day, "daily-boss");
  return db.runTransaction(async tx => {
    const [w, a, c] = await tx.getAll(wallet, attempt, counter);
    walletGuard(w.data());
    if (a.exists) return {passed: true, correct, tokensAwarded: 0, xpAwarded: 0, reason: "already-credited-today"};
    const current = parseCounter(c.data());
    const credit = bossGrant(current, correct, typed.length);
    if (!credit) return {passed: true, correct, tokensAwarded: 0, xpAwarded: 0, reason: "daily-cap-reached"};
    const newTokens = safeNonNegativeInteger(w.data()?.tokens) + credit;
    const newXp = safeNonNegativeInteger(w.data()?.xp) + BOSS_XP;
    tx.create(attempt, {type: "boss", day, correct, tokensAwarded: credit,
      xpAwarded: BOSS_XP, creditedAt: FieldValue.serverTimestamp()});
    tx.set(counter, {...current, bossTokens: current.bossTokens + credit,
      totalTokens: current.totalTokens + credit, updatedAt: FieldValue.serverTimestamp()});
    tx.update(wallet, {tokens: newTokens, xp: newXp, updatedAt: FieldValue.serverTimestamp()});
    return {passed: true, correct, tokensAwarded: credit, xpAwarded: BOSS_XP,
      walletTokens: newTokens, walletXp: newXp};
  });
});

/** Purchases use the protected shopCatalog, not client-provided prices.
 * Drop progress from browser saves remains unverified, so only global
 * level-gated items can be purchased in verified online mode for now. */
export const purchaseItem = onCall({region: FUNCTION_REGION}, async request => {
  const uid = authUid(request.auth), itemId: unknown = request.data?.itemId;
  if (typeof itemId !== "string" || !/^[a-z0-9_-]{2,80}$/.test(itemId)) {
    throw new HttpsError("invalid-argument", "Ungültiges Item");
  }
  const item = await db.doc(`shopCatalog/${itemId}`).get();
  if (!item.exists || item.data()?.active !== true) throw new HttpsError("not-found", "Item nicht verfügbar");
  const spec = item.data()!;
  if (spec.drop !== "global") throw new HttpsError("failed-precondition",
    "Verse-Drop benötigt künftig serververifizierten Lernfortschritt");
  const cost = spec.cost, minLevel = spec.level;
  if (!Number.isSafeInteger(cost) || cost < 0 || !Number.isSafeInteger(minLevel) || minLevel < 1) {
    throw new HttpsError("failed-precondition", "Ungültige serverseitige Itemkonfiguration");
  }
  const wallet = walletPath(uid);
  return db.runTransaction(async tx => {
    const snap = await tx.get(wallet);
    walletGuard(snap.data());
    const tokens = safeNonNegativeInteger(snap.data()?.tokens);
    const xp = safeNonNegativeInteger(snap.data()?.xp);
    const level = 1 + Math.floor(Math.sqrt(xp / 110));
    const inventory = Array.isArray(snap.data()?.inventory) ?
      (snap.data()!.inventory as unknown[]).filter((x): x is string => typeof x === "string") : [];
    if (inventory.includes(itemId)) return {owned: true, tokens, inventory};
    if (level < minLevel) throw new HttpsError("failed-precondition", "Level noch nicht erreicht");
    if (tokens < cost) throw new HttpsError("failed-precondition", "Zu wenig verifizierte TastyTokens");
    const next = [...inventory, itemId], balance = tokens - cost;
    tx.update(wallet, {tokens: balance, inventory: next, updatedAt: FieldValue.serverTimestamp()});
    return {owned: true, tokens: balance, inventory: next};
  });
});

/**
 * Public ranking is a SERVER projection of the current, owner-approved wallet.
 * Only the server can write /verifiedProfiles and it never copies legacy
 * publicProfiles.level (those values could be forged before the security fix).
 * Re-read the latest wallet to tolerate out-of-order Firestore events.
 */
export const publishVerifiedLevel = onDocumentWritten(
  {document: "users/{uid}/wallet/tokens", region: FUNCTION_REGION}, async event => {
    const uid = event.params.uid;
    const wallet = await walletPath(uid).get();
    const rank = db.doc(`verifiedProfiles/${uid}`);
    if (!wallet.exists || wallet.data()?.migrationApproved !== true) {
      await rank.delete();
      return;
    }
    const xp = safeNonNegativeInteger(wallet.data()?.xp);
    const level = 1 + Math.floor(Math.sqrt(xp / 110));
    await rank.set({verified: true, level, updatedAt: FieldValue.serverTimestamp()});
  });

/** Sanitize even direct REST calls; backend moderation is not an automatic ban.
 * A fair-play warning takes precedence and will never be overwritten. */
export const moderatePublicProfile = onDocumentWritten(
  {document: "publicProfiles/{uid}", region: FUNCTION_REGION}, async event => {
    const after = event.data?.after;
    if (!after?.exists) return;
    const data = after.data() || {};
    if (!isBlockedPublicText(data.nickname) &&
        !isBlockedPublicText(data.selectedTitle)) return;
    const uid = event.params.uid, card = db.doc(`publicProfiles/${uid}`);
    const notice = db.doc(`accountNotices/${uid}`);
    const audit = db.collection(`moderationEvents/${uid}/events`).doc(event.id);
    await db.runTransaction(async tx => {
      const [current, existingNotice] = await tx.getAll(card, notice);
      if (!current.exists) return;
      const latest = current.data()!;
      const badName = isBlockedPublicText(latest.nickname);
      const badTitle = isBlockedPublicText(latest.selectedTitle);
      if (!badName && !badTitle) return;
      const fix: Record<string, unknown> = {updatedAt: Timestamp.now()};
      if (badName) fix.nickname = "Spieler";
      if (badTitle) fix.selectedTitle = "Weltenentdecker";
      tx.update(card, fix);
      tx.create(audit, {kind: "public-profile-text", nicknameBlocked: badName,
        titleBlocked: badTitle, createdAt: FieldValue.serverTimestamp()});
      if (!existingNotice.exists || existingNotice.data()?.kind !== "fairplay-warning") {
        tx.set(notice, {id: `nickname-${currentDay()}`,kind: "nickname-blocked",
          active: true, createdAt: FieldValue.serverTimestamp()});
      }
    });
  });

export const moderateClientState = onDocumentWritten(
  {document: "clientStates/{uid}", region: FUNCTION_REGION}, async event => {
    const after = event.data?.after;
    if (!after?.exists || !isBlockedPublicText(after.data()?.nickname)) return;
    const ref = db.doc(`clientStates/${event.params.uid}`);
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.exists && isBlockedPublicText(current.data()?.nickname)) {
        tx.update(ref, {nickname: "Spieler", updatedAt: Timestamp.now()});
      }
    });
  });

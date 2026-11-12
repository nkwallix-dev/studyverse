/**
 * Canonical wallet policy. Never accept balances, XP, inventory, price or
 * reward amounts from a browser or from the legacy users/{uid}.profile.
 */
export const DAILY_QUIZ_CAP = 500;
export const DAILY_TOTAL_CAP = 750;
export const QUIZ_REWARD = 25;
export const BOSS_REWARD = 250;
export const BOSS_QUESTIONS = 20;
export const BOSS_MIN_CORRECT = 14;
export const MAX_QUIZ_QUESTIONS = 20;
export const FUNCTION_REGION = "europe-west1";

export interface DailyCounter {
  quizTokens: number;
  bossTokens: number;
  totalTokens: number;
  quizQuestions: number;
}
export function safeNonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
export function currentDay(): string { return new Date().toISOString().slice(0, 10); }
export function quizGrant(c: DailyCounter): number {
  if (c.quizQuestions >= MAX_QUIZ_QUESTIONS || c.quizTokens >= DAILY_QUIZ_CAP ||
      c.totalTokens >= DAILY_TOTAL_CAP) return 0;
  return Math.min(QUIZ_REWARD, DAILY_QUIZ_CAP - c.quizTokens, DAILY_TOTAL_CAP - c.totalTokens);
}
export function bossGrant(c: DailyCounter, correct: number, total: number): number {
  if (total !== BOSS_QUESTIONS || correct < BOSS_MIN_CORRECT ||
      c.bossTokens > 0 || c.totalTokens + BOSS_REWARD > DAILY_TOTAL_CAP) return 0;
  return BOSS_REWARD;
}
export function validChallengeId(x: unknown): x is string {
  return typeof x === "string" && x.length >= 3 && x.length <= 100 &&
    /^[a-z0-9:_-]+$/.test(x);
}
export function validAnswer(x: unknown): x is string {
  return typeof x === "string" && x.length > 0 && x.length <= 1000;
}
export function isBlockedPublicText(value: unknown): boolean {
  if (typeof value !== "string" || value.length < 2 || value.length > 80 ||
      /[\u0000-\u001f\u007f]/.test(value)) return true;
  const lookalikes: Record<string, string> = {
    "а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","у":"y","і":"i","ј":"j","ѕ":"s",
    "α":"a","ε":"e","ι":"i","ο":"o","ν":"n","κ":"k","ρ":"p","τ":"t","χ":"x"
  };
  const canonical = [...value.normalize("NFKC").normalize("NFKD").toLowerCase()]
    .map(ch => lookalikes[ch] || ch).join("")
    .replace(/[\u0300-\u036f\u200b-\u200d\u2060]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[4@]/g, "a").replace(/3/g, "e")
    .replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[5$]/g, "s")
    .replace(/7/g, "t").replace(/9/g, "g")
    .replace(/[^a-z]/g, "");
  // Tight patterns to avoid blocking ordinary German/English names on fragments.
  const patterns = [
    /n(?:i|e)?gg(?:a|er|ers)/, /nazi/, /heilhitler/, /hitler/,
    /f(?:a|u)ck(?:you|off|er)?/, /fick(?:dich|er)/,
    /hurensohn/, /scheiss?(?:kerl|typ|idiot)/,
    /retard(?:ed)?/, /kike/, /spic/, /chink/,
    /^(admin|administrator|moderator|support|studyverse|firebase)$/
  ];
  return patterns.some(pattern => pattern.test(canonical));
}
export function parseCounter(data: FirebaseFirestore.DocumentData | undefined): DailyCounter {
  return {
    quizTokens: safeNonNegativeInteger(data?.quizTokens),
    bossTokens: safeNonNegativeInteger(data?.bossTokens),
    totalTokens: safeNonNegativeInteger(data?.totalTokens),
    quizQuestions: safeNonNegativeInteger(data?.quizQuestions),
  };
}

# Studyverse – Security Fix (staged, NOT deployed)

**Status:** Implementation branch. **No production Firebase data was changed.**
Do not merge/deploy this branch until the owner has reviewed existing wallets, backend permissions, rollout timing and CI results.

## Implemented

- Legacy `users/{uid}.profile` becomes **owner read-only**, preventing future overwrites of the old arbitrary JSON economy.
- `clientStates/{uid}` holds only untrusted practice JSON, nickname and timestamp. Its embedded trainer progress and any nested numeric data have **no wallet authority**.
- `users/{uid}/wallet/tokens` is the source of truth for verified `tokens`, `xp` and `inventory`, owner-readable, **client-write-denied**.
- `users/{uid}/verifiedAttempts/*` prevents double awards per UTC day and question; global quota **20 quiz × 25 = 500 TT**, plus one **250 TT** boss reward, maximum **750 TT/UTC day**.
- Firebase 2nd-gen callable `submitAnswer` and `submitDailyBoss` validate solutions from the private `questionBank` collection and credit the wallet in Firestore transactions (+10 XP per unique credited quiz answer, +50 XP per credited boss).
- A client cannot set the reward amount, score, price, XP, or purchase receipt. `purchaseItem` uses server-side `shopCatalog` and canonical wallet.
- An admin-written `verifiedProfiles/{uid}` projection publishes wallet-derived levels. Old `publicProfiles.level` values are ignored by the ranking; existing friend UI stays intact.
- Public-profile nickname/title moderation via Firestore trigger corrects bad text and writes a **non-punitive** notice. Existing manual `fairplay-warning` is never overwritten; no automated bans.
- Website and daily arena read canonical online wallets and request server-side daily TT. Logged-out offline gameplay remains local.
- One-time scan/approve migration scripts refuse to change pre-existing wallets or stale legacy snapshots.
- GitHub Actions emulators validate rules, callable rewards and moderation before publication.
- OIDC/WIF deploy config avoids a long-lived service-account JSON key.

## IMPORTANT: What this first stage deliberately does NOT claim

1. **No real account data has been scanned or migrated.** An owner must review every UID in the generated report. A flagged balance is not automatically evidence of fraud.
2. Existing trainer **local XP, achievements, imported inventory, Verse-Drop purchases and non-daily rewards are NOT server-verifiable**. Cloud accounts cannot mint those from editable localStorage. Level growth from those sources is paused online until separate authoritative progress endpoints are added. Existing purchases are restored by migration; *new* Verse-Drop purchases are refused online until unlock criteria can be verified by backend.
3. **New provisional daily XP economy:** +10 verified XP per credited unique daily question and +50 verified XP for the one 14/20 boss per UTC day (max +250 verified XP/day). This is separate from legacy untrusted trainer XP; the proposed values must be reviewed by the project owner before production activation.
4. Current publicly served `public/daily/questions.js` already contains **correct answers**. The private backend answer collection cannot prove that a caller learned the material; someone can programmatically submit known solutions. The new design prevents 10-million-TT balance edits, repeated awards and arbitrary prices, **not automation within the daily cap**. Truly competitive XP needs private rotating challenges and stronger anti-abuse controls.
5. The nickname trigger runs **after** Firestore commits, so banned text can briefly appear before correction. The simple normalization patterns are not exhaustive and may need a properly curated multilingual list and appeal path.
6. **Firebase Functions may require upgrading the Firebase project to the Blaze billing plan.** Verify budget, quotas, IAM roles, and the project's required Firebase/Google APIs first.
7. Additional trainers still show local motivational progress; it is not considered verified currency online. Review the online/offline UX before shipping to classmates.

## Read-only migration report – Google Cloud Shell (no Firebase admin key in chat)

**This is the remaining owner-only step. It performs ZERO Firestore writes.**
Use a fresh Cloud Shell session under a Google account authorized to read
the Studyverse Firestore database. Authentication and report files stay in
your own Cloud Shell home directory (not GitHub or public CI artifacts).

```bash
gcloud config set project studyverse-logins
git clone --branch feature/server-authoritative-wallet-20261112 \
  https://github.com/nkwallix-dev/studyverse.git studyverse-security
cd studyverse-security
npm ci
npm install --prefix functions --no-audit --no-fund
gcloud auth application-default login
node scripts/migrate-wallets.cjs --scan \
  --project studyverse-logins \
  --report security-reports/wallet-report.json
node scripts/show-wallet-summary.cjs \
  --report security-reports/wallet-report.json
```

The last command shows a small table with **nickname / TT / XP / item count /
review flags**, with no full UID or approval hash. It is suitable for copying
into a private discussion. The detailed report and
`*.approvals.template.json` remain ignored local files; do **not** upload them
to a public repository. `--scan` never modifies balances. If you rerun the
scan after someone has played, use the newest report and re-review approvals.

Do **not** run `--apply` until account-by-account values have been checked
with the owner, suspicious values corrected, the production database backed up,
and the maintenance/cutover plan agreed.

## Owner-only rollout: DO NOT reverse this order

1. Create a full Firestore backup / export. Review GitHub PR changes and CI.
2. Configure Firebase Blaze if needed, Google APIs, dedicated GitHub OIDC deploy service account and WIF as in `firebase/AUTO_DEPLOY.md`. Keep `STUDYVERSE_SECURITY_CUTOVER_APPROVED` unset.
3. In a short maintenance window **stop active use and freeze legacy client writes**. Otherwise a player may change old data after the review and before cutoff.
4. Generate the read-only scan in Google Cloud Shell using the commands above. Do not attach the full report or approvals to GitHub Actions or public issues. Inspect all UIDs, especially spikes. Prepare `security-reports/wallet-approvals.json` with `{ "project": "studyverse-logins", "reviewed": true, "entries": [ { "uid":"...", "sourceHash":"...", "decision":"approve", "tokens":123, "xp":123, "inventory":["..."] } ] }`. Use `decision:"skip"` for unresolved accounts. A reviewed entry MUST be supplied for **each** UID in the report.
5. Run `node scripts/migrate-wallets.cjs --apply --project studyverse-logins --report security-reports/wallet-report.json --approvals security-reports/wallet-approvals.json --confirm-reviewed`. Missing/wrong hashes or already-existing wallet stop import; no old data deleted.
6. From this checked-out feature branch, seed private server config with `node scripts/seed-server-catalog.cjs --project studyverse-logins --apply --owner-approved`.
7. Deploy Firestore rules & functions from this branch in a controlled maintenance step (`firebase deploy --only firestore:rules,functions --project studyverse-logins`) **before** publishing the new website. The old website's cloud writes will fail during this transition; keep maintenance active.
8. Merge the reviewed new front-end, confirm canonical balances, quiz, boss, nickname, friend list and paid cosmetics on test accounts, then reopen access.
9. Only after validation set GitHub repository variable `STUDYVERSE_SECURITY_CUTOVER_APPROVED=true` and configure the `firebase-production` environment approval rule. Subsequent pushes to `main` auto-publish rules AND functions after CI, with no manual rule copy-paste.

**Do not put any credential, UID report, approvals or Google ADC JSON into the repository or chat.** The scripts use local credentials and reports ignored by Git.

## Test commands

```sh
npm ci
npm install --prefix functions
npm --prefix functions run build
node --test functions/test/core.test.cjs
node scripts/test-cloud-sync.cjs
npm install --global firebase-tools
firebase emulators:exec --project demo-studyverse-rules --only firestore,auth,functions "node scripts/test-security-emulators.cjs"
npm run build -- --base-href /studyverse/
```

Success on mock tests alone **does not** prove the real deployed rules are current. Verify with owner and non-owner accounts after rollout.

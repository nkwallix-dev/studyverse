# Firebase automation for Studyverse

GitHub Pages only deploys the site. This branch adds a **separate** GitHub workflow to deploy Firestore Rules AND Firebase Functions with Google OIDC Workload Identity Federation (WIF). The production deploy is disabled until the owner explicitly authorizes the security cutover.

## One-time GitHub ↔ Firebase setup

1. Confirm Firebase project ID: **studyverse-logins**.
2. Cloud Functions (2nd gen) generally require a Blaze/billing-enabled project. Set budgets/alerts and enable required Cloud Functions, Cloud Build, Artifact Registry, Firebase Rules and related Google APIs.
3. In Google Cloud IAM create a **dedicated deployment service account**; grant only the permissions needed to publish Cloud Functions and Firebase Rules, including appropriate Cloud Functions deploy, Rules Admin, API access, artifact-build and runtime-service-account impersonation rights. Follow Google's current deployment IAM guidance; avoid broad Owner/Editor if possible.
4. Create a Workload Identity pool/provider trusting GitHub Actions OIDC and restrict attribute conditions to repository `nkwallix-dev/studyverse`, event `push` or `workflow_dispatch`, and branch `refs/heads/main`. Grant the service account's `roles/iam.workloadIdentityUser` to the matching principal.
5. In GitHub → Studyverse repository → Settings → Secrets and variables → Actions → **Variables**, set `FIREBASE_WIF_PROVIDER` (full provider resource ID) and `FIREBASE_DEPLOY_SA` (service account email). Do not upload a service-account key; the token method `firebase login:ci` is not used.
6. Configure GitHub environment `firebase-production` with required approval reviewers if available.
7. Keep `STUDYVERSE_SECURITY_CUTOVER_APPROVED` **unset/false** until owner-reviewed migration is complete and the new app can be activated. Without the variable, CI validates but production deployment is skipped.
8. After migration + first controlled cutover, set `STUDYVERSE_SECURITY_CUTOVER_APPROVED=true`. Future updates to `firestore.rules` or `functions/**` on `main` run validation and, once approved, publish to Firebase.

See `SECURITY_FIX_SUMMARY.md` for the careful first-cutover process. No service-account JSON in this public repository.

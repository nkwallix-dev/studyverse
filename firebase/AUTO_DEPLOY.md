# Automatic Firestore rules deployment

Studyverse uses the Firebase project `studyverse-logins`, as configured in `public/cloud-config.json`.

The workflow `.github/workflows/firebase-rules.yml` validates on pull requests and automatically deploys **only** Firestore rules after updates on `main`. The old GitHub Pages workflow still deploys the website independently. Never commit credentials.

## One-time setup

1. In Google Cloud, create a dedicated deploy service account and assign the least-privileged role for publishing Firestore rules, `roles/firebaserules.admin`, on the project. Do **not** create/download a service-account JSON key.
2. Configure a Workload Identity Federation pool and OIDC provider for GitHub Actions (`https://token.actions.githubusercontent.com`), strictly restricted to repository `nkwallix-dev/studyverse` and preferably `refs/heads/main`. Allow the federated principal to impersonate only this deploy account via `roles/iam.workloadIdentityUser`.
3. Under GitHub repository **Settings → Secrets and variables → Actions → Variables**, create:
   - `FIREBASE_WIF_PROVIDER`: full provider resource name (`projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL/providers/PROVIDER`)
   - `FIREBASE_DEPLOY_SA`: email of the dedicated deploy service account
4. Merge the PR after review. The workflow runs tests and checks rules syntax with the Firebase emulator. The publish job is **skipped** when either variable is missing. When configured, re-run the workflow manually or push a rules change to `main` to publish.
5. Check the **Publish Firestore rules only** job result in GitHub Actions and verify the expected rules in Firebase Console. Any future Firebase Console edits might be overwritten by the next git deployment.

Keep both `firestore.rules` and `firebase/firestore.rules` identical. Existing Studyverse tests require this. The CLI uses the root `firestore.rules`. A future migration can remove the duplicate file once the tests are updated.

**Scope:** The GitHub deploy account can publish rules, but cannot administer user accounts or issue Paul’s individual warning. Those remain owner-controlled operations.

Reference: https://firebase.google.com/docs/rules/manage-deploy and https://github.com/google-github-actions/auth

# STUDYVERSE · Private user accounts (planned)

The Angular homepage is deployed independently of the account backend. **No cloud accounts are active yet.** The frontend currently stores progress in browser localStorage.

## Provider
- Firebase Authentication: email/password accounts. Passwords must NEVER be stored in Firestore, source code, or localStorage.
- Cloud Firestore: personal progress, inventory and game state, one document per authenticated user, at `users/{uid}`.
- GitHub Pages: public static Angular frontend (not a private server).

## Steps to enable the backend
1. Create a Firebase project at https://console.firebase.google.com/.
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Authentication → Settings → Authorized domains**, add `nkwallix-dev.github.io` and `localhost` as necessary.
4. Create **Cloud Firestore** (production mode). Copy `firestore.rules` into Firestore → Rules, then Publish.
5. Register a **Web app** and use its public web configuration in the Angular Firebase client. Do not commit service-account JSON or private keys.
6. Integrate Angular's Firebase JS SDK and save/load `users/{uid}` on sign-in and after progress updates.
7. Migrate each browser's existing `studyverse_profile_v1` and previously imported CHEMVERSE data to that user's Firestore document once, after explicit confirmation.

## Security caveats
The owner-only Firestore rules restrict access, but a browser-only game economy is editable by the account holder. For cheat-resistant XP/Tokens, move award logic to validated server functions.

There is no password field in the Firestore schema. Email/password credentials are handled entirely by Firebase Authentication.

## Publishing
Under https://github.com/nkwallix-dev/studyverse/settings/pages, set **Build and deployment → Source → GitHub Actions**. The repository includes `.github/workflows/deploy.yml`, which builds the Angular frontend. Do not leave branch/Jekyll publishing enabled alongside the custom workflow.

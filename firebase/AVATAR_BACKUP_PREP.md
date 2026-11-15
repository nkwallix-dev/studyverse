# Studyverse: Firestore backup and avatar-ID migration preparation

Status: **PREPARATION ONLY**. This branch does not create Google Cloud resources, execute a database backup, or modify production Firestore data.

## Verified existing configuration (2026-11-15)
- Google Cloud project: `studyverse-logins` (project number `916949777071`)
- GitHub repository: `nkwallix-dev/studyverse`
- Existing Workload Identity Provider:
  `projects/916949777071/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Existing service accounts are **not** reused or granted broader access:
  - `studyverse-github-deploy@studyverse-logins.iam.gserviceaccount.com`
  - `studyverse-public-ranks@studyverse-logins.iam.gserviceaccount.com`
- Firestore stores the private save in `users/{uid}.profile` as a JSON **string**, containing `profile.equipped.avatar` and `profile.inventory`.
- Friend cards separately store `publicProfiles/{uid}.avatar`; the existing rank sync may create previously missing cards.
- No live Firestore access was exercised during this preparation.

## Safety conditions before a backup can run
1. Confirm billing status and approve any expected Google Cloud charges. Managed Firestore exports need billing and Cloud Storage; no billing changes are automated here.
2. In Google Cloud Console, verify the project's Firestore database location and default database ID, and the existing GitHub Workload Identity Provider's actual attribute mapping and trust constraints. **Do not weaken the existing provider's conditions**.
3. Use a dedicated private Cloud Storage bucket with:
   - region/location compatible with Firestore export
   - uniform bucket-level access enabled
   - public access prevention **enforced**
   - an appropriate retention/lifecycle and restore policy
   - no `allUsers` or `allAuthenticatedUsers` principals
4. Create the service account `studyverse-firestore-backup@studyverse-logins.iam.gserviceaccount.com` **without JSON keys**. Give it only Firestore export permissions (the relevant least-privilege role, such as `roles/datastore.importExportAdmin`, should be reviewed against organizational policy) and read/list access on the backup bucket for verification.
5. Allow the repository principal `principalSet://iam.googleapis.com/projects/916949777071/locations/global/workloadIdentityPools/github-pool/attribute.repository/nkwallix-dev/studyverse` to impersonate **only** this dedicated service account with `roles/iam.workloadIdentityUser`; verify the provider maps `attribute.repository` and restricts trust to the intended repo. If possible, constrain by a dedicated environment/branch at the provider/policy layer.
6. Grant the **Firestore managed export service agent** the required private bucket object-writing permission; the agent may differ by project age. Verify its identity from the Firestore documentation/Google Cloud project rather than guessing. The GitHub service account and Firestore service agent serve different roles.
7. In GitHub repository Actions variables, create `FIREBASE_BACKUP_BUCKET` with the bucket **name only** (no `gs://`). Configure GitHub `firebase-production` environment approvals to control manual execution.
8. Merge the workflow only when the other chat's work is complete and the branch has been reconciled. The workflow is manual-only, and its job has an additional `main` branch guard. GitHub workflow dispatch must be present on the repository default branch to be runnable from the UI.
9. Start `Backup Studyverse Firestore (manual only)` with the confirmation text `BACKUP`. Watch for completion and note the private export prefix from the log. Verify object listing, export operation success and restore readiness in a separate test before approving data migration.

## Why this is a staged migration

**Do NOT replace all emoji values in Firestore yet.** The currently deployed frontend still expects emoji strings for most avatars, e.g. `🐼`; changing the database first would cause broken avatars.

Proposed forward migration after frontend compatibility ships:

| Old stored avatar | Stable item ID |
|---|---|
| 🧪 | default_avatar (new, non-purchasable) |
| 🍕 | avatar_pizza |
| 👽 | avatar_alien |
| 🐟 | avatar_frog |
| 🐸 | avatar_frog (legacy alias) |
| 🧠 | avatar_brain |
| 👑 | avatar_crown |
| ⚗️ | chem_flask |
| 🤖 | dsai_bot |
| 🐼 | dsai_panda |
| 🕷️ | dsai_spider |
| 🐍 | dsai_python |
| 🐑 | sharp_sheep |
| ✂️ | sharp_scissors |
| 🐏 | sharp_ram |
| 🦊 | maths_avatar_pi (archived item) |
| 🦖 | kenny_avatar (legacy blue) |

Kenny already stores item IDs: `kenny_avatar`, `kenny_avatar_pink`, `kenny_avatar_green`, `kenny_avatar_red`. Retain these IDs and existing inventory item IDs unchanged.

Migration must:
- preserve every other profile field, XP, TT, inventory IDs, claimed rewards, and dino state
- migrate both private `users/{uid}` and public `publicProfiles/{uid}` avatars only if they have recognized legacy values
- handle unknown/unrecognized values without deleting or overwriting them
- be idempotent, abort safely on conflicts, and re-read current documents; use Firestore update-time preconditions or transactions so active players' changes cannot be lost
- provide a report of scanned/changed/skipped counts, **without printing private profiles**
- verify a trusted recoverable backup has completed before any write
- avoid reintroducing emoji values via existing user clients or the periodic public rank sync; deploy dual-read-compatible frontend before migrating Firestore

## Scope
This preparation does not create a backup of Firebase Authentication user accounts, Cloud Storage objects outside Firestore, or externally held assets. If needed, plan those separately. Do not store backup contents, service-account credentials, Google access tokens, or user profiles in GitHub or Actions artifacts.

## Restore readiness
A successful export is necessary but not sufficient: document and test an authorized restore procedure to a separate test database/project, including restoration of related security rules and the impact of public profile synchronization, before considering a mass migration.

## File
- `.github/workflows/firebase-avatar-backup.yml`: opt-in manual export, private bucket assertions and export verification. Does not run on push or PR.

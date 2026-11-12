#!/usr/bin/env bash
# Owner-only one-time initialization. A dedicated rank-sync identity gets
# exactly four Firestore entity permissions. No deletion permission, no
# access to Firebase Auth, no modifications to existing private wallets.
set -euo pipefail

PROJECT="studyverse-logins"
ROLE="studyversePublicRankSync"
SA_NAME="studyverse-public-ranks"
SA="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
PROVIDER_PROJECT_NUMBER="916949777071"

echo "Configuring the separate, least-privilege Studyverse rank identity..."
gcloud config set project "$PROJECT" >/dev/null

if ! gcloud iam service-accounts describe "$SA" --project "$PROJECT" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT" \
    --display-name="Studyverse public level projector" --quiet
fi

if ! gcloud iam roles describe "$ROLE" --project "$PROJECT" >/dev/null 2>&1; then
  gcloud iam roles create "$ROLE" --project "$PROJECT" \
    --title="Studyverse Public Display Level Sync" \
    --description="Read private saves and write only projected display levels; no deletions" \
    --permissions="datastore.entities.get,datastore.entities.list,datastore.entities.create,datastore.entities.update" \
    --stage=GA --quiet
fi

gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" \
  --role="projects/$PROJECT/roles/$ROLE" \
  --condition=None --quiet >/dev/null

gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --project "$PROJECT" \
  --member="principalSet://iam.googleapis.com/projects/$PROVIDER_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/nkwallix-dev/studyverse" \
  --role="roles/iam.workloadIdentityUser" \
  --condition=None --quiet >/dev/null

echo "IAM setup complete. Running an owner-authorized immediate public rank sync..."
GCLOUD_ACCESS_TOKEN="$(gcloud auth print-access-token)" node scripts/sync-public-levels.cjs

echo "Done. Subsequent rank updates run via the dedicated GitHub workflow (approximately every 5 minutes)."

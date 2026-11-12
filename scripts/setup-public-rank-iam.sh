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

# Google Cloud IAM is eventually consistent: a freshly created service account
# can be visible to the creation API yet not usable in IAM policy bindings for
# 60+ seconds. Retry ONLY this replication-related error, never permission errors.
retry_iam_binding() {
  local label="$1"
  shift
  local attempt=1
  local delay=5
  local output=""
  while (( attempt <= 7 )); do
    if output="$("$@" 2>&1)"; then
      echo "✓ $label"
      return 0
    fi
    if ! grep -Eqi '(does not exist|not found|not yet available|not yet propagated)' <<< "$output"; then
      printf '%s\n' "$output" >&2
      return 1
    fi
    if (( attempt == 7 )); then
      printf 'IAM binding still unavailable after retries: %s\n' "$label" >&2
      printf '%s\n' "$output" >&2
      return 1
    fi
    printf 'Google IAM still syncing (%s, attempt %s/7). Retrying...\n' "$label" "$attempt"
    sleep "$delay"
    if (( delay < 60 )); then delay=$((delay * 2)); fi
    if (( delay > 60 )); then delay=60; fi
    attempt=$((attempt + 1))
  done
}

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

retry_iam_binding "Project role for public rank sync" \
  gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:$SA" \
  --role="projects/$PROJECT/roles/$ROLE" \
  --condition=None --quiet

retry_iam_binding "GitHub OIDC impersonation for public rank sync" \
  gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --project "$PROJECT" \
  --member="principalSet://iam.googleapis.com/projects/$PROVIDER_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/nkwallix-dev/studyverse" \
  --role="roles/iam.workloadIdentityUser" \
  --condition=None --quiet

echo "IAM setup complete. Running an owner-authorized immediate public rank sync..."
GCLOUD_ACCESS_TOKEN="$(gcloud auth print-access-token)" node scripts/sync-public-levels.cjs

echo "Done. Subsequent rank updates run via the dedicated GitHub workflow (approximately every 5 minutes)."

# Deployment — Prime

> **Status: migrated to Cloudflare.** The production target is now
> Cloudflare Workers + D1 + Workers Static Assets. Follow
> **[DEPLOYMENT-CLOUDFLARE.md](DEPLOYMENT-CLOUDFLARE.md)** instead.
>
> The Google Cloud Run instructions below are kept for reference only
> (historical/rollback). Google deploy requires Google credentials that are no
> longer part of the primary path.

---

# Google Cloud Deployment — Prime (legacy reference)

The whole system runs in the Google ecosystem as a **single Cloud Run service**:

- **Frontend** (storefront at `/`, admin at `/admin`) — built by Vite, served by the Express server
- **API** (`/v1/*`, `/api/*`) — Express, same service
- **Database** — Firestore (existing `firebase-applet-config.json`)
- **Secrets** — Google Secret Manager
- **Build/CD** — Cloud Build (Dockerfile → Artifact Registry / Container Registry)

## 1. Prerequisites

- `gcloud` CLI (`gcloud auth login`, `gcloud auth application-default login`)
- `firebase` CLI (`npm install -g firebase-tools`)
- A billing-enabled Google Cloud project (use the existing `perfect-buttress-4dzcr` or create one)
- A Firebase project with Firestore enabled (database `ai-studio-2a6e1079-df7d-4d18-8a38-3a6103537ed9` is referenced in `firebase-applet-config.json`)

```bash
# Set the active project (replace with your project id)
gcloud config set project perfect-buttress-4dzcr
PROJECT=$(gcloud config get-value project)
```

## 2. Enable APIs

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```

## 3. Create secrets in Secret Manager

The app requires these at startup (fail-fast if missing): `SESSION_SIGNING_KEY_CURRENT`, `FIELD_ENCRYPTION_KEY_CURRENT`, `ADMIN_CODE_PEPPER`.

```bash
# Required
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create session-signing-key --data-file=- --replication-policy=automatic
printf '%s' "$(openssl rand -hex 32)" | gcloud secrets create field-encryption-key --data-file=- --replication-policy=automatic
printf '%s' "CHANGE_ME_strong_pepper" | gcloud secrets create admin-code-pepper --data-file=- --replication-policy=automatic

# Optional integrations (only if used)
printf '%s' "$TELEGRAM_BOT_TOKEN" | gcloud secrets create telegram-bot-token --data-file=- --replication-policy=automatic
printf '%s' "$GEOAPIFY_API_KEY" | gcloud secrets create geoapify-api-key --data-file=- --replication-policy=automatic
printf '%s' "$RECEIPT_ANALYZER_API_KEY" | gcloud secrets create receipt-analyzer-api-key --data-file=- --replication-policy=automatic
```

Grant the runtime service account access to the secrets:

```bash
PROJECT_NUM=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$PROJECT_NUM-compute@developer.gserviceaccount.com" \
  --role=roles/secretmanager.secretAccessor
```

## 4. Build & deploy

Direct build (Cloud Build auto-detects the Dockerfile):

```bash
gcloud run deploy prime \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets SESSION_SIGNING_KEY_CURRENT=session-signing-key:latest,FIELD_ENCRYPTION_KEY_CURRENT=field-encryption-key:latest,ADMIN_CODE_PEPPER=admin-code-pepper:latest,TELEGRAM_BOT_TOKEN=telegram-bot-token:latest,GEOAPIFY_API_KEY=geoapify-api-key:latest,RECEIPT_ANALYZER_API_KEY=receipt-analyzer-api-key:latest
```

Or use the checked-in pipeline:

```bash
gcloud builds submit --config cloudbuild.yaml
```

The service listens on the port Cloud Run injects via `PORT` (see `server.ts`).

## 5. Firestore rules & indexes

```bash
firebase use perfect-buttress-4dzcr
firebase deploy --only firestore:rules
```

> `firestore.rules` currently allows public read/write — tighten it before going live.

## 6. Post-deploy

```bash
SERVICE_URL=$(gcloud run services describe prime --region us-central1 --format='value(status.url)')
curl $SERVICE_URL/api/health          # => {"status":"ok"}
```

- Storefront: `$SERVICE_URL/`
- Admin: `$SERVICE_URL/admin`

Telegram webhook (orders/notifications):

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=$SERVICE_URL/v1/webhooks/telegram/<botKey>"
```

## 7. Updates

```bash
gcloud builds submit --config cloudbuild.yaml   # rebuild + redeploy
```

Optional: front the service with Firebase Hosting for CDN caching of static assets (rewrite `/v1/**` to the Cloud Run service). Not required since the container already serves the built app.

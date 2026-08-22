# Environment variables and secrets

CineScope separates public Firebase web configuration, server-only secrets, runtime parameters, and emulator-only fixtures. Never place a private credential in a `VITE_` variable because Vite embeds those values in browser JavaScript.

## Frontend Firebase values

Copy `.env.example` to the ignored `.env.local` for ordinary local development. Preview and production builds use ignored `.env.preview` and `.env.production` files based on their committed examples.

| Variable | Required | Exposure | Purpose |
| --- | --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | For authentication | Browser-visible | Firebase web application identifier. It is not an Admin credential. |
| `VITE_FIREBASE_AUTH_DOMAIN` | For authentication | Browser-visible | Firebase Authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | For authentication/sync | Browser-visible | Firebase project used by the client SDK. |
| `VITE_FIREBASE_APP_ID` | For authentication | Browser-visible | Firebase web application ID. |
| `VITE_FIREBASE_APP_CHECK_SITE_KEY` | Optional until enforcement | Browser-visible | reCAPTCHA Enterprise site key for App Check. |

The application shows an explicit configuration notice rather than attempting authentication when the four required Firebase values are incomplete.

## Emulator-only frontend values

`.env.emulator` is committed with fixed, non-secret values for the `demo-cinescope` project. `.env.e2e` deliberately keeps Firebase disabled. The emulator build recognizes:

- `VITE_FIREBASE_AUTH_EMULATOR_URL`
- `VITE_FIRESTORE_EMULATOR_HOST`
- `VITE_FIRESTORE_EMULATOR_PORT`
- `VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST`
- `VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT`

Do not copy emulator host values into preview or production environments.

## Server-only TMDB secret

`TMDB_READ_ACCESS_TOKEN` is a Firebase Functions secret. For local manual API development, copy `functions/.secret.local.example` to the ignored `functions/.secret.local`. For preview and production, create the secret in the selected Firebase project:

```powershell
npx.cmd firebase-tools functions:secrets:set TMDB_READ_ACCESS_TOKEN --project YOUR_PROJECT_ID
```

The token must never appear in `.env.local`, any `VITE_` variable, GitHub Actions output, browser code, or committed Firebase configuration.

## Functions parameters

| Parameter | Default posture | Purpose |
| --- | --- | --- |
| `TMDB_APP_CHECK_ENFORCED` | `false` until preview verification | Requires valid App Check on the catalogue Function when enabled. |
| `ACCOUNT_APP_CHECK_ENFORCED` | `false` until preview verification | Requires valid App Check on account deletion when enabled. |

Enable these independently only after the preview domain, site key, token issuance, and failure monitoring have been verified.

## Test-only Functions values

The API contract harness supplies `CINESCOPE_TMDB_FIXTURE_TOKEN` and `TMDB_UPSTREAM_ORIGIN` only to the local Functions emulator. They direct requests to a fake in-process upstream and must not be configured in deployed environments.

## GitHub deployment configuration

Each protected `firebase-preview` or `firebase-production` environment requires the Firebase web values plus:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_DEPLOY_SERVICE_ACCOUNT`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `TMDB_APP_CHECK_ENFORCED`
- `ACCOUNT_APP_CHECK_ENFORCED`

The deployment workflow uses these identifiers with Google Workload Identity Federation. Do not add a service-account JSON key as a repository secret.

See [deployment/firebase-hosting.md](deployment/firebase-hosting.md) for project aliases, environment protection, secret creation, preview validation, production approval, rollback, and custom-domain steps.

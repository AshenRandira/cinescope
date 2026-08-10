# Firebase Hosting operations

## Scope and release boundary

This repository contains a deployment foundation, not an active Firebase release. It includes Hosting, the `tmdbApi` Function, environment-specific builds, local response checks, and a protected manual GitHub Actions workflow. It does not create Firebase projects, set secrets, connect a domain, configure GitHub environments, or deploy a preview or production version.

Keep preview and production in separate Firebase projects. Preview channels are publicly reachable URLs, so the preview project must contain only non-production test accounts and data.

## Local environment setup

Create environment files from the committed, placeholder-only templates:

```powershell
Copy-Item .env.preview.example .env.preview
Copy-Item .env.production.example .env.production
```

Populate each local file with the matching Firebase web-app values and optional App Check site key. Both populated files are ignored. Vite embeds every `VITE_` value in browser JavaScript; these values must never include the TMDB token, Firebase Admin credentials, service-account JSON, or any other server secret.

For local API development only, copy `functions/.secret.local.example` to the ignored `functions/.secret.local` and place the TMDB read token there. Production and preview use the independently configured `TMDB_READ_ACCESS_TOKEN` Secret Manager secret.

Build and validate each environment locally:

```powershell
npm.cmd run build:preview
npm.cmd run build:production
npm.cmd run build:functions
npm.cmd run check:bundle
npm.cmd run check:client-security
npm.cmd run check:hosting
npm.cmd run test:hosting
npm.cmd run test:api
```

`test:hosting` uses the fixed `demo-cinescope` project ID and the local Hosting emulator. `test:api` adds the Functions emulator and a fake local upstream. Neither command deploys, contacts a real Firebase project, or calls TMDB.

## Local Firebase aliases

Project aliases are an operator convenience only. The protected workflow always receives an explicit project ID from its GitHub environment.

```powershell
npx.cmd firebase-tools login
npx.cmd firebase-tools use --add
```

Create the aliases `preview` and `production`, each mapped to its separate Firebase project. The generated `.firebaserc` is intentionally ignored because this public repository does not prescribe project IDs. Confirm the selected alias before any local Firebase command:

```powershell
npx.cmd firebase-tools use
npx.cmd firebase-tools projects:list
```

Do not run a live deploy from a feature branch. Prefer the protected manual workflow after the phase is reviewed and reaches an approved branch.

## GitHub environment configuration

Create two GitHub environments:

- `firebase-preview`
- `firebase-production`

Configure these variables independently in each environment:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_DEPLOY_SERVICE_ACCOUNT`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_APP_CHECK_SITE_KEY`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `TMDB_APP_CHECK_ENFORCED`

Set `TMDB_APP_CHECK_ENFORCED` to `false` for the first preview verification. Change it to `true` only after the App Check provider, preview domain, and client token flow have been tested. The TMDB read token is not stored in GitHub; set `TMDB_READ_ACCESS_TOKEN` directly in Secret Manager for each Firebase project before the first approved Function deployment.

Protect `firebase-production` with required reviewers and restrict it to the `main` branch. Require the repository `Quality gates` check before production approval. Protect `firebase-preview` with at least one reviewer while the deployment process is being established.

## Keyless GitHub authentication

The deployment workflow uses GitHub's OIDC token and Google Workload Identity Federation to obtain short-lived credentials. Do not upload a service-account JSON key to GitHub.

In Google Cloud:

1. Create a workload identity pool and GitHub provider in the deployment project.
2. Restrict the provider by repository identity, and restrict production trust to the intended branch or protected GitHub environment.
3. Create a dedicated web/API deploy service account for each Firebase project.
4. Grant the GitHub principal `roles/iam.workloadIdentityUser` on only that service account.
5. Grant the deploy service account only the Hosting, Functions deployment, build/artifact, and runtime-service-account impersonation permissions demonstrated by a reviewed Firebase CLI dry run. Grant Secret Manager access to the Function runtime identity only for `TMDB_READ_ACCESS_TOKEN`.
6. Store the provider resource name and service-account email in the matching GitHub environment variables.

Do not grant Firebase Authentication Admin, Firestore Admin, Editor, or Owner to the deployment workflow. Authorized authentication domains and Firestore rules are separate reviewed operations.

## Manual deployment workflow

The `Firebase Hosting deployment` workflow has no push or pull-request trigger. From GitHub Actions, choose **Run workflow**, select a target, and enter the exact confirmation phrase:

- preview: `DEPLOY PREVIEW`
- production: `DEPLOY PRODUCTION`

The workflow repeats unit, Functions, coverage, lint, build, browser-security, API-emulator, bundle, and Hosting-config gates before authenticating. Preview creates a public channel named `manual-RUN_NUMBER` that expires after seven days and uses the pinned `tmdbApi` Function. Production deploys Functions and Hosting together and refuses any ref other than `refs/heads/main`.

The first deployment that introduces a pinned Function rewrite must be an explicitly approved live-channel deployment in the target Firebase project before preview channels can pin later Function revisions. Confirm the Blaze plan, secret, App Check setting, runtime identity, and budget alerts before that operation.

Before approving a production run, record the source commit, successful quality run, approver, Firebase project ID, and intended release window. After the run, record the Hosting version and public URL in the release log.

## Custom domain and HTTPS checklist

Connect the production domain through Firebase Console > Hosting only after the first approved production release:

1. Add the exact apex or subdomain and copy Firebase's verification records.
2. Remove conflicting A, AAAA, or CNAME records only after confirming who owns them.
3. Wait for Firebase to show the domain as connected and the certificate as provisioned.
4. Confirm HTTP redirects to HTTPS and the certificate covers the exact hostname.
5. Add the final domain to Firebase Authentication authorized domains.
6. Test `/`, `/search`, a movie deep link, a TV deep link, `/login`, and `/profile` with direct navigation and refresh.
7. Inspect CSP, cache, HSTS, frame, referrer, and content-type headers on both HTML and a hashed asset.

Example read-only checks:

```powershell
curl.exe -I https://YOUR_DOMAIN/
curl.exe -I https://YOUR_DOMAIN/movies/550
curl.exe -I https://YOUR_DOMAIN/assets/BUILT_ASSET.js
```

Default `web.app` and `firebaseapp.com` subdomains remain useful recovery endpoints. Firebase controls HSTS on its default subdomains; the configured HSTS value is intended for the connected custom domain.

## Rollback procedure

If a live release causes a user-facing, security, or data-access regression:

1. Stop further deployment approvals and declare an incident.
2. Confirm the failing Hosting version, source commit, affected routes, and whether Firebase Auth or Firestore is also affected.
3. In Firebase Console > Hosting > Release history, roll back to the last verified version. If an exact historical version must be restored, clone that version into a new release using the Firebase Hosting release controls.
4. Verify the default Firebase subdomain first, then the custom domain, direct deep links, authentication, library sync, CSP, and cache headers.
5. If the incident involves credentials or workflow trust, disable the workload identity provider or service account until access is reviewed.
6. Record the restored version, validation evidence, timeline, and follow-up owner.

Do not attempt to repair a broken production release by deploying an unreviewed local build. A forward fix must pass the normal quality and protected-environment gates.

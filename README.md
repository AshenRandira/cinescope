# CineScope

CineScope is a cinematic React archive for discovering films, television, and contributors through TMDB. Visitors can keep a local library; authenticated members can also synchronize that library with their Firebase account.

## Local development

Requirements:

- Node.js 22 or newer
- A TMDB API read access token
- A Firebase web app with Email/Password Authentication enabled
- Cloud Firestore when account-backed library sync is required
- Cloud Functions when secure account deletion is required
- Java 21 or newer when running Firebase emulator validation

Create `.env.local` from `.env.example` and replace the Firebase placeholders. Store the TMDB token only in the ignored Functions secret file:

```powershell
Copy-Item .env.example .env.local
Copy-Item functions/.secret.local.example functions/.secret.local
npm.cmd install
npm.cmd ci --prefix functions
```

Start the local Functions API in one terminal and Vite in another:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev
```

Vite proxies `/api/tmdb/**` to the local Functions emulator. The browser never receives the TMDB bearer token. Firebase web configuration identifies the project; Firestore Security Rules protect user data. Never add a Firebase Admin service-account file, TMDB token, or other server credential to browser environment variables.

## Firebase setup

1. Create or select a Firebase project and register a web app.
2. Enable Email/Password in Authentication > Sign-in method.
3. Create a Cloud Firestore database.
4. Copy the web app values into `.env.local`.
5. Deploy the repository rules to the same project:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

Library records are stored at `users/{uid}/library/{movie:id|tv:id}`. Rules only allow an authenticated user to access their own records and reject unexpected fields or invalid library values. TV records can also carry bounded episode checkpoints, which drive season rollups and the continue-watching shelf without introducing another database collection. See [the library data model](docs/library-data-model.md).

The browser archive remains the immediate source of truth. Library and episode-progress changes write locally before navigation; on sign-in, guest records move into a user-scoped archive, reconcile by their latest update time, and then sync to Firestore. If the network or Firestore configuration is unavailable, edits stay local and the interface exposes a retry action.

The protected profile also supports verification-email resend/status refresh, password changes after current-password reauthentication, a versioned JSON account export, and permanent account deletion. Deletion uses the Firebase-issued identity token with the `deleteAccount` callable, recursively removes the member's Firestore tree, deletes the Firebase Authentication user, and then clears the user-scoped browser archive. CineScope does not issue or store a parallel JWT. See [the account security boundary](docs/security/account-security.md).

## Validation

Install the Chromium test browser once after installing dependencies:

```powershell
npx.cmd playwright install chromium
```

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run test:functions
npm.cmd run lint
npm.cmd run build
npm.cmd run build:functions
npm.cmd run check:bundle
npm.cmd run check:client-security
npm.cmd run check:hosting
npm.cmd run test:hosting
npm.cmd run test:api
npm.cmd run test:e2e
npm.cmd run test:emulators
git diff --check origin/develop...HEAD
```

The lint command includes JSX accessibility rules and treats warnings as failures. Before a release, also verify the skip link, route focus, tabs, search suggestions, and dialogs with keyboard-only navigation in a browser.

The bundle check reads the generated `dist/index.html` and fails if the initial JavaScript and CSS payload exceeds the recorded raw or gzip budgets. Run it after the production build.

The public Playwright command builds the application in the committed `e2e` mode, starts a local production preview, and runs deterministic Chromium journeys. Firebase is disabled and every same-origin catalogue API response is intercepted, so the suite needs no Firebase or TMDB credential.

The API test starts a fake local TMDB server and the Functions plus Hosting emulators, then verifies the `/api/tmdb/**` rewrite, allowlist, cache policy, method rejection, and secret-bearing upstream request. It never contacts TMDB. The authenticated emulator command builds in the committed `emulator` mode, starts local Authentication, Firestore, and Functions emulators under the fixed `demo-cinescope` project ID, validates Firestore Security Rules, and runs authenticated Chromium journeys including TV-progress synchronization, password change, and destructive account cleanup. See [docs/quality-assurance.md](docs/quality-assurance.md) for the full matrix and remaining human checks.

## Continuous integration

The `Quality gates` GitHub Actions workflow runs on every branch push, pull requests targeting `develop` or `main`, and manual dispatch. It uses Node.js 24, Java 21, both committed npm lockfiles, and validates the frontend, Functions contracts, browser security scan, Hosting-to-Functions API, public Chromium journeys, Firestore rules, and authenticated emulator journeys without Firebase or TMDB secrets. Failed browser runs retain traces and screenshots for seven days.

## Hosting and deployment

Firebase Hosting publishes `dist`, sends `/api/tmdb/**` to the `tmdbApi` Function before the React Router fallback, permits the Firebase callable origin for authenticated account deletion, applies reviewed browser security headers, and caches Vite's hashed assets immutably. The TMDB Function reads `TMDB_READ_ACCESS_TOKEN` from Secret Manager; it is not a Vite build value. See [the TMDB API boundary guide](docs/security/tmdb-api-boundary.md).

The `Firebase Hosting deployment` workflow is manual and protected. It uses GitHub OIDC and Google Workload Identity Federation for short-lived credentials, creates seven-day preview channels, and permits a live production release only from `main`. No Firebase project ID, `.firebaserc`, service-account key, or active deployment is committed by this foundation.

Before enabling that workflow, follow [the Firebase Hosting operations guide](docs/deployment/firebase-hosting.md). Monitoring ownership and response expectations are in [the incident-response runbook](docs/operations/monitoring-and-incident-response.md).

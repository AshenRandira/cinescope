# CineScope

CineScope is a cinematic React archive for discovering films, television, and contributors through TMDB. Visitors can keep a local library; authenticated members can also synchronize that library with their Firebase account.

## Local development

Requirements:

- Node.js 20 or newer
- A TMDB API read access token
- A Firebase web app with Email/Password Authentication enabled
- Cloud Firestore when account-backed library sync is required
- Java 21 or newer when running Firebase emulator validation

Create `.env.local` from `.env.example` and replace every placeholder:

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Vite prints the local URL after startup. Firebase web configuration identifies the project; Firestore Security Rules protect user data. Never add a Firebase Admin service-account file or other server credential to this client repository.

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

Library records are stored at `users/{uid}/library/{movie:id|tv:id}`. Rules only allow an authenticated user to access their own records and reject unexpected fields or invalid library values.

The browser archive remains the immediate source of truth. On sign-in, guest records move into a user-scoped local archive, reconcile by their latest update time, and then sync to Firestore. If the network or Firestore configuration is unavailable, edits stay local and the interface exposes a retry action.

## Validation

Install the Chromium test browser once after installing dependencies:

```powershell
npx.cmd playwright install chromium
```

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
npm.cmd run check:bundle
npm.cmd run test:e2e
npm.cmd run test:emulators
git diff --check origin/develop...HEAD
```

The lint command includes JSX accessibility rules and treats warnings as failures. Before a release, also verify the skip link, route focus, tabs, search suggestions, and dialogs with keyboard-only navigation in a browser.

The bundle check reads the generated `dist/index.html` and fails if the initial JavaScript and CSS payload exceeds the recorded raw or gzip budgets. Run it after the production build.

The public Playwright command builds the application in the committed `e2e` mode, starts a local production preview, and runs deterministic Chromium journeys. That mode uses a non-secret placeholder TMDB token, disables Firebase, and intercepts every external catalogue response.

The emulator command builds in the committed `emulator` mode, starts local Authentication and Firestore emulators under the fixed `demo-cinescope` project ID, validates Firestore Security Rules, and runs authenticated Chromium journeys. Its configuration contains only non-secret demo values and cannot access a real Firebase project. The first local run downloads the Firestore emulator runtime. See [docs/quality-assurance.md](docs/quality-assurance.md) for the full matrix and remaining human checks.

## Continuous integration

The `Quality gates` GitHub Actions workflow runs on every branch push, pull requests targeting `develop` or `main`, and manual dispatch. It uses Node.js 24, Java 21, and the committed npm lockfile, then runs unit tests, coverage thresholds, accessibility-aware lint, the production build, the initial bundle budget, public Chromium journeys, Firestore rules tests, and authenticated emulator journeys without Firebase or TMDB secrets. Failed browser runs retain traces and screenshots for seven days.

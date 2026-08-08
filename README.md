# CineScope

CineScope is a cinematic React archive for discovering films, television, and contributors through TMDB. Visitors can keep a local library; authenticated members can also synchronize that library with their Firebase account.

## Local development

Requirements:

- Node.js 20 or newer
- A TMDB API read access token
- A Firebase web app with Email/Password Authentication enabled
- Cloud Firestore when account-backed library sync is required

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

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
git diff --check origin/develop...HEAD
```

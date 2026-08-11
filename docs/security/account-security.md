# Account security and deletion boundary

## Identity and fresh credentials

CineScope relies on Firebase Authentication as its only member identity system. The browser does not mint, store, or transmit a second CineScope JWT. Firebase callable requests automatically carry the signed-in user's Firebase ID token and, when configured, an App Check token.

Email verification uses Firebase's verification-email flow. Members can send or resend the message and refresh their profile after opening the action link. Password changes require the member to enter the current password; the browser creates a Firebase credential, reauthenticates the active user, and then asks Firebase Authentication to update the password. CineScope does not persist either password.

## Personal data export

The profile can download a schema-versioned JSON snapshot. Version 4 contains:

- Firebase profile metadata already visible to the member;
- the current device's reconciled library records;
- bounded TV episode progress and the current resume pointer when present;
- the current favourite-genre, preferred-medium, and original-language discovery preferences;
- the current bounded not-interested recommendation-feedback snapshot;
- the current library synchronization status;
- an export timestamp and product/schema identifiers.

The export is generated locally. It does not contain passwords, Firebase ID tokens, App Check tokens, server credentials, or TMDB credentials. When cloud sync is paused, the export still represents the current browser snapshot; the included sync status makes that condition explicit.

## Permanent deletion sequence

Deletion requires both the member's current password and the exact typed phrase `DELETE MY ACCOUNT`. The operation then follows this order:

1. Firebase reauthenticates the active email/password user.
2. The browser invokes the `deleteAccount` callable in `asia-east1` with the refreshed Firebase identity.
3. The callable rejects unauthenticated requests and ID tokens whose `auth_time` is more than five minutes old.
4. The Admin Firestore client recursively deletes the document tree rooted at `users/{uid}`, including the `library` and `preferences` subcollections.
5. Only after data cleanup succeeds, the Admin Auth client deletes that same `uid`.
6. The browser clears the user-scoped local archive, discovery-preference snapshot, recommendation feedback, and pending-deletion queue, signs out the local client, and returns to account access.

Data cleanup runs before Auth deletion so a Firestore failure leaves the account available for a safe retry. If Auth deletion fails after cleanup, the normalized UI asks the still-existing member to retry; the operation is idempotent with respect to the already-empty Firestore tree. Logs contain only the user reference, authentication age, operation category, and outcome. They must never contain email addresses, passwords, tokens, library contents, or exported data.

## App Check rollout

`ACCOUNT_APP_CHECK_ENFORCED` defaults to `false` so local emulators and the first controlled preview can establish the baseline. For each preview and production project:

1. Register the exact hosted domains with the approved App Check provider.
2. Confirm the web app initializes App Check and the callable receives valid attestations in preview.
3. Set the protected GitHub environment variable `ACCOUNT_APP_CHECK_ENFORCED=true`.
4. Re-run the disposable preview-account deletion test and review missing/invalid/replayed token behavior before production approval.

When enforcement is active, the callable both enforces and consumes the App Check token. Firebase Authentication remains mandatory regardless of the App Check setting.

## Firebase project prerequisites

Before an approved hosted release:

- enable Email/Password authentication;
- review the verification and password-reset templates, authorized domains, sender identity, and action-link destination;
- deploy the `deleteAccount` Function in the same project used by the web app;
- verify the Function runtime identity has least-privilege access to recursively delete the member Firestore tree and delete Firebase Authentication users;
- keep the GitHub deployment identity separate from the Function runtime identity;
- test only with a disposable preview account before enabling production enforcement.

The local contract, component, and emulator suites cover the security logic without contacting a real Firebase project. Real email delivery, hosted App Check attestation, IAM, and runtime configuration remain controlled preview checks.

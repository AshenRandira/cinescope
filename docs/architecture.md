# CineScope architecture

## System boundary

CineScope is a React 19 single-page application built with TypeScript and Vite. Firebase provides Authentication, Firestore, App Check integration points, Functions, and Hosting. TMDB remains the catalogue source, but its read token exists only behind the `tmdbApi` Firebase Function.

The production request path is:

```text
Browser -> Firebase Hosting -> /api/tmdb/** rewrite -> tmdbApi Function -> TMDB
Browser -> Firebase Auth and Firestore SDKs -> authenticated user-scoped Firebase services
```

The browser never receives the TMDB token or Firebase Admin credentials. CineScope does not issue a second application JWT; authenticated operations use Firebase-issued identity tokens.

## Frontend composition

- `src/app` owns the router, React Query client, and application entry composition.
- `src/components` contains shared branding, feedback, layout, metadata, and interface primitives.
- `src/features` owns domain slices for authentication, discovery, search, movies, television, people, library tracking, preferences, profiles, and recommendations.
- `src/lib/tmdb` is the typed same-origin catalogue client and image URL layer.
- `src/types` contains shared TMDB and application contracts.
- `src/pages` contains cross-cutting information, policy, not-found, and release-support pages.

All substantial application routes except the homepage are lazy modules. The root shell owns navigation, route focus transfer, pending announcements, metadata synchronization, global credits, and unexpected-error recovery.

## Local-first archive

Library records, episode progress, preferences, and recommendation feedback write to browser storage first. Guests retain a useful private archive without an account. After authentication, user-scoped providers reconcile local records with Firestore using update timestamps and continue to preserve local edits if cloud synchronization is unavailable.

The Firestore model is documented in [library-data-model.md](library-data-model.md), [user-preferences.md](user-preferences.md), and [recommendations.md](recommendations.md). Security Rules constrain records to their authenticated owner, validate fields and bounds, and retain compatibility with earlier library records.

## Authentication and account lifecycle

Firebase email/password Authentication supplies registration, sign-in, persistence, verification-email actions, password reset, reauthentication, and password changes. The profile route is protected through React Router. Account export is created in the browser. Permanent deletion calls the authenticated `deleteAccount` Function, which validates recent authentication, recursively removes the member Firestore tree, deletes the Authentication user, and then allows the client to clear user-scoped local data.

See [security/account-security.md](security/account-security.md) for the trust boundary and deletion order.

## Discovery and recommendations

React Query owns catalogue request caching and request state. Search supports typed multi-record lookup and a deterministic natural-language parser that converts a bounded vocabulary into visible, editable TMDB Discover filters. Archive recommendations remain deterministic and explain their preference, progress, mood, and feedback signals. No external AI or machine-learning service receives viewing requests or archive data.

## Server and deployment

`functions/src` contains the allowlisted TMDB proxy and account-deletion callable. The proxy validates paths and parameters, applies timeouts and caching, normalizes errors, and emits structured operational logs without raw queries or credentials.

Firebase Hosting publishes `dist`, rewrites catalogue requests before the SPA fallback, prevents application-shell caching, caches hashed Vite assets immutably, and applies the reviewed CSP and browser security headers. Preview and production deployment are manual protected GitHub Actions environments using short-lived Google Workload Identity Federation credentials.

See [deployment/firebase-hosting.md](deployment/firebase-hosting.md) and [operations/monitoring-and-incident-response.md](operations/monitoring-and-incident-response.md).

## Quality boundaries

Vitest covers pure logic and components. Firebase Emulator Suite covers Authentication, Firestore Rules, synchronization, and account deletion. Playwright covers deterministic public and authenticated journeys. CI also enforces coverage, accessibility lint, the browser security boundary, Hosting policy, initial/lazy/deferred bundle budgets, and V1 metadata/documentation requirements.

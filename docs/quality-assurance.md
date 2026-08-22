# CineScope quality assurance

## Automated layers

CineScope uses six deterministic validation layers:

1. Vitest exercises pure data behavior.
2. React Testing Library and jsdom exercise stable component, form, and routing behavior.
3. Playwright exercises public journeys against a local production preview in Chromium.
4. Firebase Emulator Suite exercises authenticated integration journeys and deployed Firestore Security Rules without touching a real project.
5. Firebase Hosting Emulator exercises the built application shell, SPA rewrites, browser security headers, and cache policy without deploying.
6. Functions unit tests and local Functions emulator journeys exercise the TMDB route allowlist, server-only authentication, account-deletion identity and recent-login checks, recursive data cleanup ordering, normalized failures, cache controls, and method rejection.

The component suite currently covers header-search validation, keyboard selection, natural-language request routing and its explicit title-search override, library save/watch/favourite/rating controls, episode-progress controls and rollups, preference and recommendation-feedback parsing, profile editing, authentication-form validation, protected-route behavior, route focus transfer, verification controls, password change, account export, and explicit destructive confirmation. Pure tests also cover intent parsing, URL state, Discover query construction, unsupported media mappings, mixed result projection, and match explanations. Coverage enforcement includes the library, TV progress, preference, recommendation mood/feedback, and archive-ranking engines plus the authentication helpers, protected route, library controls, and account export contract.

The browser suite covers these public journeys:

- search results to a movie record;
- header keyboard suggestion to a movie record;
- natural-language viewing request to editable recommendation filters and an explained result;
- television register to series, season, episode, and back;
- episode checkpoint to season rollup, reload, continue-watching shelf, and next episode;
- media-dialog open/close with focus restoration;
- unknown and malformed deep-route handling.

`e2e/fixtures.ts` intercepts every same-origin catalogue request used by these journeys. `.env.e2e` deliberately leaves Firebase and App Check unconfigured, so CI does not depend on real credentials, accounts, or live third-party data.

The emulator layer uses the fixed `demo-cinescope` project ID and non-secret values from `.env.emulator`. Authentication runs on local port `9599` to avoid Windows excluded-port ranges that commonly include Firebase's conventional `9099`. It covers:

- owner create, query, update, read, and delete access;
- unauthenticated and cross-user denial;
- malformed record rejection;
- legacy record compatibility and bounded TV-progress validation;
- owner-only discovery-preference CRUD and malformed preference rejection;
- owner-only bounded recommendation-feedback CRUD and malformed feedback rejection;
- guest-save migration after account registration;
- protected-route return after sign-in;
- authenticated save, watch, favourite, and rating synchronization;
- cloud restoration after the member-local cache is cleared and the page reloads;
- offline local edits followed by cloud reconciliation on reconnect;
- synchronized cloud deletion;
- authenticated TV-progress synchronization and continue-watching restoration;
- local-first discovery-preference synchronization, cloud restoration, and preference-aware Discover explanation;
- mood-aware archive re-ranking, inspectable recommendation reasons, not-interested removal, and cloud feedback restoration;
- current-password reauthentication and password change;
- rejection of the previous password;
- callable deletion of the Firebase Auth user and nested Firestore archive, including both preference documents;
- cleanup of user-scoped browser archive, preference, and recommendation-feedback data after successful deletion.

The suite clears Authentication and Firestore before each browser journey, runs the Functions emulator locally, and intercepts TMDB with deterministic fixtures. It never uses a personal Firebase account, Firebase credentials, live project data, or live catalogue data.

The Hosting layer builds in `preview` mode under the fixed `demo-cinescope` project ID. It asserts that `/` and `/movies/550` return the same application shell, document responses carry the reviewed CSP without direct TMDB connectivity, and Vite's hashed JavaScript carries the one-year immutable policy.

The API layer supplies an in-process fixture token to the Functions emulator and a fake upstream HTTP server. It proves the token is attached only to the upstream server request, verifies the Hosting rewrite and canonical cache behavior, and rejects unsupported routes, parameters, and methods. The client-security scan also fails if browser sources, environment templates, workflows, or built assets contain the former Vite token variable or the direct TMDB API origin.

## Commands

Run the fast suite during development:

```powershell
npm.cmd test
```

Run the complete phase gate:

```powershell
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

Install Chromium once on a new workstation before the E2E command:

```powershell
npx.cmd playwright install chromium
```

Java 21 or newer is also required for the Firestore emulator. The first `test:emulators` run downloads and caches Firebase's local Firestore runtime; later runs reuse it.

Failure traces and screenshots are written under `test-results/`; the optional HTML report is written under `playwright-report/`. Both locations are ignored by Git.

## Manual release checklist

Automation does not replace the following human checks:

- keyboard-only pass across desktop and mobile navigation;
- NVDA with Chrome or Firefox, and VoiceOver with Safari where available;
- browser zoom at 200% and 400%;
- narrow mobile layouts and physical touch targets;
- reduced-motion preference behavior;
- Chrome, Firefox, and Safari smoke testing;
- two-device Firestore synchronization and account switching;
- preference reconciliation across two active devices;
- recommendation-feedback reconciliation across two active devices;
- password-reset email delivery;
- verification-email delivery, template branding, and action-link return behavior;
- account export inspection with a non-production representative archive;
- account deletion smoke testing in an approved disposable staging account;
- hosted deep-link refresh behavior;
- production CSP and security-header verification.

## Deferred test work

The remaining high-value expansion is multi-device and account-switch synchronization, followed by authenticated Firefox/WebKit coverage and a staging-project smoke test for hosted Firebase, password-reset/verification email delivery, App Check enforcement, and deletion with a disposable account. Those checks require either multiple browser contexts, additional browser runtimes, or explicitly approved non-production external infrastructure.

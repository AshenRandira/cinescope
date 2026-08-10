# CineScope quality assurance

## Automated layers

CineScope uses four deterministic validation layers:

1. Vitest exercises pure data behavior.
2. React Testing Library and jsdom exercise stable component, form, and routing behavior.
3. Playwright exercises public journeys against a local production preview in Chromium.
4. Firebase Emulator Suite exercises authenticated integration journeys and deployed Firestore Security Rules without touching a real project.

The component suite currently covers header-search validation and keyboard selection, library save/watch/favourite/rating controls, authentication-form validation, protected-route behavior, and route focus transfer. Coverage enforcement includes the existing library and recommendation engines plus the authentication helpers, protected route, and library controls.

The browser suite covers these public journeys:

- search results to a movie record;
- header keyboard suggestion to a movie record;
- television register to series, season, episode, and back;
- media-dialog open/close with focus restoration;
- unknown and malformed deep-route handling.

`e2e/fixtures.ts` intercepts every TMDB request used by these journeys. `.env.e2e` contains only a fake token and deliberately leaves Firebase unconfigured, so CI does not depend on real credentials, accounts, or live third-party data.

The emulator layer uses the fixed `demo-cinescope` project ID and non-secret values from `.env.emulator`. It covers:

- owner create, query, update, read, and delete access;
- unauthenticated and cross-user denial;
- malformed record rejection;
- guest-save migration after account registration;
- protected-route return after sign-in;
- authenticated save, watch, favourite, and rating synchronization;
- cloud restoration after the member-local cache is cleared and the page reloads;
- offline local edits followed by cloud reconciliation on reconnect;
- synchronized cloud deletion.

The suite clears both emulators before each browser journey and intercepts TMDB with deterministic fixtures. It never uses a personal Firebase account, Firebase credentials, or live catalogue data.

## Commands

Run the fast suite during development:

```powershell
npm.cmd test
```

Run the complete phase gate:

```powershell
npm.cmd run test:coverage
npm.cmd run lint
npm.cmd run build
npm.cmd run check:bundle
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
- password-reset email delivery;
- hosted deep-link refresh behavior;
- production CSP and security-header verification.

## Deferred test work

The remaining high-value expansion is multi-device and account-switch synchronization, followed by authenticated Firefox/WebKit coverage and a staging-project smoke test for hosted Firebase and password-reset email delivery. Those checks require either multiple browser contexts, additional browser runtimes, or explicitly approved non-production external infrastructure.

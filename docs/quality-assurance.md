# CineScope quality assurance

## Automated layers

CineScope uses three deterministic validation layers:

1. Vitest exercises pure data behavior.
2. React Testing Library and jsdom exercise stable component, form, and routing behavior.
3. Playwright exercises public journeys against a local production preview in Chromium.

The component suite currently covers header-search validation and keyboard selection, library save/watch/favourite/rating controls, authentication-form validation, protected-route behavior, and route focus transfer. Coverage enforcement includes the existing library and recommendation engines plus the authentication helpers, protected route, and library controls.

The browser suite covers these public journeys:

- search results to a movie record;
- header keyboard suggestion to a movie record;
- television register to series, season, episode, and back;
- media-dialog open/close with focus restoration;
- unknown and malformed deep-route handling.

`e2e/fixtures.ts` intercepts every TMDB request used by these journeys. `.env.e2e` contains only a fake token and deliberately leaves Firebase unconfigured, so CI does not depend on real credentials, accounts, or live third-party data.

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
git diff --check origin/develop...HEAD
```

Install Chromium once on a new workstation before the E2E command:

```powershell
npx.cmd playwright install chromium
```

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
- offline-to-reconnect library behavior;
- denied Firestore-rule behavior;
- password-reset email delivery;
- hosted deep-link refresh behavior;
- production CSP and security-header verification.

## Deferred test work

Firebase Emulator Suite coverage remains a separate phase because it requires emulator configuration, rules fixtures, and authenticated integration flows. That phase should add user-isolation, guest migration, synchronization, deletion, offline/reconnection, protected-return, and signed-in persistence journeys without using personal production accounts.

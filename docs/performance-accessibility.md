# Performance and accessibility hardening

This guide records CineScope's repeatable release-hardening checks. It is a baseline for regression detection, not a claim that laboratory measurements replace testing with people or real devices.

## Production bundle baseline

Run a production build before measuring:

```powershell
npm.cmd run build
npm.cmd run check:bundle
```

The Phase 14 baseline on 22 August 2026 is:

| Boundary | Largest measured payload | Enforced budget |
| --- | ---: | ---: |
| Initial JavaScript and CSS module graph | 532.21 kB raw / 153.47 kB gzip | 550 kB raw / 170 kB gzip |
| Lazy application route increment | 72.55 kB raw / 17.59 kB gzip | 100 kB raw / 30 kB gzip |
| Deferred dependency entry | 555.25 kB raw / 160.34 kB gzip | 600 kB raw / 180 kB gzip |

The largest route increment is the movie detail view. The largest deferred dependency is Firestore. Firestore remains a dynamic entry and is not counted in the initial graph. The budget script follows static imports for each lazy route, subtracts assets already present in the initial graph, and includes route CSS.

Budgets deliberately leave limited headroom. A dependency upgrade or feature that exceeds a boundary should be investigated and split when practical; do not raise a limit only to make the check pass.

## Route resilience

Every client-side navigation exposes an indeterminate projector line and a polite screen-reader status while React Router is loading the next route. Once the new path commits, focus moves to `main` so keyboard and assistive-technology users start at the new view.

The root route also has an error boundary for unexpected loader, lazy-import, or render failures. It:

- presents a readable recovery view instead of an empty screen;
- offers reload and return-to-archive actions with at least 48 CSS-pixel control height;
- avoids rendering raw exception messages or stack traces;
- preserves a specific safe message for route-level 404 responses.

## Automated accessibility checks

Run these checks during development:

```powershell
npm.cmd run lint
npm.cmd test -- src/components/layout/AppShell.test.tsx src/components/feedback/RouteErrorBoundary.test.tsx
```

The linter enables JSX accessibility rules and fails on warnings. The route tests verify focus transfer, pending-state announcement, visual pending-state activation, recovery rendering, and suppression of private diagnostic text.

Static source review also checks that authored interface text does not reintroduce 7–11 pixel values or clickable `div`/`span` elements. Shared typography tokens keep micro, label, caption, and small copy at 12, 12.8, 14, and 15.2 CSS pixels respectively.

## Manual browser matrix

Complete these checks before a release candidate is approved:

1. Navigate every desktop header and mobile bottom-navigation destination using only Tab, Shift+Tab, Enter, Space, and Escape where relevant.
2. Confirm the skip link appears on focus and places focus on the main landmark.
3. Throttle the browser network, navigate to an uncached route, and confirm the top projector line appears. With a screen reader, confirm "Loading the next archive view" is announced once.
4. Test header search suggestions with arrow keys, Escape, Enter, and a screen reader. Verify active-option and result-count announcements remain understandable.
5. Use 200% and 400% zoom at a 1280 CSS-pixel desktop viewport. Confirm no essential content or controls are clipped horizontally.
6. Test 320, 375, 768, 1024, and 1440 CSS-pixel viewport widths. Confirm primary touch controls are at least 44 by 44 CSS pixels and the mobile navigation does not cover page actions.
7. Enable reduced motion. Confirm route progress remains visible without travelling animation and all scene transitions settle immediately.
8. Enable increased contrast and forced-colors modes where supported. Confirm focus rings, current navigation, errors, and projector actions remain distinguishable.
9. Smoke-test current Chrome, Firefox, and Safari. Include NVDA with Chrome or Firefox and VoiceOver with Safari when those environments are available.
10. In a development-only error fixture or browser test, force a route render/import failure. Confirm the recovery view is readable, raw diagnostics are absent, reload works, and Return to the archive reaches `/`.

Human screen-reader, Safari, physical-device, and throttled-network checks remain outside automated CI and must be recorded during release-candidate review.

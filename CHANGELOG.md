# Changelog

All notable CineScope changes are recorded here. The project has not been tagged or released as V1.

## Unreleased

### Added

- Living Archive homepage, movie and television discovery registers, multi-type search, contributor pages, and detailed movie, series, season, and episode records.
- Deterministic natural-language viewing requests with editable filters and match explanations.
- Local-first saved, watched, favourite, rating, episode-progress, preference, mood, and recommendation-feedback records.
- Firebase email/password accounts, profile management, verification controls, password reset/change, JSON export, and permanent account deletion.
- Firestore synchronization, guest migration, offline fallback, reconciliation, and owner-only Security Rules.
- Same-origin Firebase Functions boundary for the TMDB token and authenticated account deletion.
- Firebase Hosting, preview/production workflow, browser security headers, caching policy, monitoring runbook, and rollback documentation.
- Vitest, React Testing Library, Playwright, Firebase Emulator Suite, coverage enforcement, bundle budgets, release-metadata checks, and GitHub Actions quality gates.
- Route loading feedback, focus transfer, reduced-motion behavior, root error recovery, public credits, privacy, terms, and accessibility information.
- Web application manifest, robots policy, dynamic canonical/social metadata, favicon, and 1200x630 social preview.

### Security

- Removed the TMDB credential from the browser boundary and prohibited direct TMDB API connections through CSP and automated scans.
- Added bounded server routes and parameters, normalized errors, timeouts, cache policy, structured logs, and optional App Check enforcement.
- Added recent-login checks, recursive user-data cleanup, account export exclusions, and protected production deployment foundations.

### Known release blockers

- Public deployment, domain connection, legal/operator approval, a private contact channel, production App Check, and the manual release matrix remain pending.
- No V1 tag or GitHub release has been created.

# CineScope V1 readiness

Snapshot date: 23 August 2026

Candidate branch: `fix/final-ux-audit`

Release status: **not approved for public deployment or V1 tagging**

## Repository-complete foundations

- [x] Feature-complete movie, television, contributor, search, discovery, library, preference, recommendation, and account experiences.
- [x] Local-first archive with authenticated Firestore synchronization and backwards-compatible records.
- [x] Controlled server-side TMDB credential boundary and authenticated account-deletion Function.
- [x] Unit, component, Functions, Firestore Rules, public Playwright, and authenticated emulator coverage.
- [x] Coverage thresholds, accessibility lint, bundle budgets, browser-security scan, Hosting/API contracts, and CI quality gates.
- [x] Firebase Hosting and protected manual preview/production workflow foundation.
- [x] Route loading, focus, reduced motion, responsive reflow, touch-target, and unexpected-error safeguards.
- [x] Document descriptions, dynamic canonical and social metadata, web manifest, robots policy, favicon, social preview, and route titles.
- [x] TMDB logo and required attribution in a globally reachable credits route and application footer.
- [x] Privacy/data, release-candidate terms, accessibility, architecture, environment, deployment, operations, changelog, and draft release-note documentation.
- [x] New-tab external links include opener protection.
- [x] Social/community functionality is explicitly deferred for V1 with documented product, data, security, privacy, moderation, and approval boundaries.
- [x] Automated UX audit covers 17 public routes at desktop and mobile widths, including readability, semantics, accessible control names and sizes, resource/runtime failures, and fixed-navigation focus clearance.

## Human verification required

- [ ] Keyboard-only review of every primary route and account workflow.
- [ ] NVDA with Chrome or Firefox and VoiceOver with Safari.
- [ ] Chrome, Firefox, and Safari smoke tests.
- [ ] 200% and 400% browser zoom, reduced motion, increased contrast, and forced colors.
- [ ] Physical mobile layouts and touch targets.
- [ ] Two-device Firestore reconciliation, account switching, and offline-to-online recovery.
- [ ] Password-reset and verification-email delivery, branding, and return links in an approved staging project.
- [ ] Hosted deep-link refresh, CSP, security headers, manifest installation, and social-card unfurl validation.
- [ ] Disposable staging-account export and permanent deletion.

## External configuration and decisions

- [ ] The operator approves the Privacy and Terms text for the intended jurisdiction and usage model. These repository drafts are not a substitute for professional legal review.
- [ ] Publish a private privacy/support contact channel. Public GitHub issues must not receive account or personal data.
- [ ] Decide and add the repository software-license file before describing the source as open source.
- [ ] Create or confirm separate preview and production Firebase projects and web applications.
- [ ] Configure authorized Authentication domains and action-link return domains.
- [ ] Configure branded Authentication email templates and sender settings.
- [ ] Create `TMDB_READ_ACCESS_TOKEN` in each selected Firebase project.
- [ ] Configure Workload Identity Federation, protected GitHub environments, required reviewers, and deployment variables.
- [ ] Register App Check site keys, validate preview token issuance, then decide enforcement timing independently for catalogue and account deletion.
- [ ] Configure monitoring alerts for Functions errors/latency, Firebase quota or abuse, Authentication anomalies, Hosting failures, and App Check rejection.
- [ ] Connect the approved domain, verify DNS/HTTPS, then validate canonical URLs and social unfurls from that domain.
- [ ] Confirm the production use remains compliant with the current TMDB API terms and attribution requirements.

## Release authorization sequence

1. Complete the full automated matrix on the exact candidate commit.
2. Deploy an explicitly approved preview, never production, and record the human verification results.
3. Resolve every release-blocking issue or record an approved exception with an owner.
4. Obtain explicit approval for production deployment.
5. Verify the deployed version and monitoring before announcing availability.
6. Obtain separate explicit approval before creating `v1.0.0` or a GitHub release.

Rollback and incident procedures are documented in [../deployment/firebase-hosting.md](../deployment/firebase-hosting.md) and [../operations/monitoring-and-incident-response.md](../operations/monitoring-and-incident-response.md).

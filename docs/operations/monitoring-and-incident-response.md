# Monitoring and incident response

## Ownership and readiness

Before the first production deployment, assign a named primary owner and backup owner for Hosting, Firebase Authentication, Firestore, the custom domain, and GitHub deployment access. Store contact details in the private operations register rather than this public repository.

The production readiness review must confirm:

- billing budgets and quota alerts have an active recipient;
- Firebase and Google Cloud status dashboards are bookmarked;
- Hosting release history and rollback access are tested by the operators;
- Authentication usage, error rates, and authorized domains are reviewed;
- Firestore usage, denied-request trends, and rules releases are reviewed;
- TMDB quota and error behavior have an owner;
- GitHub environment approvers and workload-identity trust are current;
- DNS ownership and registrar recovery access are documented privately.

No third-party browser error-monitoring vendor is selected in Phase 16A. If one is introduced, review its data retention, region, source-map access, sampling, and personally identifiable information handling before enabling it. Never send passwords, Firebase tokens, TMDB tokens, full email addresses, library contents, or raw API responses to telemetry.

## Severity guide

- **SEV-1:** account isolation failure, credential exposure, malicious deployment, or broad production outage.
- **SEV-2:** authentication or library synchronization unavailable for many users, broken primary discovery routes, or severe performance regression.
- **SEV-3:** limited route, browser, content, or visual regression with a working alternative.

## Response flow

1. **Detect:** record the reporter, UTC time, affected URL, browser, account state, and visible error without collecting secrets.
2. **Triage:** reproduce on the Firebase default domain and custom domain; compare the active Hosting version with the last known-good release; check Firebase, Google Cloud, GitHub, DNS, and TMDB status.
3. **Contain:** pause deployment approvals. For suspected workflow compromise, disable the provider or service account and revoke unexpected access. For a Hosting regression, initiate the documented rollback.
4. **Recover:** validate root and deep routes, sign-in/out, an authenticated library action, security headers, cache behavior, and at least one supported desktop and mobile viewport.
5. **Communicate:** provide short time-stamped status updates appropriate to severity and avoid speculative causes.
6. **Close:** preserve relevant workflow, Hosting-version, and audit evidence; document cause, impact, recovery, and prevention tasks with owners and dates.

## Security-specific checks

For suspected account or data isolation issues:

- stop production deployment access;
- preserve Firebase Authentication and Firestore audit evidence;
- verify the active Firestore Rules release and run the local rules suite;
- test unauthenticated and cross-user denial with controlled test accounts;
- review Authentication authorized domains and unexpected provider changes;
- rotate or revoke only the affected credentials, then verify recovery before restoring access.

For suspected client-token exposure, remember that Firebase web configuration and all `VITE_` values are shipped to browsers. Treat leaked Admin credentials, service-account keys, private signing material, or unapproved backend tokens as incidents; do not misclassify normal Firebase web-app identifiers as secrets.

## Post-release watch

For each production release, monitor the first 30 minutes actively and review the following again after 24 hours:

- Hosting availability and traffic changes;
- client load failures and CSP violations, when privacy-reviewed reporting exists;
- Authentication success/failure changes;
- Firestore reads, writes, denied operations, and quota usage;
- TMDB failures and quota pressure;
- user reports of stale assets or broken deep-link refreshes.

Attach the source commit, GitHub workflow run, Firebase Hosting version, manual smoke-test result, and any follow-up action to the private release register.

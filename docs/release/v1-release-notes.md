# CineScope V1 release notes — draft

Status: release-candidate draft. No V1 tag, GitHub release, or public deployment is authorized.

## The Living Archive

CineScope V1 brings movie, television, episode, and contributor discovery into a cinematic black-and-gold archive. Search can find a known title or person, while a request such as "a funny family movie under two hours" becomes visible, editable catalogue criteria with explanations for each match.

## A private archive that works before sign-in

Guests can save titles, mark watched records, choose favourites, rate films and series, and track episode progress locally. An account adds Firebase synchronization without replacing the browser-first experience. Existing guest records migrate after registration, and edits remain usable if cloud synchronization pauses.

## Explainable recommendations

Recommendations use bounded TMDB paths and transparent signals from favourites, ratings, progress, preferences, a temporary mood, and "Not interested" feedback. CineScope does not send viewing requests or archive data to an external AI service.

## Account controls

V1 includes registration, sign-in persistence, verification actions, password reset and change, reauthentication, display-name and discovery preferences, versioned JSON export, and permanent account deletion. Deletion removes the user-scoped Firestore tree and Firebase Authentication user before clearing local account data.

## Production foundation

The browser calls CineScope's same-origin Firebase Function instead of carrying the TMDB token. Firebase Hosting applies SPA rewrites, immutable hashed-asset caching, CSP and security headers. Protected manual preview and production workflows use short-lived Google credentials.

## Quality and accessibility

Automated coverage includes unit, component, Functions, Firestore Rules, public browser, authenticated emulator, Hosting, and API-contract layers. V1 targets WCAG 2.2 Level AA where practical with readable typography, keyboard navigation, visible focus, route focus transfer, loading announcements, reduced motion, mobile reflow, touch-target checks, and safe error recovery.

## Before publication

The production operator must complete the external and human checks in [v1-readiness.md](v1-readiness.md), approve public policy text and a private contact channel, authorize deployment, and separately approve any `v1.0.0` tag or GitHub release.

# Deferred social and community scope

Status: **deferred beyond CineScope V1**

CineScope does not currently provide public profiles, written reviews, public lists, follows, activity feeds, likes, reactions, comments, messages, or community moderation. This document records the product, data, security, privacy, and operational boundaries that must be approved before any such feature is implemented.

The existing local-first archive remains private. Signing in synchronizes a member's library, progress, preferences, and recommendation feedback to owner-only Firestore records; it does not make those records public.

## Product principles

Any future community work must preserve these principles:

- Participation is explicitly opt-in and is not required for discovery, tracking, recommendations, or account synchronization.
- A member's private archive never becomes public merely because they create a public profile or publish one review or list.
- Public identity is separate from authentication identity. Email addresses, Firebase user IDs, sign-in metadata, and provider data are never public profile fields.
- Audience and publication state are visible and understandable before content is submitted.
- Blocking, reporting, deletion, and appeal paths are part of the first usable feature, not later cleanup work.
- Community ranking must not silently alter the deterministic private recommendation model.
- There are no direct messages or private user-to-user data channels in the initial community scope.

## Candidate features and sequencing

If community development is approved, it should be divided into independently reviewed phases.

### 1. Written reviews

The smallest candidate feature is an optional public review attached to one movie or television record. It requires edit/delete controls, spoiler labeling, publication state, report handling, rate limits, moderation status, and clear attribution to an approved public identity.

### 2. Curated public lists and profiles

Public lists require an explicit publish action and must not be generated automatically from saved, watched, favourite, rating, or progress data. A public profile should expose only a chosen handle, display name, optional biography, optional avatar reference, and explicitly published content.

### 3. Following, activity, and reactions

Following and activity feeds introduce relationship privacy, fan-out, deletion propagation, ranking, spam, and quota risks. Likes or reactions introduce counter integrity and abuse risks. These features require a separate design and approval after reviews and public lists operate safely.

Comments, direct messaging, real-time presence, private groups, and user-uploaded video are not part of the proposed initial community system.

## Proposed data boundary

The following names are design candidates, not approved Firestore collections:

- `publicProfiles/{profileId}` contains only reviewed public identity fields and publication state.
- `reviews/{reviewId}` contains an author reference, TMDB media reference, bounded body, spoiler flag, timestamps, and moderation state.
- `publicLists/{listId}` and `publicLists/{listId}/items/{itemId}` contain explicitly published curation, never a mirror of the private library.
- `follows/{relationshipId}` records an approved public-profile relationship without copying private account data.
- `reactions/{reactionId}` records one bounded reaction per actor and target.
- `reports/{reportId}` is accessible only to its reporter where appropriate and to authorized moderation services; reports are never public.

Private data under `users/{uid}` remains owner-only. Public documents should use opaque public identifiers rather than exposing Firebase Authentication UIDs in routes or rendered content. Denormalized counts and activity projections must be produced by trusted server code, not accepted from arbitrary browser writes.

Before implementation, the design must define indexes, maximum field lengths, allowed state transitions, pagination cursors, deletion behavior, and bounded fan-out. It must also estimate Firestore reads/writes and Functions invocations for normal and abusive traffic.

## Security requirements

- Firestore Rules deny every unapproved collection and operation by default.
- Authentication is required for publishing, editing, deleting, following, reacting, blocking, and reporting.
- Rules validate ownership, exact field allowlists, types, lengths, timestamps, immutable identifiers, and allowed state transitions.
- App Check may reduce automated abuse but must not be treated as user authorization.
- Moderation state, aggregate counts, sanctions, and trusted timestamps are server-controlled.
- Rate limits and duplicate-action controls exist at the server boundary; client-only throttling is insufficient.
- Block rules apply consistently to profiles, feeds, follows, reactions, search visibility, and notifications before those surfaces launch.
- Rendering and storage treat all member-authored text as untrusted. No community field accepts executable markup or arbitrary external embeds.
- Security tests cover unauthenticated access, cross-user mutation, field injection, oversized content, invalid transitions, enumeration, deletion, and blocked relationships.

No community collection should be deployed until its Security Rules and emulator tests are reviewed in the same commit as the feature.

## Privacy and retention requirements

The operator must approve updated Privacy and Terms text before collecting public content. The interface must explain what is public, what remains private, and how long removed content, reports, operational logs, and backups can persist.

Required controls include:

- an explicit public-profile activation step;
- preview and audience confirmation before first publication;
- export of public content and relationship data alongside existing account data;
- member deletion of reviews, lists, reactions, follows, and the public profile;
- complete account-deletion propagation with documented retry and reconciliation behavior;
- blocking and reporting without exposing the reporter to the reported member;
- a private support/privacy channel for account or safety reports;
- a documented policy for legal preservation requests, moderation evidence, and backup expiry.

The product must not infer or publish age, location, contacts, viewing history, sexual orientation, political beliefs, health information, or other sensitive traits from archive activity. Any future minors policy, regional consent requirement, or content-licensing implication requires operator and legal review.

## Moderation and operational prerequisites

Public user-generated content must not launch without:

- community guidelines and enforceable Terms;
- a staffed private reporting channel and named response owner;
- report triage, evidence handling, sanctions, appeals, and emergency escalation procedures;
- spam, harassment, impersonation, spoiler, and illegal-content response rules;
- copyright and trademark complaint procedures appropriate to the operating jurisdiction;
- audit logs that avoid raw tokens, private archive data, and unnecessary personal information;
- quota, error, abuse, moderation-backlog, and deletion-failure monitoring;
- staging tests with synthetic accounts and content rather than personal production accounts;
- rollback or feature-disable controls that preserve deletion and safety access.

## Required validation for an approved phase

Each community phase must include unit and component tests, Firestore Emulator Security Rules tests, authenticated multi-user Playwright journeys, accessibility review, abuse-boundary tests, export/deletion coverage, and a documented manual moderation exercise. Performance budgets must include feed/list pagination and image behavior. A threat-model and privacy review must be completed before deployment approval.

## Approval gate

This document does not authorize social development. Starting even the written-review phase requires a new explicit approval that names the selected feature and confirms moderation ownership, policy review, data model, security rules, retention behavior, infrastructure budget, and test plan.

Until then, Phase 13 remains intentionally deferred and CineScope V1 remains a private discovery and living-archive product.

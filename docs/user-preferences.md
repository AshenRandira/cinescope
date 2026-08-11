# User discovery preferences

## Storage boundary

CineScope gives each authenticated member one discovery-preference document at:

```text
users/{uid}/preferences/discovery
```

The browser keeps the same snapshot in a user-scoped derivative of `cinescope.preferences.v1`. Profile edits write locally first, so the interface responds immediately, and then synchronize to Firestore. Sign-in reconciles the newest valid local or cloud snapshot by `updatedAt`; a Firestore interruption leaves the local edit intact and exposes a retry action.

Guest visitors receive neutral defaults in memory. They do not share or persist another member's preferences.

## Version 1 shape

```text
favoriteGenres: up to five canonical CineScope genre keys
preferredMedia: balanced | movie | tv
preferredLanguage: any | one supported original-language code
updatedAt: ISO timestamp
```

The client parser and Firestore Security Rules both require the exact shape. Genre values must be supported and unique, the media and language values must come from their bounded lists, and unexpected fields are rejected. Only the owning authenticated user can read or write the document.

Avatar upload and region are intentionally excluded from this version because CineScope does not yet have a justified asset-storage or regional catalogue consumer. Mood is also excluded from the durable profile: the archive recommendation experience keeps it in the current Discover URL rather than the member's long-lived identity.

## Recommendation behavior

The archive recommendation engine uses the saved values as bounded ranking signals:

- the preferred medium gives matching films or series a small advantage;
- the preferred original language gives matching records a small advantage;
- each matching favourite genre contributes a bounded score;
- favourite, highly rated, active TV-progress, and recent archive signals remain the primary recommendation anchors.

Preferences re-rank eligible results; they do not hide records or turn discovery into a filter. Balanced/any/empty defaults preserve the previous mixed-catalogue behavior. The Discover page exposes the active preference summary so the ranking has a visible explanation.

## Export, deletion, and release

Account export schema version 4 contains the current preference snapshot alongside the member profile, library, recommendation feedback, and synchronization status. Permanent account deletion recursively removes the `users/{uid}` tree, including the preference documents, and then clears the user-scoped browser keys.

No Firestore index, new secret, environment value, email provider, or external service is required. The updated Firestore Security Rules must be deployed with the application revision before authenticated production use.

# Library and TV progress data model

## Storage boundary

CineScope keeps one local-first record per movie or series. Guest records use `cinescope.library.v1`; authenticated records use a user-scoped derivative of that key and synchronize to `users/{uid}/library/{movie:id|tv:id}` in Firestore.

The local storage key remains version 1 because TV progress is an additive record field. Existing records without the field parse as `tvProgress: null` and remain valid under Firestore Security Rules.

## TV progress shape

Series records may contain:

```text
tvProgress
  watchedEpisodeKeys: ["season:episode", ...]
  resumeEpisode:
    seasonNumber
    episodeNumber
    name
    stillPath
  updatedAt
```

`watchedEpisodeKeys` is normalized, deduplicated, ordered by season and episode, and bounded to 2,000 entries. `resumeEpisode` points to the next indexed episode when one is known. At a season boundary it may be `null`; the continue-watching shelf then returns to the series record instead of inventing an unavailable episode route.

Episode changes write to local storage synchronously before account synchronization runs. Signed-in writes reuse the existing Firestore reconciliation and offline retry path. Removing the final watched episode resets `tvProgress` to `null`; it does not delete the saved series record or its favourite/rating state.

## Compatibility and security

- movie records always store `tvProgress: null`;
- legacy records without `tvProgress` remain accepted and are normalized when read;
- malformed progress is discarded by the client parser without discarding the surrounding library record;
- Firestore Rules allow progress only on an owner-controlled TV record, validate the bounded map shape, and continue rejecting unexpected fields;
- account export schema version 4 includes the current TV progress snapshot alongside the member's discovery preferences and recommendation feedback;
- account deletion recursively removes the same library documents, so no additional deletion path is required.

No Firestore index, new collection, secret, or external service is required. The updated Rules must be deployed with the application revision before authenticated production use.

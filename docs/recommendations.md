# Archive recommendations

## Recommendation boundary

CineScope builds a deterministic archive reel from TMDB's movie and television recommendation endpoints. The browser selects at most four archive anchors and requests one bounded recommendation page for each anchor. It merges duplicate results, preserves mixed movie/TV output, excludes adult or artwork-free records, and caps the visible reel at 20 records.

The engine does not introduce a machine-learning service, background profiling job, extra analytics event, or additional TMDB request. Mood, preferences, and feedback only re-rank or remove records from the already fetched candidate set.

## Archive signals and explanations

Anchor strength is inspectable and ordered from explicit positive signals: favourites, ratings of 7 or higher, active TV episode progress, and recent unrated saves as the fallback. Records already present in the library are excluded so the reel remains a discovery surface.

Each result exposes one or two short reasons:

- the source reason names the relevant favourite, high rating, in-progress series, recent save, or cross-anchor consensus;
- the optional personalization reason names the active session mood, favourite genre, preferred medium, or preferred original language.

The same inputs always produce the same ordering and explanations. A mood is stored in the Discover URL for the current session; it is not added to the member's durable profile.

## Not-interested feedback

Selecting **Not interested** immediately removes a record from the archive reel and exposes a one-step undo. Guest feedback is stored under `cinescope.recommendation-feedback.v1`. Signed-in feedback uses a user-scoped derivative of that key and synchronizes one document at:

```text
users/{uid}/preferences/recommendations
```

The version 1 document contains an ordered, unique list of at most 100 `movie:id` or `tv:id` record keys plus an ISO `updatedAt` value. Sign-in migrates guest feedback into the member snapshot, reconciles the newest local or cloud snapshot, and keeps failed writes local with an explicit retry action. Firestore Rules enforce owner-only access, the exact map shape, list uniqueness, and the maximum size; the stricter client parser also validates every record-key format.

Account export schema version 4 includes the current recommendation-feedback snapshot. Permanent account deletion recursively removes the cloud document and clears the member-scoped browser key.

## Release requirements

No Firestore index, package, secret, environment value, email provider, or external recommendation service is required. Deploy the updated Firestore Security Rules with the application revision before enabling authenticated feedback synchronization in a hosted environment.

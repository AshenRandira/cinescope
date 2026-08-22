# Intent-based catalogue search

## User experience

CineScope's search accepts two kinds of input in the same field:

- a known movie, series, performer, or filmmaker, which uses TMDB multi-search;
- a viewing request such as **a funny family movie under two hours**, which uses TMDB movie and television discovery.

The header keeps live title and person suggestions available while the user types. Submitting a request automatically opens recommendation mode when the input contains explicit request language or at least two recognized viewing signals. Plausible titles with one weak signal, including *Funny Games* and *Family Guy*, remain ordinary catalogue searches. Both the header and full search page provide an explicit override when the automatic interpretation is not what the user intended.

## Interpreted criteria

The deterministic parser can recognize:

- movies, television series, or a mixed result set;
- up to four genre signals;
- an open, comforting, reflective, high-tension, or transporting mood;
- a preferred original language;
- a release decade;
- a maximum runtime in minutes or hours;
- family-oriented catalogue language.

Recommendation mode stores the original request and interpreted criteria in the URL. The page treats that serialized state as authoritative, so every control can be edited or cleared without the original sentence silently restoring it. The resulting movie and television requests are issued separately and interleaved to preserve a mixed catalogue when both media types are selected.

Each result shows up to two concise match explanations. These reasons name active catalogue signals such as requested genres, mood, original language, decade, or runtime. A reason describes the filter match; it is not a content-safety guarantee or a claim that CineScope watched or semantically analyzed the title.

## Data and service boundary

Intent interpretation runs entirely in the browser with fixed rules. CineScope does not send the natural-language sentence to an AI provider, store it in Firestore, add it to the member profile, or emit a new analytics event. TMDB receives only allowlisted Discover parameters through the existing same-origin Cloud Function proxy.

The feature requires no new package, secret, environment value, database collection, Firestore rule, email provider, or external AI configuration. It uses the existing `TMDB_READ_ACCESS_TOKEN` already required by CineScope's server-side catalogue proxy.

## Known limits

The parser intentionally recognizes a bounded vocabulary rather than pretending to understand every phrase. Some movie genre concepts do not have an exact television genre equivalent in TMDB. When an exact selected genre cannot be mapped to the requested medium, the interface explains the mismatch and asks the user to broaden or reset that filter instead of returning misleading recommendations.

Runtime filtering is catalogue metadata supplied by TMDB. For television, that metadata represents TMDB's Discover runtime behavior and may not describe every episode precisely.

## Validation

Pure tests cover signal extraction, title ambiguity, URL edits, movie/television query construction, unsupported genre mappings, result mixing, and explanations. Component tests cover automatic request routing plus the explicit name-search override. The public Playwright suite exercises a natural-language request through the header, confirms editable criteria, and verifies a fixture-backed recommendation with its explanation.

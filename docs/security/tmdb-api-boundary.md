# TMDB API security boundary

## Architecture

The browser calls only same-origin paths under `/api/tmdb/**`. Firebase Hosting rewrites those requests to the second-generation `tmdbApi` HTTPS Function in `asia-east1`. The Function validates the request, reads `TMDB_READ_ACCESS_TOKEN` from Secret Manager, and performs the approved TMDB request server-side.

The browser application does not accept a TMDB token environment variable, does not set an upstream `Authorization` header, and cannot connect directly to `api.themoviedb.org` under the deployed Content Security Policy. TMDB images remain public image resources under `image.tmdb.org`.

## Request controls

The boundary supports GET only. Route patterns are explicitly limited to the catalogue operations currently used by CineScope:

- genre, discovery, trending, and register feeds;
- movie and television details plus watch-provider records;
- movie and television recommendation paths;
- television seasons and episodes;
- person details;
- multi-search.

Each route has a query-parameter contract. Movie and television discovery admit only the date, genre, original-language, runtime, vote, sorting, pagination, and adult-content exclusions used by the catalogue and intent-search interfaces. Unknown parameters, duplicate parameters, invalid IDs, unsupported expansions, unsafe paths, adult-content opt-ins, invalid pagination, malformed dates, and oversized search values are rejected before an upstream request is made.

Natural-language intent interpretation happens in the browser. The original sentence is not forwarded upstream: the Function receives only the resulting allowlisted Discover parameters. See [intent-based catalogue search](../intent-search.md).

Upstream requests time out after eight seconds and responses larger than five MiB are rejected. Upstream authentication details and bodies are never returned in API errors. Responses contain a normalized error code, safe message, and request reference.

## Caching and abuse controls

Genre records use a long shared-cache lifetime. Public catalogue lists and details use shorter browser and Firebase CDN lifetimes with stale-while-revalidate. Search responses use `private, no-store` and are not retained in the warm-instance cache.

The Function applies a bounded per-instance request window and returns `429` plus `Retry-After` when exceeded. `maxInstances` limits uncontrolled scaling. This is a cost and abuse safeguard, not a globally authoritative user quota.

Logs contain the allowlisted route category, status, latency, cache result, error category, request reference, and no raw query, token, email address, library content, or upstream response.

## App Check rollout

App Check support is staged so a provider can be configured without breaking local development:

1. Create a reCAPTCHA Enterprise provider for each Firebase web app.
2. Set the public site key as `VITE_FIREBASE_APP_CHECK_SITE_KEY` in the corresponding build environment.
3. Verify valid App Check headers in logs and test the registered preview domain.
4. Set the Functions parameter `TMDB_APP_CHECK_ENFORCED=true` only after preview verification.
5. Deploy the Function and Hosting rewrite through the protected workflow.

When enforcement is enabled, missing or invalid App Check tokens receive a normalized `401`. Firebase Authentication ID tokens are not required because catalogue endpoints are public and contain no member data. CineScope does not implement a parallel JWT system.

## Local validation

Copy the placeholder secret file and insert a development TMDB read token:

```powershell
Copy-Item functions/.secret.local.example functions/.secret.local
```

Run the Function and Vite in separate terminals:

```powershell
npm.cmd run dev:api
```

```powershell
npm.cmd run dev
```

The automated API gate uses an emulator-only fixture token and local fake upstream. It does not depend on the value in `functions/.secret.local` or contact TMDB:

```powershell
npm.cmd run test:functions
npm.cmd run test:api
npm.cmd run check:client-security
```

## Production secret setup

Secret creation is an explicitly authorized infrastructure action and is not performed by repository validation:

```powershell
npx.cmd firebase-tools functions:secrets:set TMDB_READ_ACCESS_TOKEN --project YOUR_PROJECT_ID
```

Set the secret independently in preview and production projects. Do not print it, store it in GitHub, put it in a `VITE_` value, or add it to `.env.preview` or `.env.production`.

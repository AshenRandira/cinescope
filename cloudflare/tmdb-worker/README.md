# CineScope TMDB Worker

Install Wrangler, then from this directory run:

```powershell
npx wrangler login
npx wrangler secret put TMDB_READ_ACCESS_TOKEN
npx wrangler deploy
```

Use the deployed worker URL plus `/api/tmdb/` as `VITE_TMDB_API_BASE_URL` in `.env.production` before building the frontend.

example url =https://cinescope-tmdb.cinescope-ash.workers.dev/

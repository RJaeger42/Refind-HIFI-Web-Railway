# FINDINGS


- **Frontend nginx proxy hard-codes the API hostname** – `services/frontend/nginx.conf:18` proxies `/api` to `https://api-production-d092.up.railway.app`, so whenever Railway chooses a new API domain or you want to deploy elsewhere the frontend still forwards to the stale host and the UI stays at 502. Parameterize the upstream (e.g., `proxy_pass $API_BACKEND_URL;` with the environment variable defined in Railway) or use the internal service hostname so the SPA keeps talking to whatever API is actually running.

## Security & stability risks
- **API and scrapers assume critical env vars and SSL settings without validation** – `services/api/src/server.ts:9-18` builds the Postgres pool with whatever `DATABASE_URL`/`DATABASE_PUBLIC_URL` is present and enables SSL only when `NODE_ENV === 'production'`. Railway leaves `NODE_ENV` undefined by default, so the pool does not use SSL and the first query against Railway Postgres will throw due to the required SSL handshake, leading to immediate crashes and the 502s seen on the public URL. It also never fails fast when `DATABASE_URL` is missing. Require these variables explicitly, validate them at startup, and configure the pool to use SSL whenever a connection string exists (or make `NODE_ENV` fixed to `production` in the Railway service settings).


## Recommendations & improvements
- **Document required env vars and validation** – add a lightweight startup check (or use a config helper) that validates `DATABASE_URL`, `PORT`, and `WEBHOOK_SECRET` before doing any I/O, log clear errors, and gracefully exit when they are missing. Mention the expected values in the README or a deployment guide so whoever redeploys the stack doesn’t forget to set them.

- **Align service builds with their source** – once the heavy service Dockerfile/railway config are fixed, confirm the heavy-specific `package.json` and `tsconfig` are actually being used (right now the light service’s directories are the ones being copied). That will also allow you to trim the light service’s build so it only includes its own scrapers instead of pulling the entire `SiteScrapers` tree twice.

- **Improve frontend/backend coupling** – consider letting the frontend communicate with the API via an env-driven base URL (`REACT_APP_API_URL` for a deployment-agnostic build or an nginx variable), add retry/backoff on the client for the `/api/listings` fetch, and expose the API health endpoint (already available) in the docs so you can verify connectivity before hitting the UI.

- **Add lightweight monitoring/alerting notes** – since this is an MVP running on Railway, log and surface scraper errors (the services already log but it’s worth pointing out in documentation). Use Railway alerts or a simple file/endpoint to watch for repeated failures, and consider adding a small smoke test that hits `/health` after deployment to ensure the front-to-back path is healthy.

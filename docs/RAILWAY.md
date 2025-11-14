# Deploying ILS 2.0 on Railway

This document describes the minimal Railway secret names and a simple local verification workflow to validate the production image before pushing to Railway.

Required Railway service environment variables (set these as Railway secrets for the service):

- `DATABASE_URL` — Postgres connection string (Neon/Postgres). Example: `postgres://user:pass@host:5432/db`
- `SESSION_SECRET` — Long random string used to sign sessions.
- `REDIS_URL` — (optional) Redis URL for BullMQ and session store; if omitted the app uses immediate fallbacks.
- `OPENAI_API_KEY` — (optional) OpenAI key for AI features.
- `ANTHROPIC_API_KEY` — (optional) Anthropic key if used.
- `RESEND_API_KEY` — (optional) for transactional email.
- `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY` — (optional) payments.
- `LIMS_API_BASE_URL`, `LIMS_API_KEY`, `LIMS_WEBHOOK_SECRET` — (optional) LIMS integration.

Railway service settings suggestions:

- Memory: 512-1024 MB (increase if you enable workers or the AI features)
- CPUs: 1 (can scale up in production)
- Start command: `npm run start` (the Dockerfile builds the app; Railway will use Dockerfile if configured)

Local verification (before or instead of deploying to Railway):

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `SESSION_SECRET` at minimum.

   ```bash
   cp .env.example .env
   # Edit .env and paste in real values
   ```

2. Build the project locally:

   ```bash
   npm ci
   npm run build
   ```

3. Build and run the Docker image locally (optional but recommended to mirror Railway):

   ```bash
   docker build -t ils-prod .
   docker run --rm -p 3000:3000 --env-file .env ils-prod
   ```

4. Once the container is running, verify the health endpoint:

   ```bash
   curl -sS http://localhost:3000/api/health
   ```

Troubleshooting notes:

- If the server exits immediately with a missing env error, verify `DATABASE_URL` and `SESSION_SECRET` are set.
- If `tsc` runs out of memory in CI, use: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` (Railway build containers may require higher memory).
- For production, ensure secrets are set via Railway's dashboard or CLI; do not commit secrets to the repo.

Next steps for Railway deploy:

1. Set the secrets listed above in Railway for the service.
2. Configure Railway to use the Dockerfile in the repo (or set up a build command that runs `npm run build` and uses `npm start`).
3. Deploy and monitor logs via Railway; if the server fails to boot, check logs for missing env or DB connection errors.

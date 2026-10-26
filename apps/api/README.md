# Portfolio API

A small, production-style backend for the portfolio, running on
[Cloudflare Workers](https://developers.cloudflare.com/workers/) with a
[D1](https://developers.cloudflare.com/d1/) SQLite database.

- **Projects:** the project catalogue with live view and like counts
- **Guestbook:** visitors sign it; entries appear once approved
- **Contact form:** messages are stored and optionally forwarded to a Discord/Slack webhook
- **Leaderboard:** server-timed runs of the site's platformer
- **Admin:** moderation and inbox, behind a bearer token

The full reference is generated from the code: [`openapi.json`](openapi.json),
or interactively at `/docs` on a running instance.

## Design

```
src/
  index.ts          Worker entry: fetch handler + nightly cron
  app.ts            Middleware stack, route mounting, OpenAPI document, error handling
  routes/           One file per resource; each route is declared with its zod schemas
  services/         Rules that aren't plain data access (run scoring, notifications)
  repositories/     All SQL, one class per table group
  middleware/       Request context, rate limiting, admin auth
  lib/              Problem details, hashing, time helpers
migrations/         Versioned SQL, applied by Wrangler (and by the tests)
test/               Integration tests in the Workers runtime against a real local D1
```

Decisions worth knowing:

- **One schema, three uses.** Request and response bodies are zod schemas in
  `packages/shared`. The API validates with them, the OpenAPI spec is generated
  from them, and the site uses them to validate forms before sending.
- **Errors are [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem details**
  (`application/problem+json`), with per-field messages for validation errors and
  the request id that also appears in the logs and the `X-Request-Id` header.
- **Privacy.** Visitors are identified only by a salted SHA-256 hash of their IP,
  used for rate limits, "already liked" and once-a-day view counting. No raw IPs
  or cookies.
- **Rate limiting** is a fixed window per visitor and route family, stored in D1 so
  every Worker instance shares it, reported with the IETF `RateLimit-*` headers
  and `Retry-After` on 429.
- **Counters without hot rows on reads.** Views and likes are stored as one row
  per visitor (so they're idempotent), and SQL triggers keep a small
  `project_counters` table in sync, so listing all projects is one tiny scan.
- **Cheat-resistant leaderboard.** The server starts the clock when a run starts
  and stops it when it finishes, so a modified client can't post a faster time
  than it really took. Runs are single-use (a conditional `UPDATE` settles
  concurrent finishes), must collect every star, have a minimum plausible time,
  and expire after an hour.
- **Spam.** Honeypot fields, rate limits, a 16 KB body limit and moderation
  (guestbook entries are pending until approved).
- **Housekeeping.** A nightly cron prunes old rate-limit windows, per-day view rows
  (totals are kept) and abandoned runs.

## Develop

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev            # http://localhost:8787, docs at /docs
npm test               # integration tests in workerd
npm run openapi        # regenerate openapi.json after changing a route
```

Moderating locally:

```bash
curl localhost:8787/v1/admin/guestbook -H "Authorization: Bearer dev-admin-token"
curl -X PATCH localhost:8787/v1/admin/guestbook/1 -H "Authorization: Bearer dev-admin-token" \
  -H "Content-Type: application/json" -d '{"status":"approved"}'
```

## Deploy (one-time setup)

1. Create a free Cloudflare account, then from this folder:
   ```bash
   npx wrangler login
   npx wrangler d1 create portfolio      # copy the database_id into wrangler.jsonc
   npm run db:migrate:remote
   npx wrangler secret put ADMIN_TOKEN   # a long random string
   npx wrangler secret put HASH_SALT     # another long random string
   npm run deploy                        # prints the API's URL
   ```
2. In the GitHub repo, add the Actions **variable** `API_URL` (the URL from step 1)
   and the **secrets** `CLOUDFLARE_API_TOKEN` (a token with the "Edit Cloudflare
   Workers" template plus D1 edit) and `CLOUDFLARE_ACCOUNT_ID`.
3. Push to `master`: the site rebuilds pointing at the API, and API changes deploy
   themselves from then on.

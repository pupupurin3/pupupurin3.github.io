# pupupurin3.github.io

Noah Matsukuma's portfolio. It's a React site with a Lab of front-end
experiments, a ⌘K command palette and a platformer you can play on top of the
page. Behind it is a TypeScript API on Cloudflare Workers with a D1 (SQLite)
database.

**Contents:** [Overview](#overview) ·
[Repository layout](#repository-layout) · [Getting started](#getting-started) ·
[Scripts](#scripts) · [Configuration](#configuration) · [The site](#the-site-appsweb) ·
[Shared package](#the-shared-package-packagesshared) · [The API](#the-api-appsapi) ·
[Testing](#testing) · [CI and deployment](#ci-and-deployment) ·
[Common tasks](#common-tasks) · [Conventions](#conventions)

---

## Overview

```
 Browser ──► GitHub Pages (apps/web, static build)
    │
    └──────► Cloudflare Worker (apps/api) ──► D1 database
                       ▲
       packages/shared ┘  (project list + zod schemas, also used by the site)
```

| Part | Stack |
| --- | --- |
| Site | Vite 7, React 19, TypeScript, Three.js through `@react-three/fiber` and `drei`, Framer Motion |
| API | Hono with `@hono/zod-openapi` on Cloudflare Workers, D1, zod 4, OpenAPI 3.1 |
| Shared | zod schemas and the project catalogue, imported by both apps |
| Tooling | npm workspaces, ESLint 10 with typescript-eslint, Vitest 4, Wrangler 4 |

The site works on its own. The API adds the guestbook, contact form, project
likes and views, and the game leaderboard. If the site is built without
`VITE_API_URL`, those features don't render and everything else looks and
behaves the same.

## Repository layout

```
.
├── apps/
│   ├── web/                 The site (package @portfolio/web)
│   │   ├── public/          Static files copied as-is: img/, models/*.glb, favicons
│   │   ├── src/
│   │   │   ├── main.tsx     Entry: fonts, global CSS, <MotionConfig reducedMotion="user">
│   │   │   ├── App.tsx      Page layout: loader, nav, sections, game, palette, toast
│   │   │   ├── components/  UI, grouped by section (see below)
│   │   │   ├── content/     All site text: profile, about, gallery
│   │   │   ├── hooks/       Reusable React hooks
│   │   │   ├── lib/         Framework-free helpers (API client, events, fuzzy search…)
│   │   │   └── styles/      Plain CSS, one file per area, imported by index.css
│   │   └── test/            Vitest + Testing Library (jsdom)
│   └── api/                 The API (package @portfolio/api)
│       ├── src/             Worker code (see "The API")
│       ├── migrations/      Versioned SQL for D1
│       ├── scripts/         export-openapi.ts
│       ├── test/            Integration tests that run inside workerd
│       ├── openapi.json     Generated spec, checked in (CI fails if stale)
│       └── wrangler.jsonc   Worker config: D1 binding, vars, nightly cron
├── packages/
│   └── shared/              @portfolio/shared: projects.ts + schemas.ts
├── legacy/                  The previous Bootstrap site, kept for reference, not built
├── .github/workflows/       ci.yml, deploy.yml (site), deploy-api.yml (API)
├── eslint.config.js         One lint config for the whole repo
├── tsconfig.base.json       Shared compiler options, extended by each package
└── package.json             Workspace root and top-level scripts
```

## Getting started

You need **Node 22 or newer** (npm comes with it). Nothing else has to be
installed globally: Wrangler runs from `node_modules`.

```bash
npm install
npm run dev                  # site on http://localhost:5173
```

That is enough to work on the site. To run it against a local API as well:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars     # local secrets
npm run db:migrate:local -w @portfolio/api           # create the local D1 database
npm run dev:api                                      # API on http://localhost:8787, docs at /docs
cp apps/web/.env.example apps/web/.env.local         # point the site at it
npm run dev                                          # restart the site to pick up the env
```

The local database lives in `apps/api/.wrangler/` and survives restarts.
Delete that folder to start over.

## Scripts

Run these from the repository root.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site's Vite dev server |
| `npm run dev:api` | Start the API with `wrangler dev` |
| `npm run build` | Type check and build the site into `apps/web/dist` |
| `npm run lint` | ESLint over the whole repo |
| `npm run typecheck` | `tsc --noEmit` in every workspace |
| `npm test` | Every workspace's tests |
| `npm run check` | Lint, type check and test: run this before pushing |

Scripts that belong to one package are run with `-w`:

| Command | What it does |
| --- | --- |
| `npm run preview -w @portfolio/web` | Serve the production build on port 4173 |
| `npm run db:migrate:local -w @portfolio/api` | Apply migrations to the local D1 |
| `npm run db:migrate:remote -w @portfolio/api` | Apply migrations to the production D1 |
| `npm run openapi -w @portfolio/api` | Regenerate `apps/api/openapi.json` |
| `npm run deploy -w @portfolio/api` | Deploy the Worker (needs `wrangler login`) |
| `npm run cf-typegen -w @portfolio/api` | Regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc` |

## Configuration

| Name | Where | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `apps/web/.env.local`, or the `API_URL` Actions variable in CI | Base URL of the API. Unset means the API features are hidden. |
| `ALLOWED_ORIGINS` | `vars` in `wrangler.jsonc` | Comma-separated origins allowed by CORS |
| `ADMIN_TOKEN` | Worker secret, `.dev.vars` locally | Bearer token for `/v1/admin/*`. While unset, admin routes refuse every request. |
| `HASH_SALT` | Worker secret, `.dev.vars` locally | Salt for hashing visitor IPs. Changing it resets "already liked/viewed". |
| `NOTIFY_WEBHOOK_URL` | Worker secret (optional) | Discord or Slack webhook pinged when a contact message arrives |
| `DB` | `d1_databases` in `wrangler.jsonc` | The D1 binding. Set `database_id` after `wrangler d1 create`. |

Never commit `.dev.vars` or `.env.local`. Both are in `.gitignore`.

## The site (`apps/web`)

### How the page is put together

`main.tsx` loads the fonts and CSS and wraps the app in Framer Motion's
`MotionConfig reducedMotion="user"`, so every animation respects the visitor's
reduced-motion setting. `App.tsx` then renders, in order:

1. **`LoadingScreen`**: the segmented loading bar. When it finishes it calls
   `onDone`, which sets `started` and lets the hero animation and nav begin.
2. **`Nav`** and **`ScrollProgress`**: the nav stays hidden over the hero and
   slides in after it.
3. The four sections: **Hero**, **Work** (`#work`), **Lab** (`#lab`), **About**
   (`#about`) and **Contact** (`#contact`).
4. Overlays that sit above the page: **`PlayLayer`** (the game),
   **`CommandPalette`** and **`Toast`**.

Everything is wrapped in `ProjectStatsProvider` (`hooks/projectStats.tsx`),
which fetches view and like counts once and shares them with every project card.

### Components

| Folder | What's in it |
| --- | --- |
| `components/hero` | The "Sunfaded" poster: photo and letters fading in, drawn lines, moving sun rays. `AsciiDonut.tsx` is kept but not currently shown. |
| `components/work` | Filterable project grid. Cards morph into a detail dialog (`ProjectDetail`) with links, likes and views. `Cover` draws a generated cover when a project has no image. |
| `components/lab` | Tabbed experiments: the scrollable project shelf (`shelf/`), the 3D model gallery, scroll-linked text and spring physics |
| `components/three` | `ModelViewer` (orbit, zoom, auto-rotate), `LazyModelViewer` (loads Three.js only when needed) and the procedural models in `models.tsx` (voxel Purin, Mars terrain, maze) |
| `components/game` | The platformer. `physics.ts` is pure and unit tested, `level.ts` turns real headings and cards on the page into platforms, `render.ts` and `sprite.ts` draw it, `Leaderboard.tsx` talks to the API. |
| `components/contact` | Contact links, plus the contact form and guestbook when the API is configured |
| `components/palette` | The ⌘K / Ctrl+K palette. `commands.ts` builds the command list, `lib/fuzzy.ts` ranks it. |
| `components/layout` | Loader, nav and scroll progress bar |
| `components/ui` | Small shared pieces: section header, tags, form field, reveal-on-scroll, toast |

### Hooks and helpers

| File | Purpose |
| --- | --- |
| `lib/api.ts` | Typed API client. `apiEnabled` says whether `VITE_API_URL` was set. Errors are thrown as `ApiError` with the server's problem details and per-field messages. |
| `lib/events.ts` | Typed window events (`open-project`, `toggle-game`, `open-palette`, `leaderboard-changed`) so distant components can talk without prop drilling. Use `emit()` to send and `useSiteEvent()` to listen. |
| `lib/asset.ts` | `asset('img/x.jpg')` prefixes the build's base URL. Use it for every file in `public/`. |
| `lib/fuzzy.ts` | Fuzzy matching and scoring for the palette |
| `lib/motion.ts` | The site's standard ease-out curve, shared with CSS (`--ease`) |
| `lib/storage.ts` | `localStorage` wrappers that never throw (private windows, blocked storage) |
| `lib/platform.ts` | ⌘ or Ctrl label, "is the visitor typing" and "is a dialog open" checks used by keyboard shortcuts |
| `hooks/useApiForm.ts` | Form state: validates with the shared zod schema before sending, then maps server errors back onto fields |
| `hooks/useModal.ts` | Escape closes an open dialog and the page behind it stops scrolling |
| `hooks/useDragScroll.ts` | Drag-to-scroll with momentum, used by the project shelf |
| `hooks/useToast.ts` | A toast message that shows for two seconds |

### Keyboard shortcuts

| Keys | Action |
| --- | --- |
| ⌘K / Ctrl+K | Open the command palette (also the phone menu) |
| P | Start or stop the platformer |
| Arrow keys / WASD, Space | Move and jump while playing |
| R | Respawn |
| Esc | Quit the game or close a dialog |

### Styling

Styles are plain CSS in `src/styles`, one file per area, all imported by
`index.css`. Colours, spacing and fonts are CSS custom properties on `:root` in
`base.css`. The site is light mode only, on a white background with a pastel
blue graph-paper grid (`body::before`).

## The shared package (`packages/shared`)

This package is imported as TypeScript source by both apps, so there is no
build step.

- **`projects.ts`** holds the project catalogue. The site renders it and the API
  serves it with live counts, so the two can never disagree about which
  projects exist. Each project has a `slug`, which the API uses as its key, so
  don't change a slug once the site is live.
- **`schemas.ts`** holds every request and response body as a zod schema, plus
  limits such as `LIMITS.contactMessage` and the game constants (`GAME_STARS`,
  `GAME_MIN_RUN_MS`). The API validates with these schemas, the OpenAPI spec is
  generated from them, and the site's forms run the same checks before sending.

## The API (`apps/api`)

[apps/api/README.md](apps/api/README.md) explains the design decisions (privacy,
rate limiting, the cheat-resistant leaderboard) and has the one-time Cloudflare
setup. This section is a map of the code.

### Request flow

`src/index.ts` exports the Worker's `fetch` handler and a nightly `scheduled`
handler. `src/app.ts` builds the Hono app, and every request goes through:

1. `requestContext`: gives the request an id (also sent as `X-Request-Id`) and
   attaches the repositories as `c.var.repos`.
2. Secure headers, then CORS for the origins in `ALLOWED_ORIGINS`.
3. A 16 KB body limit on `/v1/*`.
4. The route's own middleware (rate limit, admin auth), then zod validation of
   params and body.
5. The handler, which calls services and repositories.

Errors are thrown as `ApiError` (`lib/errors.ts`) and turned into
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem details by
`app.onError`. Unexpected errors are logged as JSON and returned as a generic 500.

### Code layout

| Folder | Role |
| --- | --- |
| `routes/` | One file per resource. Each route is declared with `createRoute` and its zod schemas, which is also what the OpenAPI spec is built from. |
| `services/` | Logic that isn't plain data access: `game.ts` (run timing and scoring), `notify.ts` (webhook) |
| `repositories/` | All SQL, one class per table group, created per request by `repositories(db)` |
| `middleware/` | `context.ts`, `rateLimit.ts` (fixed window stored in D1), `admin.ts` (bearer token) |
| `lib/` | Problem details, OpenAPI helpers, hashing, time constants, visitor id |

### Endpoints

The full reference is `apps/api/openapi.json`, or the interactive page at
`/docs` on a running API.

| Method and path | What it does | Limit per visitor |
| --- | --- | --- |
| `GET /health` | API and database are up | |
| `GET /v1/projects` | Every project with view and like counts | |
| `GET /v1/projects/{slug}` | One project with its counts | |
| `POST /v1/projects/{slug}/views` | Count a view (once per visitor per day) | 120 / min |
| `PUT /v1/projects/{slug}/like` | Like a project | 30 / min |
| `DELETE /v1/projects/{slug}/like` | Take a like back | 30 / min |
| `GET /v1/guestbook` | Approved entries, newest first, with a cursor | |
| `POST /v1/guestbook` | Sign the guestbook (pending until approved) | 5 / hour |
| `POST /v1/contact` | Send a message | 5 / hour |
| `POST /v1/game/runs` | Start a timed run | 60 / hour |
| `POST /v1/game/runs/{runId}/finish` | Finish a run and post it | 60 / hour |
| `GET /v1/game/leaderboard` | Fastest players | |
| `GET /v1/admin/guestbook` | Entries by status | admin |
| `PATCH /v1/admin/guestbook/{id}` | Approve or reject an entry | admin |
| `DELETE /v1/admin/guestbook/{id}` | Delete an entry | admin |
| `GET /v1/admin/messages` | Contact messages, newest first | admin |
| `DELETE /v1/admin/game/runs/{runId}` | Remove a run from the leaderboard | admin |

Admin routes need `Authorization: Bearer <ADMIN_TOKEN>`.

### Database

The schema is in `apps/api/migrations/0001_init.sql`. Timestamps are Unix
milliseconds, and visitors are only ever stored as a salted SHA-256 hash of
their IP.

| Table | Holds |
| --- | --- |
| `guestbook_entries` | Entries with `status` pending, approved or rejected |
| `contact_messages` | Contact form submissions |
| `project_views` | One row per project, visitor and UTC day |
| `project_likes` | One row per project and visitor |
| `project_counters` | Running view and like totals, kept in sync by SQL triggers |
| `game_runs` | Started and finished runs. Times are measured by the server. |
| `rate_limits` | Request counts per bucket and time window |

The nightly cron (`17 3 * * *` UTC) deletes old rate-limit windows, per-day view
rows (the totals stay) and runs that were never finished.

## Testing

```bash
npm test                          # everything
npm test -w @portfolio/web        # one workspace
npx vitest -w @portfolio/web      # watch mode
```

| Suite | Runs in | Covers |
| --- | --- | --- |
| `apps/web/test` | jsdom with Testing Library | Forms against the shared schemas, fuzzy search, game physics, the project catalogue |
| `apps/api/test` | The real Workers runtime (`@cloudflare/vitest-plugin`) with a local D1 migrated from the same SQL files as production | Every route: validation, rate limits, auth, moderation, run timing |
| `packages/shared/test` | Node | Schema rules and catalogue integrity (unique slugs and so on) |

## CI and deployment

| Workflow | When it runs | What it does |
| --- | --- | --- |
| `ci.yml` | Every pull request and push to `master` | Lint, type check, all tests, checks that `openapi.json` is up to date, builds the site |
| `deploy.yml` | Push to `master` that changes anything outside `apps/api` | Builds the site with `VITE_API_URL` from the `API_URL` variable and publishes `apps/web/dist` to GitHub Pages |
| `deploy-api.yml` | Push to `master` that changes `apps/api`, `packages/shared` or the lockfile | Runs the API tests, applies remote migrations, deploys the Worker, then checks `/health`. Skipped until `API_URL` is set. |

One-time setup:

1. **Site:** in GitHub, set **Settings > Pages > Source** to **GitHub Actions**.
2. **API:** follow the steps in [apps/api/README.md](apps/api/README.md#deploy-one-time-setup):
   create the D1 database, set the `ADMIN_TOKEN` and `HASH_SALT` secrets, deploy
   once, then add the `API_URL` variable and the `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` secrets to the GitHub repository.

## Common tasks

**Add or edit a project.** Edit the `projects` array in
`packages/shared/src/projects.ts`. Blurbs marked `// TODO` were written from the
repo name only and need a real description.
- For a screenshot, put the image in `apps/web/public/img/` and set
  `image: 'img/name.jpg'`.
- For a 3D model, export a `.glb` into `apps/web/public/models/` and set
  `model: 'models/name.glb'`, or use a built-in key: `'purin'`, `'mars'` or `'maze'`.

**Change site text.** Everything is in `apps/web/src/content`: `profile.ts`
(name, roles, links), `about.ts` and `gallery.ts` (models in the Lab viewer).
Components don't contain copy.

**Add a model to the Lab gallery.** Add `{ name, model: asset('models/x.glb'), note }`
to `apps/web/src/content/gallery.ts`.

**Add an API endpoint.**
1. Add the request and response schemas to `packages/shared/src/schemas.ts`.
2. Add any SQL to a repository in `apps/api/src/repositories/`.
3. Declare the route with `createRoute` in `apps/api/src/routes/`, and mount
   new route files in `app.ts`.
4. Add a method to `apps/web/src/lib/api.ts` if the site uses it.
5. Write a test in `apps/api/test/`, then run `npm run openapi -w @portfolio/api`.

**Change the database.** Add a new numbered file in `apps/api/migrations/`, for
example `0002_add_x.sql`. Never edit a migration that has already been applied.
Run `npm run db:migrate:local -w @portfolio/api` to try it. The deploy workflow
applies it to production before deploying the new Worker.

**Moderate the guestbook.**

```bash
curl https://<api>/v1/admin/guestbook?status=pending -H "Authorization: Bearer $ADMIN_TOKEN"
curl -X PATCH https://<api>/v1/admin/guestbook/1 -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"approved"}'
```

## Conventions

- TypeScript is strict everywhere. Share types through `@portfolio/shared`
  rather than duplicating them.
- Content lives in data files, not components.
- Reference anything in `public/` through `asset()`.
- Every animation must respect reduced motion: Framer Motion does this
  through `MotionConfig`, and CSS and canvas animations check
  `prefers-reduced-motion` themselves.
- Overlays such as the game must never block normal browsing: the game canvas is
  `pointer-events: none` and only captures keys while playing.
- Visitor data stays minimal: no cookies, no raw IPs.
- Run `npm run check` before pushing. CI runs the same steps.

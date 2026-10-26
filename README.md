# pupupurin3.github.io

Noah Matsukuma's portfolio: a React site with a Lab of front-end experiments,
a ⌘K command palette and a platformer you can play on top of the page, backed
by a TypeScript API on Cloudflare Workers with a D1 (SQLite) database.

```
apps/web         The site: Vite + React 19 + TypeScript, Three.js (r3f), Framer Motion
apps/api         The API: Hono on Cloudflare Workers, D1, zod, OpenAPI 3.1
packages/shared  Project catalogue and request/response schemas used by both
legacy/          The previous Bootstrap site, kept for reference (not built)
```

## Run locally

```bash
npm install
npm run dev                  # site on http://localhost:5173

# With the API (guestbook, contact form, likes, leaderboard):
cp apps/api/.dev.vars.example apps/api/.dev.vars
npm run db:migrate:local -w @portfolio/api
npm run dev:api              # API on http://localhost:8787, docs at /docs
cp apps/web/.env.example apps/web/.env.local   # points the site at it
```

`npm run check` runs lint, type checks and every test suite.

## The site (`apps/web`)

All text lives in `src/content` (profile, about, gallery) and the projects in
`packages/shared/src/projects.ts`. Blurbs marked `// TODO` were written from the
repo name only; replace them with a real description.

- **Project screenshot:** put the image in `apps/web/public/img/` and set `image: 'img/name.jpg'`.
- **3D model:** export a `.glb` into `apps/web/public/models/` and set `model: 'models/name.glb'`.

| Folder | What's in it |
| --- | --- |
| `components/hero` | The Sunfaded poster: letters fading out of a blur, drawn lines, sun rays |
| `components/work` | Filterable project grid; cards morph into a detail dialog with likes and views |
| `components/lab` | Tabbed experiments: the project shelf, model viewer, scroll-linked text, spring physics |
| `components/three` | Model viewer and procedural models (voxel Purin, Mars terrain, maze), loaded lazily |
| `components/game` | The platformer: pure physics (`physics.ts`), level scanning, rendering and the leaderboard |
| `components/contact` | Contact form and guestbook (only shown when the API is configured) |
| `components/palette` | ⌘K / Ctrl+K fuzzy command palette |
| `hooks`, `lib` | Shared hooks (modal, drag-scroll, toast, forms), the typed API client and site events |

The API features are optional: when the site is built without `VITE_API_URL`,
the guestbook, contact form, likes and leaderboard don't render and everything
else works as before.

## The API (`apps/api`)

See [apps/api/README.md](apps/api/README.md) for the design, endpoints and deployment.

## Deploying

- **Site:** `.github/workflows/deploy.yml` publishes to GitHub Pages on every push
  to `master`. Set **Settings > Pages > Source** to **GitHub Actions** once.
- **API:** `.github/workflows/deploy-api.yml` migrates the database and deploys the
  Worker when the API changes. Setup steps are in the API README.

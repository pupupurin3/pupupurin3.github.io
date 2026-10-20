# pupupurin3.github.io

Noah Matsukuma's portfolio: a React + Three.js site styled like a street-side
tape shop. It has a cassette loading screen, a poster-style header with
Noah's diorama render, projects as 3D cassette tapes on a shelf, and an
interactive 3D model gallery.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Editing content

All text, projects and gallery entries live in `src/data/content.js`.
Blurbs marked `// TODO` were written from the repo name only; replace them
with a real description.

- **Project screenshot:** put the image in `public/img/` and set `image: '/img/name.jpg'`.
- **Your own cassette model:** export a `.glb` into `public/models/` and set
  `tapeModel` in `content.js` (or `cassette` on one project). Name the label's
  material `Label` and each project's generated label is applied to it. Make
  the tape about 10 x 6.3 x 1.2 units, front facing +Z; it is scaled to fit.
- **3D model on a project or in the gallery:** export a `.glb` (in Blender:
  File > Export > glTF 2.0, format "glb") into `public/models/` and set
  `model: '/models/name.glb'`. Models are centred and scaled automatically.

## Structure

| File | What it does |
| --- | --- |
| `src/components/LoadingScreen.jsx` | Cassette loader with winding reels and a slanted wipe exit |
| `src/components/Hero.jsx` | Poster header: diorama render, stickers, parallax layers, ticker |
| `src/components/TapeShelf.jsx` | 3D shelf of tapes, filters, track list and the Now Playing popup |
| `src/components/Cassette.jsx` | Procedural cassette with generated label, or your `.glb` |
| `src/components/Sections.jsx` | Nav, About, 3D gallery, timeline, contact |
| `src/components/ModelViewer.jsx` | Reusable orbit viewer with spin / wireframe / reset |
| `src/components/models.jsx` | Procedural gallery models (Purin, Mars terrain, maze) and the `.glb` loader |

The header image is `public/img/hero-model.png`, a cut-out of the diorama render.

Animations use Framer Motion and respect the visitor's reduced-motion setting.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `master`. In the repo's **Settings > Pages**, set **Source** to
**GitHub Actions** once.

The previous Bootstrap site is kept in `legacy/` for reference; it is not part
of the build and can be deleted.

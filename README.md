# pupupurin3.github.io

Noah Matsukuma's portfolio: a React + Three.js site with a retro game-style
loading screen, an animated 3D hero, a filterable project showcase and an
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
- **3D model on a project or in the gallery:** export a `.glb` (in Blender:
  File > Export > glTF 2.0, format "glb") into `public/models/` and set
  `model: '/models/name.glb'`. Models are centred and scaled automatically.

## Structure

| File | What it does |
| --- | --- |
| `src/components/LoadingScreen.jsx` | Boot screen with segmented progress bar and curtain exit |
| `src/components/Hero.jsx` | 3D voxel mascot, floating cubes, letter-by-letter title, typed roles |
| `src/components/Sections.jsx` | Nav, About, Projects (filters + popup), 3D Gallery, timeline, contact |
| `src/components/ModelViewer.jsx` | Reusable orbit viewer with spin / wireframe / reset |
| `src/components/models.jsx` | Procedural models (Purin, Mars terrain, maze) and the `.glb` loader |

Animations use Framer Motion and respect the visitor's reduced-motion setting.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `master`. In the repo's **Settings > Pages**, set **Source** to
**GitHub Actions** once.

The previous Bootstrap site is kept in `legacy/` for reference; it is not part
of the build and can be deleted.

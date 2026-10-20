# pupupurin3.github.io

Noah Matsukuma's portfolio: a clean, minimal React site with a Lab section
that shows off harder front-end work (a 3D tape shelf, a model viewer,
scroll-linked animation, spring physics) and a ⌘K command palette.

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
| `src/components/LoadingScreen.jsx` | Counter + hairline progress intro with a clip-path exit |
| `src/components/Hero.jsx` | Masked word reveal, 3D tilt card with the diorama render |
| `src/components/Work.jsx` | Filterable project grid; cards morph into a detail dialog (shared layout) |
| `src/components/Lab.jsx` | Tabbed experiments: tape shelf, model viewer, scroll-linked text, spring physics |
| `src/components/TapeShelf.jsx` | 3D shelf of cassette tapes with hover, filter flip and a Now Playing popup |
| `src/components/Cassette.jsx` | Procedural cassette with a generated label, or your `.glb` |
| `src/components/CommandPalette.jsx` | ⌘K / Ctrl+K fuzzy search over sections, projects and links (the phone menu too) |
| `src/components/Sections.jsx` | Nav, About (bio, skills, experience, education), contact, toast |
| `src/components/models.jsx` | Procedural gallery models (Purin, Mars terrain, maze) and the `.glb` loader |

The header image is `public/img/hero-model.png`, a cut-out of the diorama render.

Animations use Framer Motion and respect the visitor's reduced-motion setting.

## Deploying

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `master`. In the repo's **Settings > Pages**, set **Source** to
**GitHub Actions** once.

The previous Bootstrap site is kept in `legacy/` for reference; it is not part
of the build and can be deleted.

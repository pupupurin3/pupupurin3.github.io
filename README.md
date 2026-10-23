# pupupurin3.github.io

Noah Matsukuma's portfolio: a clean, minimal React site with a Lab section
that shows off harder front-end work (a scrollable project shelf, a model viewer,
scroll-linked animation, spring physics), a ⌘K command palette and an
optional platformer you can play on top of the page.

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
| `src/components/LoadingScreen.jsx` | Counter + hairline progress intro with a clip-path exit |
| `src/components/Hero.jsx` | Masked word reveal, 3D tilt card with the diorama render |
| `src/components/Work.jsx` | Filterable project grid; cards morph into a detail dialog (shared layout) |
| `src/components/Lab.jsx` | Tabbed experiments: project shelf, model viewer, scroll-linked text, spring physics |
| `src/components/ProjectShelf.jsx` | One scrollable row of project cards on a shelf: drag with momentum, arrows, hover lift, card grows into its details |
| `src/components/AsciiDonut.jsx` | The header's spinning ASCII donut (donut.c on a canvas), filling the hero and running off its edges; each character is a spring that the cursor pushes away and a click scatters |
| `src/theme.js` | Light/dark theme: light by default, the nav switch (or ⌘K "Toggle dark mode") flips it and the choice is remembered |
| `src/components/PlayLayer.jsx` | Optional platformer over the real page (P or the Play button): Purin jumps on headings and cards, collects 8 stars and opens projects from their cards |
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

// The project catalogue. The site renders it and the API serves it (with
// live view and like counts) from this one list, so the two never disagree
// about which projects exist. Blurbs followed by `// TODO` were written from
// the repo name only and should be replaced with a real description.

import { z } from 'zod'

export const CATEGORIES = ['Projects', 'Simulations', 'Apps', '3D'] as const
export type Category = (typeof CATEGORIES)[number]

export const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.url(),
})
export type ProjectLink = z.infer<typeof ProjectLinkSchema>

export const ProjectSchema = z.object({
  /** URL-safe id, used by the API and in links. Never change it once live. */
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string(),
  category: z.enum(CATEGORIES),
  featured: z.boolean().optional(),
  status: z.string().optional(),
  /** Path under the site's public/ folder, e.g. `img/blackjack.jpg`. */
  image: z.string().optional(),
  /** More screenshots (paths under public/) shown in the project's detail view. */
  gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
  /** Accent colour for the generated cover when there is no image. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  tags: z.array(z.string()),
  blurb: z.string(),
  /** Repository name under the owner's GitHub account. */
  repo: z.string().optional(),
  links: z.array(ProjectLinkSchema).optional(),
  /**
   * Opens an interactive 3D viewer: a built-in procedural model key
   * ('purin', 'mars', 'maze') or a path to a .glb under public/models.
   */
  model: z.string().optional(),
  /** YouTube video id, shown in the project's detail view. */
  video: z.string().regex(/^[\w-]{11}$/).optional(),
}).meta({ id: 'Project' })
export type Project = z.infer<typeof ProjectSchema>

export const projects = [
  {
    slug: 'angela-toy-figure',
    title: 'Angela',
    featured: true,
    category: '3D',
    status: 'In progress · 2026',
    image: 'img/angela-pose.webp',
    gallery: [
      { src: 'img/angela-pose.webp', alt: 'Angela posed, holding a black folder, rendered in Arnold on a light grey background' },
      { src: 'img/angela-render.webp', alt: 'Angela rendered in Arnold: a chibi girl with light blue hair, amber eyes and a navy coat' },
      { src: 'img/angela-wireframe.webp', alt: 'The finished model in Maya, wireframe from the top, front and both sides' },
      { src: 'img/angela-blockout.webp', alt: 'The first blockout: simple rounded shapes for the head, body and limbs' },
    ],
    color: '#3a4a8c',
    tags: ['Maya', 'Arnold', 'Character'],
    blurb: 'A chibi toy figure modelled in Maya and rendered in Arnold with a toon look. It went from a rough blockout of rounded shapes to a finished character with sculpted hair, a layered coat and hand-painted eyes.',
  },
  {
    slug: 'street-corner',
    title: 'Street Corner',
    featured: true,
    category: '3D',
    color: '#4f6d7a',
    tags: ['Maya', 'Diorama'],
    blurb: 'A street corner diorama with a vending machine, power pole and balcony, modelled in Maya.',
    model: 'models/street-corner.glb',
  },
  {
    slug: 'diorama-render',
    title: 'Diorama Render',
    featured: true,
    category: '3D',
    status: 'Nov 2026',
    image: 'img/diorama-render.webp',
    gallery: [
      { src: 'img/diorama-render.webp', alt: 'The finished render: a small bedroom with a bed, desk, low table, hanging plant and a balcony door' },
      { src: 'img/diorama-viewport.webp', alt: 'The room in the Maya viewport with materials before rendering' },
      { src: 'img/diorama-blockout.webp', alt: 'The early blockout: grey shapes for the walls, bed, table and doors' },
    ],
    color: '#5a7a9c',
    tags: ['Maya', 'Arnold', 'Diorama'],
    blurb: 'A cutaway diorama of a small apartment bedroom, modelled in Maya and rendered in Arnold. It started as a grey blockout and grew into a lit scene with a desk, bookshelves, a hanging plant, a mirror and a balcony with laundry drying outside.',
  },
  {
    slug: 'obese-fat-gorilla-monkey',
    title: 'Obese Fat Gorilla Monkey',
    featured: true,
    category: 'Projects',
    status: 'In progress · 2026',
    image: 'img/ofgm-cambio.webp',
    gallery: [
      { src: 'img/ofgm-cambio.webp', alt: 'A Cambio round at the card table: four face-down hands, the deck and discard pile, and the turn buttons' },
      { src: 'img/ofgm-island.webp', alt: 'The whole island from above at sunset, with the lounge building in the middle and a volcano behind it' },
      { src: 'img/ofgm-volcano.webp', alt: 'Palm trees on the grass below the volcano' },
    ],
    color: '#5a3d2b',
    tags: ['Unity', 'C#', 'Multiplayer'],
    blurb: 'An online social hub for card games, built in Unity. You walk around a lounge as a monkey, chat and emote with other players, and sit down at a table to play. The first game is Cambio, with Elo ratings, spectating, a turn timer and a bot that only learns cards it is allowed to see.',
    repo: 'ObeseFatGorillaMonkey',
  },
  {
    slug: 'renderlab',
    title: 'RenderLab',
    featured: true,
    category: 'Projects',
    status: '2024 – present',
    image: 'img/renderlab-pyramid.webp',
    gallery: [
      { src: 'img/renderlab-pyramid.webp', alt: 'A stepped pyramid of 45,760 blocks drawn by the rasterizer' },
      { src: 'img/renderlab-raycast.webp', alt: 'The same pyramid in the raycaster with fog, soft shadows and a sun, plus the live stats overlay' },
      { src: 'img/renderlab-closeup.webp', alt: 'Close-up of the pyramid steps under the raycaster' },
      { src: 'img/renderlab-castle.webp', alt: 'A castle built in the editor, with cast shadows on the ground' },
      { src: 'img/renderlab-editor.webp', alt: 'The object editor: draw the top, front and side views and a block exists where all three are filled' },
      { src: 'img/renderlab-benchmark.webp', alt: 'Benchmark results: average and 95th percentile frame times for Java2D, the rasterizer and the raycaster' },
    ],
    color: '#2b3f5a',
    tags: ['Java', 'Swing', 'Graphics'],
    repo: 'RenderLab',
    blurb: 'A 3D rendering system written from scratch in Java. An editor turns three orthographic views into a 3D model, drawn by a multithreaded rasterizer with depth buffering, soft shadows and anti-aliasing. It renders a 720p frame in 5 to 8 ms; profiling with Java Flight Recorder and caching exposed faces and shadows cut frame time by 48%.',
  },
  {
    slug: 'scambio',
    title: 'SCAMBIO',
    featured: true,
    category: 'Apps',
    status: '2025',
    color: '#8c2f3a',
    tags: ['React', 'Node.js', 'Team project'],
    blurb: 'Winner of Rep. Maxine Waters’ 2025 Congressional App Challenge for California’s 43rd District, built with Jin Noguchi. A web app that helps families protect each other from scams: it checks messages for signs of a scam, teaches the red flags, and lets you practise on realistic simulated scams. I built the React training interface and the Node.js API that serves the simulations.',
    video: 'Psqxo44qtFQ',
    links: [
      { label: 'Congressional App Challenge', url: 'https://www.congressionalappchallenge.us/25-ca43/' },
      { label: 'Source on GitHub', url: 'https://github.com/jin-noguchi/congressional-app-challenge' },
    ],
  },
  {
    slug: 'fluid-simulation',
    title: 'Fluid Simulation',
    category: 'Simulations',
    color: '#2f6fb0',
    tags: ['Physics', 'Simulation'],
    blurb: 'A fluid simulation.', // TODO
    repo: 'Project_FluidSim',
  },
  {
    slug: 'mars-simulation',
    title: 'Mars Simulation',
    featured: true,
    category: 'Simulations',
    color: '#b5532f',
    tags: ['Simulation', '3D'],
    blurb: 'A simulation set on Mars.', // TODO
    repo: 'Project_MarsSimulation',
    model: 'mars',
  },
  {
    slug: 'fractal-visualizer',
    title: 'Fractal Visualizer',
    category: 'Simulations',
    color: '#6b3bb5',
    tags: ['Math', 'Graphics'],
    blurb: 'An interactive fractal visualizer.', // TODO
    repo: 'Project_FractalVisualizer',
  },
  {
    slug: '3d-maze-maker',
    title: '3D Maze Maker',
    featured: true,
    category: '3D',
    color: '#2f8f6f',
    tags: ['3D', 'Procedural'],
    blurb: 'A tool that generates 3D mazes.', // TODO
    repo: 'Project_3DMazeMaker',
    model: 'maze',
  },
  {
    slug: 'student-manager-app',
    title: 'Student Manager App',
    category: 'Apps',
    color: '#3b4f7a',
    tags: ['App'],
    blurb: 'An app for managing student records.', // TODO
    repo: 'Project_StudentManagerApp',
  },
  {
    slug: 'number-riddle',
    title: 'Number Riddle',
    category: 'Apps',
    color: '#7a3b5b',
    tags: ['Logic'],
    blurb: 'A number riddle game.', // TODO
    repo: 'Project_NumberRiddle',
  },
] as const satisfies readonly Project[]

export type ProjectSlug = (typeof projects)[number]['slug']

const slugs: ReadonlySet<string> = new Set(projects.map((p) => p.slug))
export const isProjectSlug = (s: string): s is ProjectSlug => slugs.has(s)

export const GITHUB_USER = 'pupupurin3'

/** Every outbound link for a project: its own links plus its source repo. */
export function projectLinks(p: Pick<Project, 'links' | 'repo'>): ProjectLink[] {
  const links = [...(p.links ?? [])]
  if (p.repo) links.push({ label: 'Source on GitHub', url: `https://github.com/${GITHUB_USER}/${p.repo}` })
  return links
}

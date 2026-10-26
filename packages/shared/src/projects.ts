// The project catalogue. The site renders it and the API serves it (with
// live view and like counts) from this one list, so the two never disagree
// about which projects exist. Blurbs followed by `// TODO` were written from
// the repo name only and should be replaced with a real description.

import { z } from 'zod'

export const CATEGORIES = ['Games', 'Simulations', 'Apps', '3D'] as const
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
}).meta({ id: 'Project' })
export type Project = z.infer<typeof ProjectSchema>

export const projects = [
  {
    slug: 'carpe-diem',
    title: 'Carpe Diem',
    featured: true,
    category: 'Games',
    status: 'In progress',
    image: 'img/carpe-diem.jpg',
    color: '#3b5b7a',
    tags: ['Game Dev', 'Pixel Art'],
    blurb: 'My original game, currently in development.',
  },
  {
    slug: 'blackjack-simulator',
    title: 'Blackjack Simulator',
    featured: true,
    category: 'Games',
    status: 'Nov 2023',
    image: 'img/blackjack.jpg',
    color: '#1f7a3a',
    tags: ['Python'],
    blurb: 'A playable blackjack game with hit and stand controls.',
    links: [{ label: 'Play on Replit', url: 'https://replit.com/@NoahMatsukuma/125-Shall-We-Play-a-Game' }],
  },
  {
    slug: 'virtual-escape-room',
    title: 'Virtual Escape Room',
    featured: true,
    category: 'Games',
    color: '#5b3b7a',
    tags: ['Team project', 'Game Dev'],
    blurb: 'The 2D top-down escape room game I built as Chief Programmer with a team of 8.',
    repo: 'Project_VirtualEscapeRoom',
  },
  {
    slug: 'hanafuda',
    title: 'Hanafuda',
    featured: true,
    category: 'Games',
    color: '#b23a48',
    tags: ['Card game'],
    blurb: 'A take on the traditional Japanese Hanafuda card game.', // TODO
    repo: 'Hanafuda',
  },
  {
    slug: 'coup-web-app',
    title: 'Coup Web App',
    category: 'Games',
    color: '#7a5b3b',
    tags: ['Web', 'Card game'],
    blurb: 'A web version of the card game Coup.', // TODO
    repo: 'Project_CoupWebApp',
  },
  {
    slug: 'tetois',
    title: 'TetOis',
    category: 'Games',
    color: '#3b7a74',
    tags: ['Puzzle'],
    blurb: 'A falling-block puzzle game.', // TODO
    repo: 'Project_TetOis',
  },
  {
    slug: 'minesweeper',
    title: 'Minesweeper',
    category: 'Games',
    color: '#596273',
    tags: ['Puzzle'],
    blurb: 'A recreation of classic Minesweeper.', // TODO
    repo: 'Project_Minesweeper',
  },
  {
    slug: 'pancake-stacker',
    title: 'Pancake Stacker',
    category: 'Games',
    color: '#c58a3a',
    tags: ['Arcade'],
    blurb: 'A pancake stacking game.', // TODO
    repo: 'Project_PancakeStacker',
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

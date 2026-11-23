import type { ComponentType, ReactNode } from 'react'
import { Fluid } from '../apps/Fluid'
import { Fourier } from '../apps/Fourier'
import { Maze } from '../apps/Maze'
import { Orbits } from '../apps/Orbits'
import { Readme } from '../apps/Readme'
import { ModelGallery } from '../ModelGallery'
import { ScrollReveal } from '../ScrollReveal'
import { SpringPhysics } from '../SpringPhysics'
import { ProjectShelf } from '../shelf/ProjectShelf'

export interface LabApp {
  id: string
  /** File name shown under the icon and in the title bar. */
  file: string
  glyph: string
  /** Default window size in px (clamped to the desktop). */
  w: number
  h: number
  Component: ComponentType
  /** The maths or technique behind it, shown in the window's side panel. */
  math?: ReactNode
}

const Eq = ({ children }: { children: ReactNode }) => <div className="eq">{children}</div>

export const LAB_APPS: LabApp[] = [
  { id: 'readme', file: 'README.txt', glyph: 'txt', w: 420, h: 380, Component: Readme },
  {
    id: 'fourier',
    file: 'fourier.app',
    glyph: '∑',
    w: 640,
    h: 470,
    Component: Fourier,
    math: (
      <>
        <p>Any closed path is a sum of rotating circles. Sample it at <i>N</i> points, treat each as a complex number, and take the discrete Fourier transform:</p>
        <Eq><i>X</i><sub>k</sub> = <sup>1</sup>⁄<sub><i>N</i></sub> Σ<sub>n</sub> <i>x</i><sub>n</sub> e<sup>−2πikn/N</sup></Eq>
        <p>Each coefficient is a circle of radius |<i>X</i><sub>k</sub>| spinning <i>k</i> times per cycle. Chained tip to tail, they trace the path again:</p>
        <Eq><i>x</i>(<i>t</i>) = Σ<sub>k</sub> <i>X</i><sub>k</sub> e<sup>2πikt</sup></Eq>
        <p>Circles are sorted by size, so the slider keeps only the largest terms. Watch the drawing sharpen as you add them.</p>
      </>
    ),
  },
  {
    id: 'fluid',
    file: 'fluid.sim',
    glyph: '≈',
    w: 520,
    h: 500,
    Component: Fluid,
    math: (
      <>
        <p>Incompressible Navier–Stokes on an 80×80 grid, solved with Jos Stam’s <em>Stable Fluids</em> method:</p>
        <Eq>∂<b>u</b>/∂<i>t</i> = −(<b>u</b>·∇)<b>u</b> − ∇<i>p</i> + ν∇²<b>u</b></Eq>
        <Eq>∇·<b>u</b> = 0</Eq>
        <ol>
          <li><b>Diffuse</b>: implicit, Gauss–Seidel relaxed.</li>
          <li><b>Advect</b>: trace each cell back along the flow and sample (semi-Lagrangian), unconditionally stable.</li>
          <li><b>Project</b>: solve ∇²<i>p</i> = ∇·<b>u</b> and subtract ∇<i>p</i> to remove divergence.</li>
        </ol>
        <p>Three dye channels ride the velocity field and absorb light, like ink on paper.</p>
      </>
    ),
  },
  {
    id: 'orbits',
    file: 'orbits.sim',
    glyph: '◎',
    w: 600,
    h: 520,
    Component: Orbits,
    math: (
      <>
        <p>Units are AU and years, so the Sun’s gravity is simply <i>GM</i> = 4π². Each body feels</p>
        <Eq><b>a</b> = −<i>GM</i> <b>r</b> / |<b>r</b>|³</Eq>
        <p>and is stepped with <b>velocity Verlet</b>, a symplectic integrator, so the energy error (ΔE/E) stays tiny instead of drifting.</p>
        <p>A Hohmann transfer leaves Earth at perihelion speed</p>
        <Eq><i>v</i> = √(<i>GM</i>/<i>r</i>₁) · √(2<i>r</i>₂ / (<i>r</i>₁ + <i>r</i>₂))</Eq>
        <p>and takes half an orbit of the transfer ellipse, so Mars must lead Earth by 180° − 360°·<i>t</i>/<i>T</i><sub>Mars</sub> ≈ 44° at launch.</p>
      </>
    ),
  },
  {
    id: 'maze',
    file: 'maze.exe',
    glyph: '▦',
    w: 560,
    h: 440,
    Component: Maze,
    math: (
      <>
        <p><b>Carve</b>: a randomised depth-first search. From the top of the stack, knock through to a random unvisited neighbour; when there are none, pop. The result is a spanning tree, so every cell connects by exactly one path.</p>
        <p><b>Solve</b>: A* always expands the open cell with the lowest</p>
        <Eq><i>f</i>(<i>n</i>) = <i>g</i>(<i>n</i>) + <i>h</i>(<i>n</i>)</Eq>
        <p>where <i>g</i> is the steps taken and <i>h</i> is the Manhattan distance to the goal. Because <i>h</i> never overestimates, the path found is the shortest.</p>
      </>
    ),
  },
  {
    id: 'models',
    file: 'models',
    glyph: '◆',
    w: 680,
    h: 500,
    Component: ModelGallery,
    math: (
      <>
        <p>Three.js through React Three Fiber. My Maya models are exported to glTF; the procedural ones are single instanced meshes, one draw call for hundreds of voxels.</p>
        <p>The canvas only renders while it is on screen, so a hidden window costs nothing.</p>
      </>
    ),
  },
  { id: 'springs', file: 'springs.demo', glyph: '∿', w: 640, h: 440, Component: SpringPhysics,
    math: <p>Damped springs: <span className="eq-inline"><i>F</i> = −<i>k</i><i>x</i> − <i>c</i><i>v</i></span>. A flung card starts with your release velocity and settles back inside its bounds.</p> },
  { id: 'scroll', file: 'scroll.demo', glyph: '¶', w: 560, h: 460, Component: ScrollReveal,
    math: <p>Every word’s opacity and offset are derived from scroll position through motion values, so it animates without re-rendering React.</p> },
  { id: 'shelf', file: 'shelf', glyph: '▤', w: 760, h: 460, Component: ProjectShelf },
]

export const findApp = (id: string) => LAB_APPS.find((a) => a.id === id)

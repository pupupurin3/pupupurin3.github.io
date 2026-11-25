import { useRef, useState } from 'react'
import { useCanvasLoop } from '../desktop/useCanvasLoop'

// A maze carved by a randomised depth-first search (recursive backtracker),
// then solved with A* using Manhattan distance. Both run a few steps per
// frame so you can watch the stack and the open set grow.
const COLS = 25
const ROWS = 17
const DIRS = [
  { bit: 1, dx: 0, dy: -1, opp: 4 },
  { bit: 2, dx: 1, dy: 0, opp: 8 },
  { bit: 4, dx: 0, dy: 1, opp: 1 },
  { bit: 8, dx: -1, dy: 0, opp: 2 },
]
const id = (x: number, y: number) => y * COLS + x

function makeMaze() {
  return {
    walls: new Uint8Array(COLS * ROWS).fill(15),
    visited: new Uint8Array(COLS * ROWS),
    stack: [0],
    phase: 'carve' as 'carve' | 'solve' | 'done',
    open: [] as number[],
    closed: new Uint8Array(COLS * ROWS),
    g: new Float32Array(COLS * ROWS).fill(Infinity),
    came: new Int32Array(COLS * ROWS).fill(-1),
    path: [] as number[],
    doneAt: 0,
    expanded: 0,
  }
}
type M = ReturnType<typeof makeMaze>

const GOAL = COLS * ROWS - 1
const h = (c: number) => Math.abs((c % COLS) - (COLS - 1)) + Math.abs(Math.floor(c / COLS) - (ROWS - 1))

function carve(m: M) {
  const cur = m.stack[m.stack.length - 1]
  if (cur === undefined) {
    m.phase = 'solve'
    m.g[0] = 0
    m.open = [0]
    return
  }
  m.visited[cur] = 1
  const x = cur % COLS, y = Math.floor(cur / COLS)
  const options = DIRS.filter((d) => {
    const nx = x + d.dx, ny = y + d.dy
    return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !m.visited[id(nx, ny)]
  })
  if (!options.length) { m.stack.pop(); return }
  const d = options[Math.floor(Math.random() * options.length)]!
  const next = id(x + d.dx, y + d.dy)
  m.walls[cur]! &= ~d.bit
  m.walls[next]! &= ~d.opp
  m.visited[next] = 1
  m.stack.push(next)
}

function solve(m: M) {
  if (!m.open.length) { m.phase = 'done'; return }
  // Pick the open cell with the lowest f = g + h.
  let best = 0
  for (let i = 1; i < m.open.length; i++) if (m.g[m.open[i]!]! + h(m.open[i]!) < m.g[m.open[best]!]! + h(m.open[best]!)) best = i
  const cur = m.open.splice(best, 1)[0]!
  m.closed[cur] = 1
  m.expanded++
  if (cur === GOAL) {
    for (let c = GOAL; c !== -1; c = m.came[c]!) m.path.unshift(c)
    m.phase = 'done'
    return
  }
  const x = cur % COLS, y = Math.floor(cur / COLS)
  for (const d of DIRS) {
    if (m.walls[cur]! & d.bit) continue
    const n = id(x + d.dx, y + d.dy)
    if (m.closed[n]) continue
    const g = m.g[cur]! + 1
    if (g < m.g[n]!) {
      m.g[n] = g
      m.came[n] = cur
      if (!m.open.includes(n)) m.open.push(n)
    }
  }
}

export function Maze() {
  const maze = useRef(makeMaze())
  const [speed, setSpeed] = useState(4)

  const canvas = useCanvasLoop(({ ctx, w, h: H, dt }) => {
    const m = maze.current
    const css = getComputedStyle(canvas.current!)
    const ink = css.getPropertyValue('--text').trim() || '#111'
    const accent = css.getPropertyValue('--accent').trim() || '#f40'

    for (let i = 0; i < speed; i++) {
      if (m.phase === 'carve') carve(m)
      else if (m.phase === 'solve') solve(m)
    }
    if (m.phase === 'done') {
      m.doneAt += dt
      if (m.doneAt > 3) maze.current = makeMaze()
    }

    ctx.clearRect(0, 0, w, H)
    const cell = Math.min((w - 16) / COLS, (H - 16) / ROWS)
    const ox = (w - cell * COLS) / 2, oy = (H - cell * ROWS) / 2
    const fill = (c: number, color: string, inset = 0) => {
      ctx.fillStyle = color
      ctx.fillRect(ox + (c % COLS) * cell + inset, oy + Math.floor(c / COLS) * cell + inset, cell - inset * 2, cell - inset * 2)
    }
    for (let c = 0; c < COLS * ROWS; c++) {
      if (m.closed[c]) fill(c, '#dcebf5')
      else if (m.visited[c]) fill(c, '#ffffff')
      else fill(c, '#eef0f2')
    }
    if (m.phase === 'carve') m.stack.forEach((c) => fill(c, '#ffd9cc'))
    m.open.forEach((c) => fill(c, '#9cc8e4', cell * 0.25))
    const top = m.stack[m.stack.length - 1]
    if (m.phase === 'carve' && top !== undefined) fill(top, accent, cell * 0.2)

    ctx.strokeStyle = ink
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let c = 0; c < COLS * ROWS; c++) {
      const x = ox + (c % COLS) * cell, y = oy + Math.floor(c / COLS) * cell, wl = m.walls[c]!
      if (wl & 1) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y) }
      if (wl & 8) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell) }
      if (c % COLS === COLS - 1 && wl & 2) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell) }
      if (Math.floor(c / COLS) === ROWS - 1 && wl & 4) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell) }
    }
    ctx.stroke()

    if (m.path.length) {
      ctx.strokeStyle = accent
      ctx.lineWidth = Math.max(2, cell * 0.28)
      ctx.lineJoin = 'round'
      ctx.beginPath()
      m.path.forEach((c, i) => {
        const x = ox + ((c % COLS) + 0.5) * cell, y = oy + (Math.floor(c / COLS) + 0.5) * cell
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      })
      ctx.stroke()
    }
  })

  return (
    <div className="app app-maze">
      <canvas ref={canvas} className="app-canvas" aria-label="Maze being generated and solved" />
      <div className="app-controls">
        <label>
          Steps/frame <output>{speed}</output>
          <input type="range" min={1} max={30} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <button className="app-btn" onClick={() => (maze.current = makeMaze())}>New maze</button>
        <span className="app-hint"><i className="key-stack" /> DFS stack <i className="key-open" /> A* open set <i className="key-closed" /> explored</span>
      </div>
    </div>
  )
}

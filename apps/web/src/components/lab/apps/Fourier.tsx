import { useMemo, useRef, useState } from 'react'
import { localPoint, useCanvasLoop } from '../desktop/useCanvasLoop'

type Pt = { x: number; y: number }
interface Term { k: number; re: number; im: number; amp: number; phase: number }

const N = 256

// Purin's pudding with a cherry on top, as a rough outline (y points down).
const PUDDING: Pt[] = [
  [-0.95, 0.72], [0.95, 0.72], [0.82, 0.5], [0.62, -0.3], [0.3, -0.38], [0.2, -0.58], [0, -0.7],
  [-0.2, -0.58], [-0.3, -0.38], [-0.62, -0.3], [-0.82, 0.5],
].map(([x, y]) => ({ x: x!, y: y! }))

/** Resamples a closed polyline to n points evenly spaced along its length. */
export function resample(pts: Pt[], n: number): Pt[] {
  const closed = [...pts, pts[0]!]
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < closed.length; i++) {
    const d = Math.hypot(closed[i]!.x - closed[i - 1]!.x, closed[i]!.y - closed[i - 1]!.y)
    seg.push(d)
    total += d
  }
  const out: Pt[] = []
  let i = 0, acc = 0
  for (let s = 0; s < n; s++) {
    const target = (s / n) * total
    while (i < seg.length - 1 && acc + seg[i]! < target) acc += seg[i++]!
    const f = seg[i] ? (target - acc) / seg[i]! : 0
    const a = closed[i]!, b = closed[i + 1]!
    out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
  }
  return out
}

/** Discrete Fourier transform of a closed path, terms sorted by radius. */
export function dft(pts: Pt[]): Term[] {
  const n = pts.length
  const terms: Term[] = []
  for (let k = -n / 2; k < n / 2; k++) {
    let re = 0, im = 0
    for (let j = 0; j < n; j++) {
      const a = (-2 * Math.PI * k * j) / n
      const { x, y } = pts[j]!
      // (x + iy)(cos a + i sin a)
      re += x * Math.cos(a) - y * Math.sin(a)
      im += x * Math.sin(a) + y * Math.cos(a)
    }
    re /= n
    im /= n
    terms.push({ k, re, im, amp: Math.hypot(re, im), phase: Math.atan2(im, re) })
  }
  return terms.sort((a, b) => b.amp - a.amp)
}

/** Centres a path on the origin and scales it to fit a unit box. */
function normalise(pts: Pt[]): Pt[] {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const s = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 || 1
  return pts.map((p) => ({ x: (p.x - cx) / s, y: (p.y - cy) / s }))
}

export function Fourier() {
  const [shape, setShape] = useState<Pt[]>(() => resample(PUDDING, N))
  const terms = useMemo(() => dft(shape), [shape])
  const [count, setCount] = useState(48)
  const drawing = useRef<Pt[] | null>(null)
  const state = useRef({ t: 0, trace: [] as Pt[], key: '' })

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const css = getComputedStyle(canvas.current!)
    const ink = css.getPropertyValue('--text').trim() || '#111'
    const accent = css.getPropertyValue('--accent').trim() || '#f40'
    const faint = css.getPropertyValue('--border-strong').trim() || '#ccc'
    ctx.clearRect(0, 0, w, h)
    const scale = Math.min(w, h) * 0.36
    const ox = w / 2, oy = h / 2

    if (drawing.current) {
      ctx.strokeStyle = accent
      ctx.lineWidth = 2
      ctx.beginPath()
      drawing.current.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
      ctx.stroke()
      return
    }

    const s = state.current
    const key = `${count}:${terms.length}:${terms[0]?.amp}`
    if (s.key !== key) { s.key = key; s.trace = []; s.t = 0 }
    s.t += dt * 0.12
    if (s.t >= 1) { s.t -= 1; s.trace = [] }

    // Ghost of the target shape.
    ctx.strokeStyle = faint
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    shape.forEach((p, i) => (i ? ctx.lineTo(ox + p.x * scale, oy + p.y * scale) : ctx.moveTo(ox + p.x * scale, oy + p.y * scale)))
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    // Chain of circles: each term spins k times per cycle.
    let x = ox, y = oy
    ctx.lineWidth = 1
    for (let i = 0; i < Math.min(count, terms.length); i++) {
      const { k, amp, phase } = terms[i]!
      const a = 2 * Math.PI * k * s.t + phase
      const r = amp * scale
      const nx = x + r * Math.cos(a), ny = y + r * Math.sin(a)
      if (r > 0.6) {
        ctx.strokeStyle = ink
        ctx.globalAlpha = i < 6 ? 0.28 : 0.12
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(nx, ny)
        ctx.stroke()
      }
      x = nx
      y = ny
    }
    ctx.globalAlpha = 1
    s.trace.push({ x, y })
    ctx.strokeStyle = accent
    ctx.lineWidth = 2.2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    s.trace.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
  })

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = [localPoint(e, e.currentTarget)]
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const p = localPoint(e, e.currentTarget)
    const last = drawing.current[drawing.current.length - 1]!
    if (Math.hypot(p.x - last.x, p.y - last.y) > 3) drawing.current.push(p)
  }
  const onUp = () => {
    const pts = drawing.current
    drawing.current = null
    if (pts && pts.length > 12) setShape(resample(normalise(pts), N))
  }

  return (
    <div className="app app-fourier">
      <canvas ref={canvas} className="app-canvas draw" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label="Fourier epicycles. Draw a closed shape to transform it." />
      <div className="app-controls">
        <label>
          Terms <output>{count}</output>
          <input type="range" min={1} max={N} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </label>
        <button className="app-btn" onClick={() => setShape(resample(PUDDING, N))}>Reset</button>
        <span className="app-hint">Draw a shape on the canvas</span>
      </div>
    </div>
  )
}

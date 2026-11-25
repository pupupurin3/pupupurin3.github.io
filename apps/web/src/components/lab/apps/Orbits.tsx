import { useRef, useState } from 'react'
import { useCanvasLoop } from '../desktop/useCanvasLoop'

// Inner solar system in AU and years, where GM☉ = 4π². Each body is
// integrated with velocity Verlet (symplectic, so energy stays bounded),
// and a probe can fly a Hohmann transfer from Earth to Mars.
const GM = 4 * Math.PI * Math.PI
const H = 0.0005 // years per substep
const TRAIL_DT = 0.004 // years between trail points

interface Body { name: string; color: string; r: number; x: number; y: number; vx: number; vy: number; trail: number[]; e0: number; /** Trail points to keep. */ keep: number }

function body(name: string, color: string, size: number, a: number, e: number, angle: number): Body {
  // Start at perihelion, moving perpendicular to the radius (vis-viva).
  const rp = a * (1 - e)
  const v = Math.sqrt(GM * (1 + e) / rp)
  // Keep most of one orbit (period = a^1.5 years) as a trail.
  const keep = Math.round((0.85 * Math.pow(a, 1.5)) / TRAIL_DT)
  const b = { name, color, r: size, x: rp * Math.cos(angle), y: rp * Math.sin(angle), vx: -v * Math.sin(angle), vy: v * Math.cos(angle), trail: [], e0: 0, keep }
  b.e0 = energy(b)
  return b
}

const energy = (b: Pick<Body, 'x' | 'y' | 'vx' | 'vy'>) => 0.5 * (b.vx * b.vx + b.vy * b.vy) - GM / Math.hypot(b.x, b.y)

function accel(x: number, y: number) {
  const r2 = x * x + y * y, r3 = r2 * Math.sqrt(r2)
  return [(-GM * x) / r3, (-GM * y) / r3] as const
}

function verlet(b: Body, h: number) {
  const [ax, ay] = accel(b.x, b.y)
  b.vx += 0.5 * h * ax
  b.vy += 0.5 * h * ay
  b.x += h * b.vx
  b.y += h * b.vy
  const [bx, by] = accel(b.x, b.y)
  b.vx += 0.5 * h * bx
  b.vy += 0.5 * h * by
}

const R_MARS = 1.524
const deg = (r: number) => ((r * 180) / Math.PI + 360) % 360

/** Mars' lead over Earth that makes a Hohmann transfer arrive on time. */
export function hohmannPhase(r1: number, r2: number) {
  const transfer = 0.5 * Math.pow((r1 + r2) / 2, 1.5)
  return 180 - 360 * (transfer / Math.pow(r2, 1.5))
}

function makeSystem() {
  return {
    t: 0,
    bodies: [
      body('Mercury', '#9a9a9a', 2.5, 0.387, 0.206, 1.2),
      body('Venus', '#d8a25a', 3.5, 0.723, 0.007, 2.6),
      body('Earth', '#3d7bd9', 4, 1, 0.017, 0),
      body('Mars', '#d4542c', 3.5, R_MARS, 0.093, 0.4),
    ],
    probe: null as Body | null,
  }
}

export function Orbits() {
  const sys = useRef(makeSystem())
  const [speed, setSpeed] = useState(0.5)
  const [waiting, setWaiting] = useState(false)
  const waitRef = useRef(false)
  waitRef.current = waiting

  const launch = () => {
    const s = sys.current
    const earth = s.bodies[2]!
    const r1 = Math.hypot(earth.x, earth.y)
    const v = Math.sqrt(GM / r1) * Math.sqrt((2 * R_MARS) / (r1 + R_MARS))
    const ev = Math.hypot(earth.vx, earth.vy)
    s.probe = { name: 'Probe', color: '', r: 2.5, x: earth.x, y: earth.y, vx: (earth.vx / ev) * v, vy: (earth.vy / ev) * v, trail: [], e0: 0, keep: 500 }
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = sys.current
    const css = getComputedStyle(canvas.current!)
    const ink = css.getPropertyValue('--text').trim() || '#111'
    const muted = css.getPropertyValue('--faint').trim() || '#888'
    const accent = css.getPropertyValue('--accent').trim() || '#f40'

    const steps = Math.round((dt * speed) / H)
    for (let i = 0; i < steps; i++) {
      for (const b of s.bodies) verlet(b, H)
      if (s.probe) verlet(s.probe, H)
      s.t += H
      if (Math.floor(s.t / TRAIL_DT) !== Math.floor((s.t - H) / TRAIL_DT)) {
        // Trails are kept in AU, so resizing the window never smears them.
        for (const b of [...s.bodies, ...(s.probe ? [s.probe] : [])]) {
          b.trail.push(b.x, b.y)
          if (b.trail.length > b.keep * 2) b.trail.splice(0, b.trail.length - b.keep * 2)
        }
      }
    }
    const earth = s.bodies[2]!, mars = s.bodies[3]!
    const phase = (deg(Math.atan2(mars.y, mars.x)) - deg(Math.atan2(earth.y, earth.x)) + 360) % 360
    const ideal = hohmannPhase(1, R_MARS)
    if (waitRef.current && Math.abs(phase - ideal) < 1.5) { launch(); setWaiting(false) }

    ctx.clearRect(0, 0, w, h)
    const scale = (Math.min(w, h) / 2 - 18) / 1.7
    const cx = w / 2, cy = h / 2
    const P = (x: number, y: number) => [cx + x * scale, cy - y * scale] as const

    for (const b of [...s.bodies, ...(s.probe ? [s.probe] : [])]) {
      ctx.strokeStyle = b === s.probe ? accent : b.color
      ctx.lineWidth = b === s.probe ? 1.6 : 1
      ctx.globalAlpha = 0.45
      ctx.beginPath()
      for (let i = 0; i < b.trail.length; i += 2) {
        const [tx, ty] = P(b.trail[i]!, b.trail[i + 1]!)
        if (i) ctx.lineTo(tx, ty)
        else ctx.moveTo(tx, ty)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
      const [px, py] = P(b.x, b.y)
      ctx.fillStyle = b === s.probe ? accent : b.color
      ctx.beginPath()
      ctx.arc(px, py, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#f5b335'
    ctx.beginPath()
    ctx.arc(cx, cy, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillStyle = muted
    const drift = ((energy(mars) - mars.e0) / Math.abs(mars.e0)) * 100
    const lines = [
      `t      ${s.t.toFixed(2)} yr`,
      `phase  ${phase.toFixed(1)}°  (ideal ${ideal.toFixed(1)}°)`,
      `ΔE/E   ${drift >= 0 ? '+' : ''}${drift.toExponential(1)} %`,
    ]
    lines.forEach((l, i) => ctx.fillText(l, 12, 20 + i * 15))
    ctx.fillStyle = ink
    ctx.fillText('Earth', ...offset(P(earth.x, earth.y)))
    ctx.fillText('Mars', ...offset(P(mars.x, mars.y)))
  })

  return (
    <div className="app app-orbits">
      <canvas ref={canvas} className="app-canvas" aria-label="Orbit simulation of the inner planets" />
      <div className="app-controls">
        <label>
          Speed <output>{speed.toFixed(2)} yr/s</output>
          <input type="range" min={0.05} max={1.5} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <button className="app-btn" onClick={launch}>Launch now</button>
        <button className={`app-btn ${waiting ? 'on' : ''}`} onClick={() => setWaiting((v) => !v)}>
          {waiting ? 'Waiting for window…' : 'Launch at window'}
        </button>
        <button className="app-btn" onClick={() => (sys.current = makeSystem())}>Reset</button>
      </div>
    </div>
  )
}

const offset = ([x, y]: readonly [number, number]) => [x + 8, y - 8] as const

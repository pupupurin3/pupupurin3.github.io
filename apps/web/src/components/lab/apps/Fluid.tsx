import { useRef } from 'react'
import { localPoint, useCanvasLoop } from '../desktop/useCanvasLoop'

// Jos Stam's "Stable Fluids" on a small grid: velocity is advected
// semi-Lagrangian style, diffused and then projected to be divergence free
// with Gauss-Seidel iterations. Three dye channels ride along.
const N = 80
const SIZE = (N + 2) * (N + 2)
const ITER = 14
const DT = 0.1
const IX = (i: number, j: number) => i + (N + 2) * j

function setBnd(b: number, x: Float32Array) {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i)] = b === 1 ? -x[IX(1, i)]! : x[IX(1, i)]!
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)]! : x[IX(N, i)]!
    x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)]! : x[IX(i, 1)]!
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)]! : x[IX(i, N)]!
  }
  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)]! + x[IX(0, 1)]!)
  x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)]! + x[IX(0, N)]!)
  x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)]! + x[IX(N + 1, 1)]!)
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)]! + x[IX(N + 1, N)]!)
}

function linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number) {
  for (let k = 0; k < ITER; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        x[IX(i, j)] = (x0[IX(i, j)]! + a * (x[IX(i - 1, j)]! + x[IX(i + 1, j)]! + x[IX(i, j - 1)]! + x[IX(i, j + 1)]!)) / c
      }
    }
    setBnd(b, x)
  }
}

function diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number) {
  const a = DT * diff * N * N
  linSolve(b, x, x0, a, 1 + 4 * a)
}

function advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array) {
  const dt0 = DT * N
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      // Trace the particle backwards through the velocity field.
      let x = i - dt0 * u[IX(i, j)]!, y = j - dt0 * v[IX(i, j)]!
      x = Math.min(Math.max(x, 0.5), N + 0.5)
      y = Math.min(Math.max(y, 0.5), N + 0.5)
      const i0 = Math.floor(x), j0 = Math.floor(y), s1 = x - i0, t1 = y - j0
      d[IX(i, j)] = (1 - s1) * ((1 - t1) * d0[IX(i0, j0)]! + t1 * d0[IX(i0, j0 + 1)]!) + s1 * ((1 - t1) * d0[IX(i0 + 1, j0)]! + t1 * d0[IX(i0 + 1, j0 + 1)]!)
    }
  }
  setBnd(b, d)
}

function project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) {
  const h = 1 / N
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] = -0.5 * h * (u[IX(i + 1, j)]! - u[IX(i - 1, j)]! + v[IX(i, j + 1)]! - v[IX(i, j - 1)]!)
      p[IX(i, j)] = 0
    }
  }
  setBnd(0, div)
  setBnd(0, p)
  linSolve(0, p, div, 1, 4)
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      u[IX(i, j)]! -= (0.5 * (p[IX(i + 1, j)]! - p[IX(i - 1, j)]!)) / h
      v[IX(i, j)]! -= (0.5 * (p[IX(i, j + 1)]! - p[IX(i, j - 1)]!)) / h
    }
  }
  setBnd(1, u)
  setBnd(2, v)
}

function makeSim() {
  const f = () => new Float32Array(SIZE)
  return { u: f(), v: f(), u0: f(), v0: f(), dye: [f(), f(), f()], tmp: f(), div: f(), p: f() }
}
type Sim = ReturnType<typeof makeSim>

function step(s: Sim, visc: number) {
  diffuse(1, s.u0, s.u, visc)
  diffuse(2, s.v0, s.v, visc)
  project(s.u0, s.v0, s.p, s.div)
  advect(1, s.u, s.u0, s.u0, s.v0)
  advect(2, s.v, s.v0, s.u0, s.v0)
  project(s.u, s.v, s.p, s.div)
  for (const d of s.dye) {
    s.tmp.set(d)
    advect(0, d, s.tmp, s.u, s.v)
    for (let i = 0; i < SIZE; i++) d[i]! *= 0.996
  }
}

// Ink colours, cycled per stroke: accent orange, Angela blue, navy.
const INKS: [number, number, number][] = [[255, 79, 46], [96, 170, 214], [43, 47, 107]]

export function Fluid() {
  const sim = useRef<Sim>(makeSim())
  const pointer = useRef<{ x: number; y: number; px: number; py: number; down: boolean; ink: number } | null>(null)
  const idle = useRef(0)
  const off = useRef<{ c: HTMLCanvasElement; img: ImageData } | null>(null)

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = sim.current
    if (!off.current) {
      const c = document.createElement('canvas')
      c.width = c.height = N
      off.current = { c, img: c.getContext('2d')!.createImageData(N, N) }
    }
    const p = pointer.current
    if (p?.down) {
      const gx = (p.x / w) * N, gy = (p.y / h) * N
      const du = ((p.x - p.px) / w) * 9, dv = ((p.y - p.py) / h) * 9
      splatInk(gx, gy, du, dv, INKS[p.ink % INKS.length]!)
      p.px = p.x
      p.py = p.y
      idle.current = 0
    } else {
      // A gentle rising jet keeps the window alive when nobody is playing.
      idle.current += dt
      if (idle.current > 1.5) {
        const t = performance.now() / 1000
        splatInk(N / 2 + Math.sin(t * 0.7) * N * 0.18, N - 6, Math.sin(t * 1.3) * 0.25, -0.9, INKS[Math.floor(t / 4) % INKS.length]!, 2)
      }
    }
    step(s, 0.00001)

    // Dye tints white paper: each channel absorbs its colour.
    const data = off.current.img.data
    const [r, g, b] = s.dye
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const k = IX(i + 1, j + 1), o = (i + j * N) * 4
        data[o] = 255 - Math.min(255, r![k]! * 255)
        data[o + 1] = 255 - Math.min(255, g![k]! * 255)
        data[o + 2] = 255 - Math.min(255, b![k]! * 255)
        data[o + 3] = 255
      }
    }
    off.current.c.getContext('2d')!.putImageData(off.current.img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(off.current.c, 0, 0, w, h)
  }, { pixelRatio: 1 })

  // Dye is stored as absorbed light, so an ink colour is its complement.
  function splatInk(gx: number, gy: number, du: number, dv: number, ink: [number, number, number], r = 3) {
    const s = sim.current
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        const x = Math.round(gx) + i, y = Math.round(gy) + j
        if (x < 1 || x > N || y < 1 || y > N) continue
        const f = Math.exp(-(i * i + j * j) / (r * r * 0.6))
        s.u[IX(x, y)]! += du * f
        s.v[IX(x, y)]! += dv * f
        s.dye.forEach((d, c) => { d[IX(x, y)] = Math.min(1.2, d[IX(x, y)]! + (1 - ink[c]! / 255) * f * 0.5) })
      }
    }
  }
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = localPoint(e, e.currentTarget)
    pointer.current = { x, y, px: x, py: y, down: true, ink: (pointer.current?.ink ?? -1) + 1 }
  }
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointer.current?.down) return
    Object.assign(pointer.current, localPoint(e, e.currentTarget))
  }
  const onUp = () => { if (pointer.current) pointer.current.down = false }

  return (
    <div className="app app-fluid">
      <canvas ref={canvas} className="app-canvas draw" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-label="Fluid simulation. Drag to stir the ink." />
      <div className="app-controls">
        <button className="app-btn" onClick={() => (sim.current = makeSim())}>Clear</button>
        <span className="app-hint">Drag to stir · each stroke changes ink</span>
      </div>
    </div>
  )
}

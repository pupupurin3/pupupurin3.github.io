import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// The classic donut.c torus, drawn as text on a canvas that fills the whole
// hero, big enough to run off the edges. Every character cell is also a
// little spring: the cursor pushes nearby characters away, a click or tap
// blasts them outwards, and they all drift back into place. Moving the
// cursor also tilts the donut and flicks it faster for a moment.
// Pointer events are read from the parent section, so it reacts even while
// the cursor is over the hero text.
// Not on the page right now (the hero became the Sunfaded poster); kept so it
// can come back, e.g. as a Lab experiment.

const RAMP = '.,-~:;=!*#$@'
const R1 = 1 // tube radius
const R2 = 2 // distance from the centre of the hole to the centre of the tube
const K2 = 6 // distance from the viewer

const SPRING = 0.06
const DAMPING = 0.86
const PUSH_RADIUS = 90
const PUSH = 2.6
const BURST_RADIUS = 360
const BURST = 70
const ACCENT_LEVELS = 4

// Sines and cosines around a full turn, sampled n times.
const ring = (n: number): [Float32Array, Float32Array] => {
  const s = new Float32Array(n), c = new Float32Array(n)
  for (let i = 0; i < n; i++) { s[i] = Math.sin((i / n) * Math.PI * 2); c[i] = Math.cos((i / n) * Math.PI * 2) }
  return [s, c]
}

// Where the donut sits and how big it is. On wide screens it fills the right
// side and spills past the top, bottom and right edges; on narrow screens it
// sits under the text and spills off the bottom and sides.
function layout(w: number, h: number) {
  if (w >= 880) return { cx: w * 0.78, cy: h * 0.5, size: Math.max(h * 1.7, w * 0.9) }
  return { cx: w * 0.6, cy: h * 0.84, size: Math.max(w * 1.8, 640) }
}

export function AsciiDonut({ start = true }: { start?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [touched, setTouched] = useState(false)
  const startRef = useRef(start)
  startRef.current = start

  useEffect(() => {
    const el = canvas.current!
    const box = wrap.current!
    const host = box.parentElement!
    const ctx = el.getContext('2d')!
    let text = '#111', accent = '#2f6fe4', mono = 'monospace', invert = true
    const readColors = () => {
      const css = getComputedStyle(document.documentElement)
      text = css.getPropertyValue('--text').trim() || text
      accent = css.getPropertyValue('--accent').trim() || accent
      mono = css.getPropertyValue('--mono').trim() || mono
      // On a light page the shading flips: lit surfaces get the sparse
      // characters and shadowed ones the dense, dark ones. (The site is light only.)
      invert = true
    }
    readColors()

    let w = 0, h = 0, font = 12, cw = 7, ch = 13, cols = 0, rows = 0
    let lum = new Int8Array(0), zbuf = new Float32Array(0)
    let ox: Float32Array = new Float32Array(0), oy: Float32Array = new Float32Array(0), vx: Float32Array = new Float32Array(0), vy: Float32Array = new Float32Array(0)
    let place = layout(1, 1), buckets = new Int32Array(0), cells = 0
    const counts = new Int32Array(RAMP.length + ACCENT_LEVELS)
    let sinT: Float32Array = new Float32Array(0), cosT = sinT, sinP = sinT, cosP = sinT
    let A = 0.9, B = 0, spin = 0, tiltX = 0, tiltY = 0
    let raf = 0, visible = true, assembled = false
    const pointer = { x: -1e4, y: -1e4, inside: false, tx: 0, ty: 0, lastX: 0, lastY: 0 }

    const resize = () => {
      const r = box.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      font = w >= 880 ? 13 : 11
      cw = font * 0.62; ch = font * 1.15
      cols = Math.ceil(w / cw); rows = Math.ceil(h / ch)
      const n = cols * rows
      cells = n
      buckets = new Int32Array(n * counts.length)
      lum = new Int8Array(n); zbuf = new Float32Array(n)
      ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n)
      place = layout(w, h)
      // Sample densely enough that a big donut has no gaps between cells.
      const phi = Math.min(680, Math.max(300, Math.round(place.size * 0.45)))
      ;[sinT, cosT] = ring(Math.round(phi / 3.2))
      ;[sinP, cosP] = ring(phi)
    }

    // Scatter every cell far away so the donut flies together on first show.
    const scatter = () => {
      for (let i = 0; i < ox.length; i++) {
        const a = Math.random() * Math.PI * 2, d = 250 + Math.random() * 500
        ox[i] = Math.cos(a) * d; oy[i] = Math.sin(a) * d; vx[i] = vy[i] = 0
      }
    }

    const impulse = (x: number, y: number, radius: number, strength: number) => {
      const reach = radius + 80
      const c0 = Math.max(0, ((x - reach) / cw) | 0), c1 = Math.min(cols - 1, ((x + reach) / cw) | 0)
      const r0 = Math.max(0, ((y - reach) / ch) | 0), r1 = Math.min(rows - 1, ((y + reach) / ch) | 0)
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c
          const dx = c * cw + cw / 2 + ox[i] - x, dy = r * ch + ch / 2 + oy[i] - y
          const d = Math.hypot(dx, dy)
          if (d > radius || d < 0.001) continue
          const f = (1 - d / radius) ** 2 * strength
          vx[i] += (dx / d) * f; vy[i] += (dy / d) * f
        }
      }
    }

    const renderDonut = () => {
      lum.fill(-1); zbuf.fill(0)
      const a = A + tiltY, b = B + tiltX
      const sA = Math.sin(a), cA = Math.cos(a), sB = Math.sin(b), cB = Math.cos(b)
      const { cx, cy, size } = place
      const K1 = (size * K2 * 3) / (8 * (R1 + R2))
      const nT = sinT.length, nP = sinP.length
      for (let t = 0; t < nT; t++) {
        const ct = cosT[t], st = sinT[t]
        const circX = R2 + R1 * ct, circY = R1 * st
        for (let p = 0; p < nP; p++) {
          const cp = cosP[p], sp = sinP[p]
          const x = circX * (cB * cp + sA * sB * sp) - circY * cA * sB
          const y = circX * (sB * cp - sA * cB * sp) + circY * cA * cB
          const z = K2 + cA * circX * sp + circY * sA
          const ooz = 1 / z
          const col = ((cx + K1 * ooz * x) / cw) | 0
          const row = ((cy - K1 * ooz * y) / ch) | 0
          if (col < 0 || col >= cols || row < 0 || row >= rows) continue
          const i = row * cols + col
          if (ooz <= zbuf[i]) continue
          zbuf[i] = ooz
          const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp)
          lum[i] = Math.max(0, Math.min(RAMP.length - 1, (L * 8) | 0))
        }
      }
    }

    const frame = () => {
      raf = 0
      if (!visible) return
      if (!assembled && startRef.current) { if (!reduced) scatter(); assembled = true }

      // Pointer: tilt toward it, and flick the spin when it moves fast.
      tiltX += (pointer.tx * 0.5 - tiltX) * 0.06
      tiltY += (pointer.ty * 0.4 - tiltY) * 0.06
      spin *= 0.94
      if (!reduced) { A += 0.004 + spin * 0.5; B += 0.002 + spin * 0.25 }
      renderDonut()

      if (pointer.inside) {
        const speed = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY)
        if (speed > 0.5) impulse(pointer.x, pointer.y, PUSH_RADIUS, Math.min(PUSH * (0.4 + speed / 12), PUSH * 3))
        pointer.lastX = pointer.x; pointer.lastY = pointer.y
      }

      ctx.clearRect(0, 0, w, h)
      // Step the springs and sort visible characters into colour buckets, the
      // canvas only changes fill style a dozen or so times a frame.
      let moving = false
      counts.fill(0)
      for (let i = 0; i < lum.length; i++) {
        vx[i] = (vx[i] - ox[i] * SPRING) * DAMPING
        vy[i] = (vy[i] - oy[i] * SPRING) * DAMPING
        ox[i] += vx[i]; oy[i] += vy[i]
        const off = Math.abs(ox[i]) + Math.abs(oy[i])
        if (off > 0.3) moving = true
        if (lum[i] < 0) continue
        // Displaced characters glow in the accent colour; resting ones are
        // shaded by how much light hits that part of the surface.
        const k = off > 6 ? RAMP.length + Math.min(ACCENT_LEVELS - 1, (off / 20) | 0) : (invert ? RAMP.length - 1 - lum[i] : lum[i])
        buckets[k * cells + counts[k]++] = i
      }
      ctx.font = `${font}px ${mono}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let k = 0; k < counts.length; k++) {
        if (!counts[k]) continue
        if (k < RAMP.length) { ctx.fillStyle = text; ctx.globalAlpha = 0.3 + (k / (RAMP.length - 1)) * 0.7 }
        else { ctx.fillStyle = accent; ctx.globalAlpha = 0.55 + ((k - RAMP.length) / (ACCENT_LEVELS - 1)) * 0.45 }
        const base = k * cells
        for (let j = 0; j < counts[k]; j++) {
          const i = buckets[base + j]
          const c = i % cols, r = (i / cols) | 0
          ctx.fillText(RAMP[invert ? RAMP.length - 1 - lum[i] : lum[i]], c * cw + cw / 2 + ox[i], r * ch + ch / 2 + oy[i])
        }
      }
      ctx.globalAlpha = 1
      if (!reduced || moving || pointer.inside) raf = requestAnimationFrame(frame)
    }

    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame) }

    const local = (e: PointerEvent) => {
      const r = box.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = local(e)
      if (!pointer.inside) { pointer.lastX = x; pointer.lastY = y }
      const dx = x - pointer.x, dy = y - pointer.y
      pointer.x = x; pointer.y = y; pointer.inside = true
      pointer.tx = (x / w - 0.5) * 2; pointer.ty = (y / h - 0.5) * 2
      if (Number.isFinite(dx)) spin = Math.min(0.04, spin + Math.hypot(dx, dy) * 0.0002)
      kick()
    }
    const onLeave = () => { pointer.inside = false; pointer.x = pointer.y = -1e4; pointer.tx = pointer.ty = 0; kick() }
    const onDown = (e: PointerEvent) => {
      // Clicking a link or button in the hero shouldn't also blow up the donut.
      if (e.target instanceof Element && e.target.closest('a, button, input, kbd')) return
      const [x, y] = local(e)
      impulse(x, y, BURST_RADIUS, BURST)
      spin = 0.04
      setTouched(true)
      kick()
    }

    resize()
    void document.fonts?.ready.then(kick)
    const ro = new ResizeObserver(() => { resize(); kick() })
    ro.observe(box)
    const io = new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting; kick() }, { rootMargin: '100px' })
    io.observe(box)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('pointerdown', onDown)
    host.addEventListener('donut-start', kick)
    kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('donut-start', kick)
    }
  }, [reduced])

  // Run the fly-in once the loading screen has gone.
  useEffect(() => {
    if (start) wrap.current?.parentElement?.dispatchEvent(new Event('donut-start'))
  }, [start])

  return (
    <>
      <div ref={wrap} className="donut-stage" role="img" aria-label="A spinning ASCII-art donut that scatters away from the cursor">
        <canvas ref={canvas} className="donut-canvas" />
      </div>
      <div className={`donut-hint ${touched ? 'hide' : ''}`} aria-hidden="true">Move through the donut · click to scatter it</div>
    </>
  )
}

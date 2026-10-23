import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// The classic donut.c torus, drawn as text on a canvas. Every character cell
// is also a little spring: the cursor pushes nearby characters away, a click
// or tap blasts them outwards, and they all drift back into place. Moving
// the cursor also tilts the donut and flicks it faster for a moment.

const RAMP = '.,-~:;=!*#$@'
const R1 = 1 // tube radius
const R2 = 2 // distance from the centre of the hole to the centre of the tube
const K2 = 6 // distance from the viewer
const THETA_STEPS = 90
const PHI_STEPS = 300

const SPRING = 0.06
const DAMPING = 0.86
const PUSH_RADIUS = 80
const PUSH = 2.6
const BURST_RADIUS = 320
const BURST = 70

// Precomputed sines and cosines for the tube (theta) and the ring (phi).
const ring = (n) => {
  const s = new Float32Array(n), c = new Float32Array(n)
  for (let i = 0; i < n; i++) { s[i] = Math.sin((i / n) * Math.PI * 2); c[i] = Math.cos((i / n) * Math.PI * 2) }
  return [s, c]
}
const [sinT, cosT] = ring(THETA_STEPS)
const [sinP, cosP] = ring(PHI_STEPS)

export default function AsciiDonut({ start = true }) {
  const wrap = useRef()
  const canvas = useRef()
  const reduced = useReducedMotion()
  const [touched, setTouched] = useState(false)
  const startRef = useRef(start)
  startRef.current = start

  useEffect(() => {
    const el = canvas.current
    const box = wrap.current
    const ctx = el.getContext('2d')
    const css = getComputedStyle(document.documentElement)
    const text = css.getPropertyValue('--text').trim() || '#ededef'
    const accent = css.getPropertyValue('--accent').trim() || '#8ab4ff'
    const mono = css.getPropertyValue('--mono').trim() || 'monospace'

    let w = 0, h = 0, font = 12, cw = 7, ch = 13, cols = 0, rows = 0
    let lum, zbuf, ox, oy, vx, vy
    let A = 0.9, B = 0, spin = 0, tiltX = 0, tiltY = 0
    let raf = 0, visible = true, assembled = false
    const pointer = { x: -1e4, y: -1e4, inside: false, tx: 0, ty: 0, lastX: 0, lastY: 0 }

    const resize = () => {
      const r = box.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width; h = r.height
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      font = Math.max(9, Math.min(14, Math.round(w / 38)))
      cw = font * 0.62; ch = font * 1.15
      cols = Math.ceil(w / cw); rows = Math.ceil(h / ch)
      const n = cols * rows
      lum = new Int8Array(n); zbuf = new Float32Array(n)
      ox = new Float32Array(n); oy = new Float32Array(n); vx = new Float32Array(n); vy = new Float32Array(n)
    }

    // Scatter every cell far away so the donut flies together on first show.
    const scatter = () => {
      for (let i = 0; i < ox.length; i++) {
        const a = Math.random() * Math.PI * 2, d = 200 + Math.random() * 400
        ox[i] = Math.cos(a) * d; oy[i] = Math.sin(a) * d; vx[i] = vy[i] = 0
      }
    }

    const impulse = (x, y, radius, strength) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const px = c * cw + cw / 2 + ox[i], py = r * ch + ch / 2 + oy[i]
          const dx = px - x, dy = py - y
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
      const size = Math.min(w, h) * 0.85
      const K1 = (size * K2 * 3) / (8 * (R1 + R2))
      const cx = w / 2, cy = h / 2
      for (let t = 0; t < THETA_STEPS; t++) {
        const ct = cosT[t], st = sinT[t]
        const circX = R2 + R1 * ct, circY = R1 * st
        for (let p = 0; p < PHI_STEPS; p++) {
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
      if (!reduced) { A += 0.012 + spin * 0.6; B += 0.006 + spin * 0.3 }
      renderDonut()

      if (pointer.inside) {
        const speed = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY)
        if (speed > 0.5) impulse(pointer.x, pointer.y, PUSH_RADIUS, Math.min(PUSH * (0.4 + speed / 12), PUSH * 3))
        pointer.lastX = pointer.x; pointer.lastY = pointer.y
      }

      ctx.clearRect(0, 0, w, h)
      ctx.font = `${font}px ${mono}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      let moving = false
      for (let i = 0; i < lum.length; i++) {
        vx[i] = (vx[i] - ox[i] * SPRING) * DAMPING
        vy[i] = (vy[i] - oy[i] * SPRING) * DAMPING
        ox[i] += vx[i]; oy[i] += vy[i]
        const off = Math.abs(ox[i]) + Math.abs(oy[i])
        if (off > 0.3) moving = true
        const l = lum[i]
        if (l < 0) continue
        const c = i % cols, r = (i / cols) | 0
        // Displaced characters glow in the accent colour; resting ones are
        // shaded by how much light hits that part of the surface.
        if (off > 6) { ctx.fillStyle = accent; ctx.globalAlpha = Math.min(1, 0.5 + off / 60) }
        else { ctx.fillStyle = text; ctx.globalAlpha = 0.35 + (l / (RAMP.length - 1)) * 0.65 }
        ctx.fillText(RAMP[l], c * cw + cw / 2 + ox[i], r * ch + ch / 2 + oy[i])
      }
      ctx.globalAlpha = 1
      if (!reduced || moving || pointer.inside) raf = requestAnimationFrame(frame)
    }

    const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame) }

    const local = (e) => {
      const r = box.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const onMove = (e) => {
      const [x, y] = local(e)
      if (!pointer.inside) { pointer.lastX = x; pointer.lastY = y }
      const dx = x - pointer.x, dy = y - pointer.y
      pointer.x = x; pointer.y = y; pointer.inside = true
      pointer.tx = (x / w - 0.5) * 2; pointer.ty = (y / h - 0.5) * 2
      if (Number.isFinite(dx)) spin = Math.min(0.08, spin + Math.hypot(dx, dy) * 0.0004)
      kick()
    }
    const onLeave = () => { pointer.inside = false; pointer.x = pointer.y = -1e4; pointer.tx = pointer.ty = 0; kick() }
    const onDown = (e) => {
      const [x, y] = local(e)
      impulse(x, y, BURST_RADIUS, BURST)
      spin = 0.08
      setTouched(true)
      kick()
    }

    resize()
    const ro = new ResizeObserver(() => { resize(); kick() })
    ro.observe(box)
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick() }, { rootMargin: '100px' })
    io.observe(box)
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointerdown', onDown)
    kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect()
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointerdown', onDown)
    }
  }, [reduced])

  // Re-run the fly-in once the loading screen has gone.
  useEffect(() => {
    if (start) wrap.current?.dispatchEvent(new Event('pointerleave'))
  }, [start])

  return (
    <div ref={wrap} className="donut-stage" role="img" aria-label="A spinning ASCII-art donut that scatters away from the cursor">
      <canvas ref={canvas} className="donut-canvas" />
      <div className={`hero-stage-hint ${touched ? 'hide' : ''}`} aria-hidden="true">Move through it · click to scatter</div>
    </div>
  )
}

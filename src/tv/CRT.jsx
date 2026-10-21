import { useEffect, useRef, useState } from 'react'
import { useTV } from './TVContext'

// The picture tube: scanlines, an aperture grille, a rolling refresh bar,
// flicker, analogue noise, a curved-glass vignette and VHS tracking tears.
// Every layer is a fixed overlay with pointer-events off, so the page
// underneath works normally. Static bursts (channel changes, power on) use
// the same noise canvas at full strength.

const NW = 320
const NH = 240

export default function CRT() {
  const { settings, power, burst, vcr } = useTV()
  const on = settings.effects && power === 'on'
  const noise = useRef()
  const tear = useRef()
  const [bursting, setBursting] = useState(false)
  const state = useRef({})
  state.current = { on, noise: settings.noise, bursting, vcr }

  useEffect(() => {
    if (!burst) return undefined
    setBursting(true)
    const t = setTimeout(() => setBursting(false), burst.ms)
    return () => clearTimeout(t)
  }, [burst])

  // One loop draws the noise and eases the tracking tear.
  useEffect(() => {
    const cv = noise.current
    const g = cv.getContext('2d')
    const img = g.createImageData(NW, NH)
    let raf
    let lastDraw = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    let track = 0
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const s = state.current
      const dt = Math.max(1, now - lastT)
      const v = Math.abs(window.scrollY - lastY) / dt * 1000
      lastY = window.scrollY
      lastT = now
      let target = Math.min(1, Math.max(0, (v - 1400) / 2600))
      if (s.vcr === 'ff' || s.vcr === 'rew') target = 1
      if (s.vcr === 'pause') target = 0.55
      if (!s.on) target = 0
      track += (target - track) * (target > track ? 0.5 : 0.08)
      if (tear.current) {
        tear.current.style.opacity = track.toFixed(3)
        tear.current.style.setProperty('--shift', `${(Math.random() - 0.5) * 30 * track}px`)
      }
      const active = s.bursting || (s.on && s.noise) || track > 0.05
      if (!active || now - lastDraw < 55) return
      lastDraw = now
      const d = img.data
      const band = s.bursting ? Math.random() * NH : -99
      for (let y = 0; y < NH; y++) {
        const boost = Math.abs(y - band) < 12 ? 60 : 0
        for (let x = 0; x < NW; x++) {
          const i = (y * NW + x) * 4
          const n = Math.random() * 255
          d[i] = d[i + 1] = d[i + 2] = Math.min(255, n + boost)
          d[i + 3] = 255
        }
      }
      g.putImageData(img, 0, 0)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const s = settings
  const picture = s.brightness !== 5 || s.contrast !== 5 || s.color !== 5 || s.tint !== 0
  const filter = picture
    ? `brightness(${0.6 + s.brightness * 0.08}) contrast(${0.6 + s.contrast * 0.08}) saturate(${s.color / 5}) hue-rotate(${s.tint * 12}deg)`
    : undefined

  return (
    <div className="crt" aria-hidden="true">
      {filter && <div className="crt-picture" style={{ backdropFilter: filter, WebkitBackdropFilter: filter }} />}
      {on && s.scanlines && <div className="crt-scan" />}
      {on && s.scanlines && <div className="crt-mask" />}
      {on && s.flicker && <div className="crt-roll" />}
      {on && s.flicker && <div className="crt-flicker" />}
      <canvas
        ref={noise}
        width={NW}
        height={NH}
        className={`crt-noise ${bursting ? 'burst' : ''}`}
        style={{ opacity: bursting ? 0.92 : on && s.noise ? 0.035 : 0 }}
      />
      <div ref={tear} className="crt-tear" style={{ opacity: 0 }}>
        <span /><span /><span />
      </div>
      {on && vcr === 'pause' && <div className="crt-pause"><span /></div>}
      {on && s.curve && <div className="crt-vignette" />}
      {on && s.curve && <div className="crt-glass" />}
    </div>
  )
}

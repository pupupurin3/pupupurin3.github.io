import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ease } from '../../../lib/motion'
import { LAB_APPS, findApp } from './apps'
import { Window, type WinState } from './Window'

const COMPACT = 640

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <time className="task-clock" dateTime={now.toISOString()}>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
}

/**
 * The Lab as a small desktop: icons open apps in windows that drag, resize,
 * stack, minimise to the taskbar and maximise. On phones every window opens
 * full size instead.
 */
export function Desktop() {
  const area = useRef<HTMLDivElement>(null)
  const icons = useRef<HTMLUListElement>(null)
  // Windows open to the right of the icon columns.
  const iconCol = () => (icons.current?.offsetWidth ?? 100) + 8
  const [bounds, setBounds] = useState({ w: 0, h: 0 })
  const [wins, setWins] = useState<WinState[]>([])
  const z = useRef(10)
  const compact = bounds.w > 0 && bounds.w < COMPACT

  useEffect(() => {
    const el = area.current!
    const ro = new ResizeObserver(([e]) => e && setBounds({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const open = useCallback((id: string, at?: { x: number; y: number }) => {
    setWins((ws) => {
      const top = ++z.current
      const existing = ws.find((w) => w.id === id)
      if (existing) return ws.map((w) => (w.id === id ? { ...w, min: false, z: top } : w))
      const app = findApp(id)!
      const el = area.current!
      const bw = el.clientWidth, bh = el.clientHeight
      const w = Math.min(app.w, bw - iconCol() - 16), h = Math.min(app.h, bh - 16)
      const n = ws.length
      const x = at?.x ?? Math.min(iconCol() + 24 + n * 28, Math.max(iconCol(), bw - w - 12))
      const y = at?.y ?? Math.min(16 + n * 26, Math.max(0, bh - h - 8))
      return [...ws, { id, x, y, w, h, z: top, min: false, max: false }]
    })
  }, [])

  // Start with the README and the Fourier toy open.
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || bounds.w === 0) return
    seeded.current = true
    if (bounds.w < COMPACT) return
    const fw = Math.min(640, bounds.w - iconCol() - 40)
    open('fourier', { x: Math.max(iconCol() + 24, bounds.w - fw - 24), y: 22 })
    open('readme', { x: iconCol() + 20, y: Math.max(16, bounds.h - 380 - 20) })
  }, [bounds, open])

  const focus = useCallback((id: string) => {
    setWins((ws) => {
      const w = ws.find((v) => v.id === id)
      if (!w || w.z === z.current) return ws
      const top = ++z.current
      return ws.map((v) => (v.id === id ? { ...v, z: top } : v))
    })
  }, [])
  const change = useCallback((id: string, patch: Partial<WinState>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))), [])
  const close = useCallback((id: string) => setWins((ws) => ws.filter((w) => w.id !== id)), [])

  const topId = wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0]?.id

  return (
    <div className="desktop">
      <div className="desk-area" ref={area}>
        <ul className="desk-icons" ref={icons} aria-label="Lab apps">
          {LAB_APPS.map((a, i) => (
            <motion.li key={a.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4, ease }}>
              <button className="desk-icon" onClick={() => open(a.id)}>
                <span className="desk-icon-tile" aria-hidden="true">{a.glyph}</span>
                <span className="desk-icon-name">{a.file}</span>
              </button>
            </motion.li>
          ))}
        </ul>
        {compact && wins.length === 0 && <p className="desk-tip">Tap an app to open it</p>}
        {bounds.w > 0 && (
          <AnimatePresence>
            {wins.map((w) => (
              <Window key={w.id} app={findApp(w.id)!} win={w} focused={w.id === topId} compact={compact} bounds={bounds} onFocus={focus} onChange={change} onClose={close} />
            ))}
          </AnimatePresence>
        )}
      </div>
      <div className="taskbar">
        <span className="task-start">Lab</span>
        <div className="task-list">
          {wins.map((w) => (
            <button
              key={w.id}
              className={`task-chip ${w.id === topId ? 'on' : ''} ${w.min ? 'min' : ''}`}
              onClick={() => (w.id === topId ? change(w.id, { min: true }) : open(w.id))}
            >
              {findApp(w.id)!.file}
            </button>
          ))}
        </div>
        <Clock />
      </div>
    </div>
  )
}

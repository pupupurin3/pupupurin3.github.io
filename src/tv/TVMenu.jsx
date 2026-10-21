import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTV } from './TVContext'

// The classic blue on-screen setup menu. Arrow keys move and adjust, Enter
// toggles, Esc or M closes; every row also works with the mouse or touch.
const ROWS = [
  { group: 'PICTURE' },
  { key: 'brightness', label: 'BRIGHTNESS', min: 0, max: 10 },
  { key: 'contrast', label: 'CONTRAST', min: 0, max: 10 },
  { key: 'color', label: 'COLOR', min: 0, max: 10 },
  { key: 'tint', label: 'TINT', min: -5, max: 5 },
  { group: 'SCREEN' },
  { key: 'effects', label: 'CRT EFFECTS', toggle: true },
  { key: 'scanlines', label: 'SCANLINES', toggle: true },
  { key: 'noise', label: 'NOISE', toggle: true },
  { key: 'flicker', label: 'FLICKER', toggle: true },
  { key: 'rgb', label: 'RGB SPLIT', toggle: true },
  { key: 'curve', label: 'CURVED GLASS', toggle: true },
  { group: 'SOUND' },
  { key: 'sound', label: 'SOUND', toggle: true },
  { key: 'volume', label: 'VOLUME', min: 0, max: 10 },
  { group: 'SYSTEM' },
  { action: 'reset', label: 'RESET PICTURE' },
  { action: 'close', label: 'EXIT' },
]
const ITEMS = ROWS.map((r, i) => (r.group ? null : i)).filter((i) => i !== null)

function Bar({ value, min, max }) {
  const n = max - min
  return <span className="tvm-bar">{Array.from({ length: n }, (_, i) => <i key={i} className={i < value - min ? 'on' : ''} />)}</span>
}

export default function TVMenu() {
  const tv = useTV()
  const [sel, setSel] = useState(ITEMS[0])
  const { settings, setSetting } = tv
  const close = () => tv.setMenuOpen(false)

  const adjust = (row, d) => {
    if (row.toggle) setSetting(row.key, !settings[row.key])
    else if (row.key) setSetting(row.key, Math.max(row.min, Math.min(row.max, settings[row.key] + d)))
    tv.play('beep')
  }
  const activate = (row) => {
    if (row.action === 'reset') { tv.resetSettings(); tv.flash('PICTURE RESET') }
    else if (row.action === 'close') close()
    else if (row.toggle) adjust(row, 0)
  }

  useEffect(() => {
    if (!tv.menuOpen) return undefined
    const onKey = (e) => {
      const row = ROWS[sel]
      const at = ITEMS.indexOf(sel)
      if (e.key === 'ArrowDown') setSel(ITEMS[(at + 1) % ITEMS.length])
      else if (e.key === 'ArrowUp') setSel(ITEMS[(at - 1 + ITEMS.length) % ITEMS.length])
      else if (e.key === 'ArrowRight') adjust(row, 1)
      else if (e.key === 'ArrowLeft') adjust(row, -1)
      else if (e.key === 'Enter') activate(row)
      else if (e.key === 'Escape') close()
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  return (
    <AnimatePresence>
      {tv.menuOpen && (
        <motion.div
          className="tvm-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="tvm"
            role="dialog"
            aria-modal="true"
            aria-label="TV menu"
            onClick={(e) => e.stopPropagation()}
            initial={{ scaleY: 0.02, scaleX: 0.6 }}
            animate={{ scaleY: 1, scaleX: 1 }}
            exit={{ scaleY: 0.02, scaleX: 0.6 }}
            transition={{ duration: 0.22 }}
          >
            <p className="tvm-title">MENU <span>▸ SETUP</span></p>
            <ul>
              {ROWS.map((row, i) => row.group ? (
                <li key={row.group} className="tvm-group">{row.group}</li>
              ) : (
                <li key={row.label}>
                  <button className={`tvm-row ${sel === i ? 'sel' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => { setSel(i); activate(row) }}>
                    <span className="tvm-cursor">{sel === i ? '▶' : ''}</span>
                    <span className="tvm-label">{row.label}</span>
                    {row.toggle && <span className="tvm-val">{settings[row.key] ? 'ON' : 'OFF'}</span>}
                    {row.min !== undefined && (
                      <span className="tvm-val">
                        <span className="tvm-step" role="button" aria-label={`Decrease ${row.label}`} onClick={(e) => { e.stopPropagation(); adjust(row, -1) }}>◀</span>
                        <Bar value={settings[row.key]} min={row.min} max={row.max} />
                        <span className="tvm-step" role="button" aria-label={`Increase ${row.label}`} onClick={(e) => { e.stopPropagation(); adjust(row, 1) }}>▶</span>
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <p className="tvm-foot">▲▼ SELECT  ◀▶ ADJUST  ENTER OK  M EXIT</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

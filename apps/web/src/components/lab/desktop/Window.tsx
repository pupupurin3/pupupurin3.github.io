import { memo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ease } from '../../../lib/motion'
import type { LabApp } from './apps'

export interface WinState {
  id: string
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  max: boolean
}

interface WindowProps {
  app: LabApp
  win: WinState
  focused: boolean
  /** Phones: every window fills the desktop and can't be dragged. */
  compact: boolean
  bounds: { w: number; h: number }
  onFocus: (id: string) => void
  onChange: (id: string, patch: Partial<WinState>) => void
  onClose: (id: string) => void
}

const MIN_W = 280
const MIN_H = 200

// The app itself never re-renders when its window moves.
const Body = memo(function Body({ app }: { app: LabApp }) {
  return <app.Component />
})

export function Window({ app, win, focused, compact, bounds, onFocus, onChange, onClose }: WindowProps) {
  const [maths, setMaths] = useState(false)
  const drag = useRef<{ mode: 'move' | 'resize'; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null)
  const max = compact || win.max

  const begin = (mode: 'move' | 'resize') => (e: RPointerEvent) => {
    if (max || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button') && mode === 'move') return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { mode, sx: e.clientX, sy: e.clientY, ox: win.x, oy: win.y, ow: win.w, oh: win.h }
  }
  const move = (e: RPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (d.mode === 'move') {
      // Keep at least the title bar reachable.
      onChange(win.id, {
        x: Math.min(Math.max(d.ox + dx, 80 - win.w), bounds.w - 80),
        y: Math.min(Math.max(d.oy + dy, 0), bounds.h - 40),
      })
    } else {
      onChange(win.id, { w: Math.max(MIN_W, Math.min(d.ow + dx, bounds.w - win.x)), h: Math.max(MIN_H, Math.min(d.oh + dy, bounds.h - win.y)) })
    }
  }
  const end = () => (drag.current = null)

  const box = max ? { left: 0, top: 0, width: bounds.w, height: bounds.h } : { left: win.x, top: win.y, width: win.w, height: win.h }

  return (
    <motion.section
      className={`win ${focused ? 'focused' : ''} ${max ? 'max' : ''}`}
      style={{ ...box, zIndex: win.z, display: win.min ? 'none' : undefined }}
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease }}
      onPointerDownCapture={() => onFocus(win.id)}
      role="dialog"
      aria-label={app.file}
    >
      <header className="win-bar" onPointerDown={begin('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onDoubleClick={() => !compact && onChange(win.id, { max: !win.max })}>
        <span className="win-glyph" aria-hidden="true">{app.glyph}</span>
        <span className="win-title">{app.file}</span>
        {app.math && (
          <button className={`win-maths ${maths ? 'on' : ''}`} onClick={() => setMaths((v) => !v)} aria-pressed={maths}>
            Σ Maths
          </button>
        )}
        <span className="win-buttons">
          <button onClick={() => onChange(win.id, { min: true })} aria-label={`Minimise ${app.file}`}>–</button>
          {!compact && <button onClick={() => onChange(win.id, { max: !win.max })} aria-label={win.max ? 'Restore' : 'Maximise'}>{win.max ? '❐' : '□'}</button>}
          <button onClick={() => onClose(win.id)} aria-label={`Close ${app.file}`}>×</button>
        </span>
      </header>
      <div className="win-content">
        <div className="win-app"><Body app={app} /></div>
        <AnimatePresence initial={false}>
          {maths && app.math && (
            <motion.aside
              className="win-math"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'min(300px, 55%)', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <div className="win-math-inner">{app.math}</div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {!max && <span className="win-resize" onPointerDown={begin('resize')} onPointerMove={move} onPointerUp={end} onPointerCancel={end} aria-hidden="true" />}
    </motion.section>
  )
}

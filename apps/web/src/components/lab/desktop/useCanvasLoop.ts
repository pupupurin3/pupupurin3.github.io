import { useEffect, useRef } from 'react'

export interface Frame {
  ctx: CanvasRenderingContext2D
  /** Size in CSS pixels. */
  w: number
  h: number
  /** Seconds since the last frame, capped so a background tab can't explode a simulation. */
  dt: number
}

/**
 * Sizes a canvas to its box at the device pixel ratio and calls `frame`
 * every animation frame while the canvas is on screen (a minimised window or
 * a scrolled-away Lab costs nothing). `frame` is read through a ref, so it
 * can close over fresh state without restarting the loop.
 */
export function useCanvasLoop(frame: (f: Frame) => void, { pixelRatio }: { pixelRatio?: number } = {}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const fn = useRef(frame)
  fn.current = frame

  useEffect(() => {
    const el = canvas.current!
    const ctx = el.getContext('2d')!
    let w = 0, h = 0, raf = 0, last = 0, visible = false
    const resize = () => {
      const r = el.getBoundingClientRect()
      const dpr = pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      el.width = Math.max(1, Math.round(w * dpr))
      el.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const tick = (t: number) => {
      raf = 0
      if (!visible) return
      const dt = last ? Math.min((t - last) / 1000, 1 / 20) : 1 / 60
      last = t
      if (w > 0 && h > 0) fn.current({ ctx, w, h, dt })
      raf = requestAnimationFrame(tick)
    }
    const start = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(tick) } }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; start() })
    io.observe(el)
    resize()
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf) }
  }, [pixelRatio])

  return canvas
}

/** Pointer position relative to an element, in CSS pixels. */
export const localPoint = (e: { clientX: number; clientY: number }, el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

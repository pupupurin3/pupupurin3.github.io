import { useEffect, useRef, type RefObject } from 'react'

/**
 * Mouse drag-to-scroll with a little momentum, on top of native scrolling
 * (touch and trackpads scroll natively). Returns a function that tells
 * whether the last pointer press was a drag, so the click that ends a drag
 * doesn't also open the card under the cursor.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  const moved = useRef(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let down = false
    let startX = 0
    let startLeft = 0
    let lastX = 0
    let lastT = 0
    let v = 0
    let raf = 0
    const glide = () => {
      v *= 0.94
      el.scrollLeft -= v
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide)
      else el.classList.remove('dragging')
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      cancelAnimationFrame(raf)
      down = true
      moved.current = 0
      startX = lastX = e.clientX
      startLeft = el.scrollLeft
      lastT = performance.now()
      v = 0
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4 && !el.classList.contains('dragging')) el.classList.add('dragging')
      moved.current = Math.max(moved.current, Math.abs(dx))
      el.scrollLeft = startLeft - dx
      const now = performance.now()
      v = ((e.clientX - lastX) / Math.max(now - lastT, 1)) * 16
      lastX = e.clientX
      lastT = now
    }
    const onUp = () => {
      if (!down) return
      down = false
      if (Math.abs(v) > 1) raf = requestAnimationFrame(glide)
      else el.classList.remove('dragging')
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [ref])
  return () => moved.current > 6
}

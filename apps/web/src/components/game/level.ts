import { GAME_STARS } from '@portfolio/shared'
import type { Platform } from './physics'

// Elements whose top edge is a platform. Headings use their text lines so
// Purin stands on the words, not on the full-width block.
const SOLID = [
  '.btn', '.card', '.segmented', '.lab-tabs', '.cv-item',
  '.reorder-item', '.throw-area', '.shelf-plank', '.gallery', '.scroll-demo', '.about-person',
  '.tags span', '.section-index',
].join(',')
const TEXT = 'h1, h2, h3, .contact-title'

// Where the stars float: [selector, horizontal position 0..1 across it].
export const STARS: [string, number][] = [
  ['#home h1', 0.15],
  ['.hero-cta', 0.7],
  ['#work .section-header h2', 0.9],
  ['#work .card', 0.5],
  ['.lab-tabs', 0.85],
  ['.about-person', 0.3],
  ['.about-cv .cv-item:last-child', 0.8],
  ['.contact-title', 0.6],
]
// The API only accepts runs that collect every star.
if (STARS.length !== GAME_STARS) throw new Error(`The level has ${STARS.length} stars but the API expects ${GAME_STARS}`)

function visible(el: Element) {
  const s = getComputedStyle(el)
  return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.2
}

/** Collects every platform on the page, in document coordinates. */
export function scanPlatforms(): Platform[] {
  const sy = window.scrollY
  const out: Platform[] = []
  const push = (r: { left: number; right: number; width: number; top: number; height: number }, el: Element, key: string) => {
    if (r.width < 18 || r.height < 4) return
    out.push({ x1: r.left, x2: r.right, y: r.top + sy, el, key })
  }
  document.querySelectorAll(SOLID).forEach((el, i) => {
    if (el.closest('.scroll-demo') && !el.classList.contains('scroll-demo')) return
    if (el.closest('[aria-modal="true"]') || !visible(el)) return
    push(el.getBoundingClientRect(), el, `s${i}`)
  })
  const range = document.createRange()
  document.querySelectorAll(TEXT).forEach((el, i) => {
    if (el.closest('[aria-modal="true"], .card, .scroll-demo') || !visible(el)) return
    range.selectNodeContents(el)
    // Merge the per-word rects of each line into one platform.
    const lines: { top: number; left: number; right: number; height: number }[] = []
    for (const r of range.getClientRects()) {
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.5)
      if (line) {
        line.left = Math.min(line.left, r.left)
        line.right = Math.max(line.right, r.right)
      } else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height })
    }
    // Text rects include the line's leading, so stand a little lower.
    lines.forEach((l, j) =>
      push({ left: l.left, right: l.right, width: l.right - l.left, top: l.top + l.height * 0.18, height: l.height }, el, `t${i}-${j}`),
    )
  })
  return out
}

/** Star positions in document coordinates (null where the anchor is missing). */
export function scanStars(): ({ x: number; y: number } | null)[] {
  const sy = window.scrollY
  return STARS.map(([sel, fx]) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * fx, y: r.top + sy - 46 }
  })
}

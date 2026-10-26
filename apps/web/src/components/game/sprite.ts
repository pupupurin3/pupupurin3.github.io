// Pixel-art Purin: c caramel, C dark caramel, y custard, Y custard shade,
// k eyes, p blush, w plate.
const SPRITE = [
  '...cccccc...',
  '..cCccccCc..',
  '..yyyyyyyy..',
  '.yyyyyyyyyy.',
  '.yykyyyykyy.',
  '.ypyyyyyypy.',
  'yyyyykkyyyyy',
  'yyyyyyyyyyyY',
  'YyyyyyyyyyYY',
  '.YYYYYYYYYY.',
  'wwwwwwwwwwww',
]
const COLORS: Record<string, string> = { c: '#8a4b1f', C: '#5e3112', y: '#ffd76a', Y: '#e8b54a', k: '#2a1a12', p: '#ff9aa8', w: '#e9ecf2' }
const PX = 3

export const SPRITE_W = SPRITE[0]!.length * PX
export const SPRITE_H = SPRITE.length * PX

let cached: HTMLCanvasElement | undefined

/** The sprite drawn once to an offscreen canvas. */
export function purinSprite(): HTMLCanvasElement {
  if (cached) return cached
  cached = document.createElement('canvas')
  cached.width = SPRITE_W
  cached.height = SPRITE_H
  const g = cached.getContext('2d')!
  SPRITE.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = COLORS[ch]
      if (color) {
        g.fillStyle = color
        g.fillRect(x * PX, y * PX, PX, PX)
      }
    }),
  )
  return cached
}

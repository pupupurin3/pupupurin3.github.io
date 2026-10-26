import { GRAVITY } from './physics'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  c: string
}

export function burst(list: Particle[], x: number, y: number, n: number, colors: string[]) {
  for (let i = 0; i < n; i++) {
    list.push({ x, y, vx: (Math.random() - 0.5) * 420, vy: -Math.random() * 520, life: 0.6 + Math.random() * 0.8, c: colors[i % colors.length]! })
  }
}

/** Moves, fades and draws particles; dead ones are removed. */
export function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[], dt: number, scrollY: number, size: [number, number]) {
  for (let k = list.length - 1; k >= 0; k--) {
    const d = list[k]!
    d.life -= dt
    if (d.life <= 0) {
      list.splice(k, 1)
      continue
    }
    d.vy += GRAVITY * 0.5 * dt
    d.x += d.vx * dt
    d.y += d.vy * dt
    ctx.globalAlpha = Math.min(1, d.life * 2)
    ctx.fillStyle = d.c
    ctx.fillRect(d.x - 2, d.y - scrollY - 2, size[0], size[1])
  }
  ctx.globalAlpha = 1
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.sin(t * 2) * 0.2)
  ctx.shadowColor = 'rgba(255, 215, 106, 0.8)'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ffd76a'
  ctx.beginPath()
  for (let k = 0; k < 10; k++) {
    const a = (k * Math.PI) / 5 - Math.PI / 2
    const rr = k % 2 ? r * 0.45 : r
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** A speech-bubble hint above Purin. */
export function drawPrompt(ctx: CanvasRenderingContext2D, label: string, cx: number, top: number, viewWidth: number) {
  ctx.font = '600 12px Inter, system-ui, sans-serif'
  const tw = ctx.measureText(label).width + 16
  const px = Math.max(4, Math.min(viewWidth - tw - 4, cx - tw / 2))
  const py = top - 30
  ctx.fillStyle = '#e9ecf2'
  ctx.beginPath()
  ctx.roundRect(px, py, tw, 22, 11)
  ctx.fill()
  ctx.fillStyle = '#0a0a0b'
  ctx.fillText(label, px + 8, py + 15)
}

export const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, '0')}`

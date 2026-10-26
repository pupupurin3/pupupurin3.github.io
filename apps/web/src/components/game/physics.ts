import { SPRITE_H as H, SPRITE_W as W } from './sprite'

// Movement tuned for a floaty-but-snappy platformer, in px and seconds.
export const GRAVITY = 2300
export const RUN = 330
export const JUMP = 830
/** Grace period to still jump after running off an edge. */
export const COYOTE = 0.1
/** A jump pressed this long before landing still happens on landing. */
export const BUFFER = 0.12
const MAX_FALL = 1400

/** A one-way platform: the top edge of an element, in document coordinates. */
export interface Platform {
  x1: number
  x2: number
  y: number
  el: Element
  key: string
}

export interface Input {
  left: boolean
  right: boolean
  jump: boolean
  down: boolean
}

export interface Player {
  x: number
  y: number
  vx: number
  vy: number
  face: 1 | -1
  on: Platform | null
  /** Seconds since last standing on something. */
  air: number
  /** Seconds left on a buffered jump press. */
  buffer: number
  /** Seconds left of dropping through platforms. */
  drop: number
  /** Squash (+) and stretch (-) amount for drawing. */
  squash: number
}

export interface World {
  platforms: Platform[]
  /** Page width: Purin can't leave it sideways. */
  width: number
  /** The bottom of the page (spanning its width), which always catches Purin. */
  floor: Platform
}

export const newPlayer = (x: number, y: number): Player => ({ x, y, vx: 0, vy: 0, face: 1, on: null, air: 0, buffer: 0, drop: 0, squash: 0 })

/** Does Purin's body overlap the platform horizontally? Feet are a bit narrower than the sprite. */
const overlaps = (p: Player, q: Platform) => p.x + W * 0.8 > q.x1 && p.x + W * 0.2 < q.x2

/**
 * Advances the player by `dt` seconds. Mutates `p` and returns the landing
 * (where, and how hard) if Purin touched down this step.
 */
export function stepPlayer(p: Player, input: Input, world: World, dt: number): { x: number; y: number; hard: boolean } | null {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  p.vx += (dir * RUN - p.vx) * Math.min(1, dt * (p.on ? 14 : 6))
  if (dir) p.face = dir as 1 | -1

  // Stay attached to a platform that moved (reveal animations, reflow).
  if (p.on) {
    const same = p.on === world.floor ? world.floor : world.platforms.find((q) => q.key === p.on!.key && q.el === p.on!.el)
    if (same && overlaps(p, same)) {
      p.on = same
      p.y = same.y - H
    } else p.on = null
  }

  p.air = p.on ? 0 : p.air + dt
  p.buffer -= dt
  p.drop -= dt
  if (p.buffer > 0 && p.air < COYOTE) {
    p.vy = -JUMP
    p.on = null
    p.air = COYOTE
    p.buffer = 0
    p.squash = -0.25
  }
  if (!p.on) {
    // Letting go of jump early cuts the jump short.
    p.vy += GRAVITY * dt * (p.vy < 0 && !input.jump ? 2.2 : 1)
    p.vy = Math.min(p.vy, MAX_FALL)
  }
  if (p.on && p.drop > 0 && p.on !== world.floor) {
    p.on = null
    p.y += 2
  }

  const prevBottom = p.y + H
  p.x = Math.max(0, Math.min(world.width - W, p.x + p.vx * dt))
  if (!p.on) p.y += p.vy * dt
  const bottom = p.y + H

  let landing: { x: number; y: number; hard: boolean } | null = null
  if (!p.on && p.vy >= 0) {
    // Land on the highest platform crossed this step (one-way: only from above).
    let land: Platform | null = null
    for (const q of world.platforms) {
      if (p.drop > 0 && q.y <= prevBottom + 4) continue
      if (prevBottom <= q.y + 1 && bottom >= q.y && overlaps(p, q) && (!land || q.y < land.y)) land = q
    }
    if (!land && bottom >= world.floor.y) land = world.floor
    if (land) {
      const hard = p.vy > 500
      if (hard) p.squash = 0.3
      landing = { x: p.x + W / 2, y: land.y, hard }
      p.on = land
      p.y = land.y - H
      p.vy = 0
    }
  }
  p.squash *= Math.pow(0.0001, dt)
  return landing
}

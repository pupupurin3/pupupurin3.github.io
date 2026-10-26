import { describe, expect, it } from 'vitest'
import { BUFFER, JUMP, newPlayer, stepPlayer, type Input, type Platform } from '../src/components/game/physics'
import { SPRITE_H } from '../src/components/game/sprite'

const el = {} as Element
const plat = (x1: number, x2: number, y: number, key = 'p'): Platform => ({ x1, x2, y, el, key })
const idle: Input = { left: false, right: false, jump: false, down: false }
const world = (platforms: Platform[]) => ({ platforms, width: 1000, floor: plat(0, 1000, 2000, 'floor') })

/** Runs the simulation for `seconds` at 60 fps. */
function run(p: ReturnType<typeof newPlayer>, input: Input, w: ReturnType<typeof world>, seconds: number) {
  for (let t = 0; t < seconds; t += 1 / 60) stepPlayer(p, input, w, 1 / 60)
}

describe('platformer physics', () => {
  it('falls onto a platform and stands on it', () => {
    const p = newPlayer(100, 0)
    const w = world([plat(50, 300, 400)])
    run(p, idle, w, 2)
    expect(p.on?.y).toBe(400)
    expect(p.y).toBe(400 - SPRITE_H)
  })

  it('passes up through platforms (they are one-way)', () => {
    const p = newPlayer(100, 500 - SPRITE_H)
    const w = world([plat(50, 300, 500, 'ground'), plat(50, 300, 420, 'ledge')])
    run(p, idle, w, 0.2)
    expect(p.on?.key).toBe('ground')
    p.buffer = BUFFER
    stepPlayer(p, { ...idle, jump: true }, w, 1 / 60)
    expect(p.vy).toBeLessThan(0)
    // Rising through the ledge doesn't stop the jump; coming down lands on it.
    run(p, { ...idle, jump: true }, w, 1.5)
    expect(p.on?.key).toBe('ledge')
  })

  it('still jumps just after running off an edge (coyote time)', () => {
    const p = newPlayer(100, 400 - SPRITE_H)
    const w = world([plat(50, 130, 400)])
    run(p, idle, w, 0.1)
    run(p, { ...idle, right: true }, w, 0.2)
    expect(p.on).toBeNull()
    p.air = 0.05
    p.buffer = BUFFER
    stepPlayer(p, idle, w, 1 / 60)
    expect(p.vy).toBe(-JUMP + 2300 * (1 / 60) * 2.2)
  })

  it('reports hard landings for the dust effect', () => {
    const p = newPlayer(100, -400)
    const w = world([plat(50, 300, 400)])
    let hard = false
    for (let i = 0; i < 120 && !p.on; i++) hard = stepPlayer(p, idle, w, 1 / 60)?.hard ?? hard
    expect(hard).toBe(true)
    expect(p.squash).toBeGreaterThan(0)
  })

  it('stays inside the page sideways and lands on the floor', () => {
    const p = newPlayer(990, 1900)
    run(p, { ...idle, right: true }, world([]), 1)
    expect(p.x).toBeLessThanOrEqual(1000)
    expect(p.on?.key).toBe('floor')
  })
})

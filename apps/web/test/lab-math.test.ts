import { describe, expect, it } from 'vitest'
import { dft, resample } from '../src/components/lab/apps/Fourier'
import { hohmannPhase } from '../src/components/lab/apps/Orbits'

describe('Fourier toy', () => {
  it('resamples a closed path to evenly spaced points', () => {
    const square = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]
    const pts = resample(square, 8)
    expect(pts).toHaveLength(8)
    expect(pts[2]).toEqual({ x: 1, y: 0 })
  })

  it('rebuilds the path from all of its terms', () => {
    const pts = resample([{ x: -1, y: 0 }, { x: 1, y: -0.5 }, { x: 0.4, y: 1 }], 32)
    const terms = dft(pts)
    const at = (n: number) => terms.reduce((acc, { k, amp, phase }) => {
      const a = (2 * Math.PI * k * n) / pts.length + phase
      return { x: acc.x + amp * Math.cos(a), y: acc.y + amp * Math.sin(a) }
    }, { x: 0, y: 0 })
    for (const n of [0, 7, 19]) {
      expect(at(n).x).toBeCloseTo(pts[n]!.x, 6)
      expect(at(n).y).toBeCloseTo(pts[n]!.y, 6)
    }
  })
})

describe('Orbit sim', () => {
  it('needs Mars about 44° ahead of Earth for a Hohmann transfer', () => {
    expect(hohmannPhase(1, 1.524)).toBeCloseTo(44.3, 0)
  })
})

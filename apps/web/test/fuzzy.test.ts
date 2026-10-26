import { describe, expect, it } from 'vitest'
import { buildCommands, searchCommands } from '../src/components/palette/commands'
import { fuzzyScore } from '../src/lib/fuzzy'

describe('fuzzyScore', () => {
  it('needs every query character in order', () => {
    expect(fuzzyScore('Minesweeper', 'msw')).toBeGreaterThan(0)
    expect(fuzzyScore('Minesweeper', 'wsm')).toBe(0)
    expect(fuzzyScore('anything', '')).toBe(1)
  })

  it('prefers word starts and consecutive runs', () => {
    expect(fuzzyScore('Mars Simulation', 'mars')).toBeGreaterThan(fuzzyScore('Number Riddle', 'mrd'))
    expect(fuzzyScore('3D Maze Maker', 'mm')).toBeGreaterThan(fuzzyScore('Hanafuda', 'aa'))
  })
})

describe('command search', () => {
  const commands = buildCommands(() => {})

  it('keeps the original order without a query', () => {
    expect(searchCommands(commands, '')).toEqual(commands)
  })

  it('ranks the best match first', () => {
    expect(searchCommands(commands, 'hanaf')[0]?.label).toBe('Hanafuda')
    expect(searchCommands(commands, 'github')[0]?.label).toBe('Open GitHub')
  })

  it('matches hints too, e.g. a category', () => {
    expect(searchCommands(commands, 'simulations').map((c) => c.label)).toContain('Fluid Simulation')
  })
})

import { profile } from '../../content/profile'
import { projects } from '../../content/projects'
import { emit } from '../../lib/events'
import { fuzzyScore } from '../../lib/fuzzy'

export interface Command {
  group: string
  label: string
  hint?: string
  run: () => void
}

const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function buildCommands(copyEmail: () => void): Command[] {
  return [
    { group: 'Navigate', label: 'Home', run: go('home') },
    { group: 'Navigate', label: 'Work', run: go('work') },
    { group: 'Navigate', label: 'Lab', run: go('lab') },
    { group: 'Navigate', label: 'About', run: go('about') },
    { group: 'Navigate', label: 'Contact', run: go('contact') },
    { group: 'Play', label: 'Play the portfolio game', hint: 'P', run: () => emit('toggle-game') },
    ...projects.map((p) => ({
      group: 'Projects',
      label: p.title,
      hint: p.category,
      run: () => {
        go('work')()
        emit('open-project', p.slug)
      },
    })),
    { group: 'Links', label: 'Copy email address', hint: profile.email, run: copyEmail },
    { group: 'Links', label: 'Open GitHub', hint: 'github.com/pupupurin3', run: () => window.open(profile.github, '_blank', 'noopener') },
  ]
}

/**
 * Commands matching the query, best first. Labels count fully, hints a bit
 * less. With no query everything shows in its original order.
 */
export function searchCommands(commands: Command[], query: string): Command[] {
  return commands
    .map((c) => ({ c, s: Math.max(fuzzyScore(c.label, query), fuzzyScore(c.hint ?? '', query) * 0.6) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => (query ? b.s - a.s : 0))
    .map((r) => r.c)
}

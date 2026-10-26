import { describe, expect, it } from 'vitest'
import { ContactInput, GuestbookEntryInput, LIMITS, ProjectSchema, isProjectSlug, projectLinks, projects } from '../src'

describe('project catalogue', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = projects.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('recognises catalogue slugs only', () => {
    expect(isProjectSlug('hanafuda')).toBe(true)
    expect(isProjectSlug('not-a-project')).toBe(false)
  })

  it('adds the GitHub repo after a project’s own links', () => {
    const blackjack = projects.find((p) => p.slug === 'blackjack-simulator')!
    expect(projectLinks(blackjack).map((l) => l.label)).toEqual(['Play on Replit'])
    const hanafuda = projects.find((p) => p.slug === 'hanafuda')!
    expect(projectLinks(hanafuda)).toEqual([{ label: 'Source on GitHub', url: 'https://github.com/pupupurin3/Hanafuda' }])
  })
})

describe('form schemas', () => {
  it('trims input and enforces lengths', () => {
    expect(GuestbookEntryInput.parse({ name: '  Noah ', message: ' hi ' })).toEqual({ name: 'Noah', message: 'hi' })
    expect(GuestbookEntryInput.safeParse({ name: '   ', message: 'hi' }).success).toBe(false)
    expect(GuestbookEntryInput.safeParse({ name: 'a', message: 'x'.repeat(LIMITS.guestbookMessage + 1) }).success).toBe(false)
  })

  it('rejects control characters', () => {
    expect(GuestbookEntryInput.safeParse({ name: 'a\u0000b', message: 'hi' }).success).toBe(false)
    expect(GuestbookEntryInput.safeParse({ name: 'a', message: 'line one\nline two' }).success).toBe(true)
  })

  it('validates contact email and minimum message length', () => {
    const ok = { name: 'A', email: 'a@example.com', message: 'Hello there, nice site!' }
    expect(ContactInput.safeParse(ok).success).toBe(true)
    expect(ContactInput.safeParse({ ...ok, email: 'nope' }).success).toBe(false)
    expect(ContactInput.safeParse({ ...ok, message: 'short' }).success).toBe(false)
  })
})

describe('catalogue shape', () => {
  it('every project matches the schema the API documents', () => {
    for (const p of projects) expect(() => ProjectSchema.parse(p)).not.toThrow()
  })
})

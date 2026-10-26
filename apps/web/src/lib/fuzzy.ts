/**
 * Scores a fuzzy match: every query character must appear in order;
 * consecutive and word-start hits score higher. 0 means no match.
 */
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 1
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let ti = 0
  let s = 0
  let streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found === -1) return 0
    streak = found === ti ? streak + 1 : 0
    s += 1 + streak * 2 + (found === 0 || t[found - 1] === ' ' ? 3 : 0)
    ti = found + 1
  }
  return s
}

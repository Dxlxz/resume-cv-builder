/**
 * Pack skill items into comma-joined lines by character budget so each line
 * fills the content width instead of wrapping after a fixed item count.
 * Used by measure + PDF so both break at identical points.
 */
export function chunkSkillItems(items: string[], maxChars = 100): string[] {
  const filtered = items.filter(Boolean)
  if (filtered.length === 0) return []
  const lines: string[] = []
  let current = ''
  for (const item of filtered) {
    const candidate = current ? `${current}, ${item}` : item
    if (current && candidate.length > maxChars) {
      lines.push(current)
      current = item
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

import type { CatalogEntry, SearchOpts } from '@rb/catalog/types'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function entryMatchesQuery(entry: CatalogEntry, query: string): boolean {
  const q = normalize(query)
  if (!q) return true
  if (normalize(entry.label).includes(q)) return true
  return (entry.aliases ?? []).some((a) => normalize(a).includes(q))
}

export function filterEntries(
  entries: CatalogEntry[],
  query: string,
  opts: SearchOpts = {},
): CatalogEntry[] {
  const activeOnly = opts.activeOnly !== false
  let list = entries.filter((e) => (activeOnly ? e.active : true))

  if (opts.categoryId) {
    list = list.filter((e) => e.categoryId === opts.categoryId)
  }
  if (opts.industryId) {
    list = list.filter((e) => e.industryId === opts.industryId)
  }
  if (opts.locale) {
    list = list.sort((a, b) => {
      const aMatch = a.locale === opts.locale ? 0 : 1
      const bMatch = b.locale === opts.locale ? 0 : 1
      return aMatch - bMatch
    })
  }

  if (query.trim()) {
    list = list.filter((e) => entryMatchesQuery(e, query))
  }

  list = [...list].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.label.localeCompare(b.label))

  if (opts.limit) {
    list = list.slice(0, opts.limit)
  }

  return list
}

export function resolveEntryByLabel(
  entries: CatalogEntry[],
  input: string,
): CatalogEntry | null {
  const n = normalize(input)
  if (!n) return null
  for (const entry of entries) {
    if (normalize(entry.label) === n) return entry
    if ((entry.aliases ?? []).some((a) => normalize(a) === n)) return entry
  }
  return null
}

/** Simple similarity 0–1 for lint suggestions */
export function similarityScore(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  if (x === y) return 1
  const longer = x.length > y.length ? x : y
  const shorter = x.length > y.length ? y : x
  if (!longer.length) return 1
  // A substring is a near match only when it is most of the other string ("Reactjs" ~ "React"); otherwise any skill
  // containing the letter "r" would be "close to" the language R.
  if (longer.includes(shorter) && shorter.length >= 3 && shorter.length / longer.length >= 0.6) return 0.9
  // Edit distance, so a typo ("Pythn") is close and a different word with the same letters is not.
  return 1 - levenshtein(x, y) / longer.length
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

export function findNearMatch(
  entries: CatalogEntry[],
  input: string,
  threshold = 0.8,
): CatalogEntry | null {
  const n = normalize(input)
  if (!n) return null
  let best: CatalogEntry | null = null
  let bestScore = 0
  for (const entry of entries) {
    const candidates = [entry.label, ...(entry.aliases ?? [])]
    for (const c of candidates) {
      const score = similarityScore(n, c)
      if (score > bestScore && score >= threshold && score < 1) {
        bestScore = score
        best = entry
      }
    }
  }
  return best
}

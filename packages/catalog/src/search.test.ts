import { describe, expect, it } from 'vitest'
import type { CatalogEntry } from '@rb/catalog/types'
import {
  entryMatchesQuery,
  filterEntries,
  findNearMatch,
  resolveEntryByLabel,
  similarityScore,
} from '@rb/catalog/search'

const entries: CatalogEntry[] = [
  { id: '1', catalogType: 'skill', label: 'Python', aliases: ['py'], active: true, sortOrder: 1 },
  { id: '2', catalogType: 'skill', label: 'JavaScript', active: true, categoryId: 'cat-tools' },
  { id: '3', catalogType: 'skill', label: 'Leadership', active: false },
]

describe('catalog search', () => {
  it('filters by query and category', () => {
    const tools = filterEntries(entries, 'java', { categoryId: 'cat-tools' })
    expect(tools).toHaveLength(1)
    expect(tools[0].label).toBe('JavaScript')
  })

  it('matches aliases', () => {
    expect(entryMatchesQuery(entries[0], 'py')).toBe(true)
  })

  it('resolves label and alias case-insensitively', () => {
    expect(resolveEntryByLabel(entries, 'python')?.label).toBe('Python')
    expect(resolveEntryByLabel(entries, 'PY')?.label).toBe('Python')
  })

  it('excludes inactive entries by default', () => {
    const list = filterEntries(entries, 'lead')
    expect(list).toHaveLength(0)
  })

  it('finds near matches below exact match', () => {
    expect(similarityScore('Python', 'Pythn')).toBeGreaterThan(0.8)
    const near = findNearMatch(entries, 'Pythn')
    expect(near?.label).toBe('Python')
  })
})

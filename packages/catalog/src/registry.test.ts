import { describe, expect, it } from 'vitest'
import { emptyOverrides, getMergedEntries, mergeBundleWithOverrides } from '@rb/catalog/registry'
import type { CatalogEntry } from '@rb/catalog/types'

const bundle: CatalogEntry[] = [
  { id: 'a', catalogType: 'skill', label: 'Alpha', active: true },
  { id: 'b', catalogType: 'skill', label: 'Beta', active: true },
]

describe('catalog registry', () => {
  it('merges override edits', () => {
    const overrides = emptyOverrides('malaysia-default')
    overrides.entries.a = { id: 'a', catalogType: 'skill', label: 'Alpha Prime', active: true }
    const merged = mergeBundleWithOverrides(bundle, overrides)
    expect(merged.find((e) => e.id === 'a')?.label).toBe('Alpha Prime')
  })

  it('removes deleted bundle entries', () => {
    const overrides = emptyOverrides('malaysia-default')
    overrides.entries.b = { deleted: true }
    const merged = mergeBundleWithOverrides(bundle, overrides)
    expect(merged.some((e) => e.id === 'b')).toBe(false)
  })

  it('adds custom entries', () => {
    const overrides = emptyOverrides('malaysia-default')
    overrides.customEntries.push({
      id: 'c',
      catalogType: 'skill',
      label: 'Custom',
      active: true,
    })
    const merged = mergeBundleWithOverrides(bundle, overrides)
    expect(merged.some((e) => e.id === 'c')).toBe(true)
  })

  it('filters merged entries by type from bundle', () => {
    const skills = getMergedEntries('malaysia-default', emptyOverrides('malaysia-default'), 'skill')
    expect(skills.length).toBeGreaterThan(10)
    expect(skills.every((e) => e.catalogType === 'skill')).toBe(true)
  })
})

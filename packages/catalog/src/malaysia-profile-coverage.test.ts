import { describe, expect, it } from 'vitest'
import { getBundledCatalog } from '@rb/catalog/bundles'
import { resolveEntryByLabel } from '@rb/catalog/search'
import { sampleProfileDocument } from '@rb/fixtures'

describe('malaysia profile catalog coverage', () => {
  const bundle = getBundledCatalog('malaysia-default')
  const skills = bundle?.entries.filter((e) => e.catalogType === 'skill') ?? []

  it('resolves at least 90% of profile skills from the bundled catalog', () => {
    const allItems = sampleProfileDocument.skills.flatMap((g) =>
      g.name.toLowerCase().includes('language') ? [] : g.items,
    )
    const resolved = allItems.filter((item) => resolveEntryByLabel(skills, item))
    const ratio = resolved.length / allItems.length
    expect(ratio).toBeGreaterThanOrEqual(0.9)
  })
})

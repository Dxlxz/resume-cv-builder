import { describe, expect, it, beforeEach } from 'vitest'
import { resolveEntryByLabel } from '@rb/catalog/search'
import { clearCatalogOverrides } from '@rb/catalog/persistence'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import {sampleProfileDocument} from '@rb/fixtures'

describe('malaysia profile catalog coverage', () => {
  beforeEach(() => {
    clearCatalogOverrides()
    useCatalogStore.getState().init('malaysia-default')
  })

  it('resolves at least 90% of profile skills from catalog', () => {
    const skills = useCatalogStore.getState().getEntries('skill')
    const allItems = sampleProfileDocument.skills.flatMap((g) =>
      g.name.toLowerCase().includes('language') ? [] : g.items,
    )
    const resolved = allItems.filter((item) => resolveEntryByLabel(skills, item))
    const ratio = resolved.length / allItems.length
    expect(ratio).toBeGreaterThanOrEqual(0.9)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { getBundledCatalog } from '@rb/catalog/bundles'
import { clearCatalogOverrides, loadCatalogOverrides } from '@rb/catalog/persistence'
import { emptyOverrides, isDeletedOverride, mergeBundleWithOverrides } from '@rb/catalog/registry'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import type { CatalogExportPack } from '@rb/catalog/types'

describe('catalogStore', () => {
  beforeEach(() => {
    clearCatalogOverrides()
    useCatalogStore.setState({
      activeBundleId: 'malaysia-default',
      overrides: {
        schemaVersion: 1,
        bundleId: 'malaysia-default',
        entries: {},
        customEntries: [],
        updatedAt: new Date().toISOString(),
      },
    })
    useCatalogStore.getState().init('malaysia-default')
  })

  it('searches skills from malaysia bundle', () => {
    const results = useCatalogStore.getState().search('skill', 'python')
    expect(results.some((e) => e.label === 'Python')).toBe(true)
  })

  it('upserts and deletes custom entry', () => {
    const store = useCatalogStore.getState()
    store.upsertEntry({
      id: 'custom-skill-1',
      catalogType: 'skill',
      label: 'Custom Skill',
      active: true,
    })
    expect(store.getEntries('skill').some((e) => e.label === 'Custom Skill')).toBe(true)
    store.deleteEntry('custom-skill-1')
    expect(store.getEntries('skill').some((e) => e.label === 'Custom Skill')).toBe(false)
  })

  it('exports and imports pack round-trip', () => {
    const store = useCatalogStore.getState()
    store.upsertEntry({
      id: 'round-trip',
      catalogType: 'skill',
      label: 'Round Trip Skill',
      active: true,
    })
    const exported = store.exportPack()
    expect(exported).not.toBeNull()
    clearCatalogOverrides()
    store.init('malaysia-default')
    store.importPack(exported as CatalogExportPack, 'replace')
    expect(store.getEntries('skill').some((e) => e.label === 'Round Trip Skill')).toBe(true)
  })

  it('merge-importing an unmodified bundle export produces zero new overrides', () => {
    const store = useCatalogStore.getState()
    const bundle = getBundledCatalog('malaysia-default')!
    const pack: CatalogExportPack = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bundleId: 'malaysia-default',
      manifest: bundle.manifest,
      mergedEntries: mergeBundleWithOverrides(bundle.entries, emptyOverrides('malaysia-default')),
    }

    store.importPack(pack, 'merge')

    const { overrides } = useCatalogStore.getState()
    expect(overrides.entries).toEqual({})
    expect(overrides.customEntries).toEqual([])
    expect(loadCatalogOverrides()?.entries).toEqual({})
  })

  it('preserves a tombstone across a merge-mode import that does not mention it', () => {
    const store = useCatalogStore.getState()
    const bundle = getBundledCatalog('malaysia-default')!
    const targetId = bundle.entries.find((e) => e.catalogType === 'skill')!.id

    store.deleteEntry(targetId)
    expect(isDeletedOverride(useCatalogStore.getState().overrides.entries[targetId])).toBe(true)

    const pack: CatalogExportPack = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bundleId: 'malaysia-default',
      manifest: bundle.manifest,
      mergedEntries: mergeBundleWithOverrides(bundle.entries, emptyOverrides('malaysia-default')),
    }

    store.importPack(pack, 'merge')

    const { overrides } = useCatalogStore.getState()
    expect(isDeletedOverride(overrides.entries[targetId])).toBe(true)
  })

  it('syncs bundle for preset', () => {
    useCatalogStore.getState().syncBundleForPreset('international-generic')
    expect(useCatalogStore.getState().activeBundleId).toBe('international-default')
    useCatalogStore.getState().syncBundleForPreset('malaysia-corporate')
    expect(useCatalogStore.getState().activeBundleId).toBe('malaysia-default')
  })
})

import { describe, expect, it } from 'vitest'
import { getBundledCatalog } from '@rb/catalog/bundles'
import { mergeBundleWithOverrides, emptyOverrides, isDeletedOverride } from '@rb/catalog/registry'
import { compactOverrides, entriesEqual, packToOverrides } from '@rb/catalog/diff'
import type { CatalogEntry, CatalogExportPack } from '@rb/catalog/types'

const bundle = getBundledCatalog('malaysia-default')!

function exportPackFor(overrides = emptyOverrides('malaysia-default')): CatalogExportPack {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    bundleId: 'malaysia-default',
    manifest: bundle.manifest,
    mergedEntries: mergeBundleWithOverrides(bundle.entries, overrides),
  }
}

describe('entriesEqual', () => {
  it('is key-order independent', () => {
    const a: CatalogEntry = { id: 'a', catalogType: 'skill', label: 'Python', active: true, tags: ['x', 'y'] }
    const shuffled: CatalogEntry = { tags: ['x', 'y'], active: true, label: 'Python', id: 'a', catalogType: 'skill' }
    expect(entriesEqual(a, shuffled)).toBe(true)
  })

  it('treats undefined and absent fields as equal', () => {
    const a: CatalogEntry = { id: 'a', catalogType: 'skill', label: 'Python', active: true, aliases: undefined }
    const b: CatalogEntry = { id: 'a', catalogType: 'skill', label: 'Python', active: true }
    expect(entriesEqual(a, b)).toBe(true)
  })

  it('detects a real difference', () => {
    const a: CatalogEntry = { id: 'a', catalogType: 'skill', label: 'Python', active: true }
    const b: CatalogEntry = { id: 'a', catalogType: 'skill', label: 'Python 3', active: true }
    expect(entriesEqual(a, b)).toBe(false)
  })
})

describe('packToOverrides', () => {
  it('round trip: re-importing an unmodified bundle export yields zero new overrides', () => {
    const pack = exportPackFor()
    const result = packToOverrides(pack, bundle)
    expect(result.entries).toEqual({})
    expect(result.customEntries).toEqual([])
  })

  it('shadow bound: only structurally-different bundle entries become overrides', () => {
    const overrides = emptyOverrides('malaysia-default')
    const target = bundle.entries[0]
    overrides.entries[target.id] = { ...target, label: `${target.label} (modified)` }
    const pack = exportPackFor(overrides)

    const result = packToOverrides(pack, bundle)
    expect(Object.keys(result.entries)).toEqual([target.id])
    expect(result.entries[target.id]).toEqual(overrides.entries[target.id])
  })

  it('treats entries absent from the bundle as customEntries', () => {
    const overrides = emptyOverrides('malaysia-default')
    overrides.customEntries.push({ id: 'custom-1', catalogType: 'skill', label: 'Custom Skill', active: true })
    const pack = exportPackFor(overrides)

    const result = packToOverrides(pack, bundle)
    expect(result.entries).toEqual({})
    expect(result.customEntries).toEqual([
      { id: 'custom-1', catalogType: 'skill', label: 'Custom Skill', active: true },
    ])
  })
})

describe('compactOverrides', () => {
  it('drops overrides identical to the bundled entry', () => {
    const target = bundle.entries[0]
    const overrides = emptyOverrides('malaysia-default')
    overrides.entries[target.id] = { ...target }

    const compacted = compactOverrides(overrides, bundle)
    expect(compacted.entries[target.id]).toBeUndefined()
  })

  it('keeps tombstones and structurally-different overrides', () => {
    const target = bundle.entries[0]
    const tombstoneId = bundle.entries[1].id
    const overrides = emptyOverrides('malaysia-default')
    overrides.entries[target.id] = { ...target, label: `${target.label} (modified)` }
    overrides.entries[tombstoneId] = { deleted: true }

    const compacted = compactOverrides(overrides, bundle)
    expect(compacted.entries[target.id]).toBeDefined()
    expect(isDeletedOverride(compacted.entries[tombstoneId])).toBe(true)
  })

  it('returns the same reference when nothing changes', () => {
    const overrides = emptyOverrides('malaysia-default')
    expect(compactOverrides(overrides, bundle)).toBe(overrides)
  })
})

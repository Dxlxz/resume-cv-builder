import { describe, expect, it } from 'vitest'
import { getBundledCatalog } from '@rb/catalog/bundles'
import { emptyOverrides, mergeBundleWithOverrides } from '@rb/catalog/registry'
import {
  catalogEntrySchema,
  catalogExportPackSchema,
  catalogOverrideStateSchema,
} from '@rb/catalog/schema'

const bundle = getBundledCatalog('malaysia-default')!

describe('catalogEntrySchema', () => {
  it('accepts a valid entry', () => {
    expect(catalogEntrySchema.safeParse(bundle.entries[0]).success).toBe(true)
  })

  it('rejects an entry with an unknown catalogType', () => {
    const result = catalogEntrySchema.safeParse({
      id: 'x',
      catalogType: 'not-a-type',
      label: 'X',
      active: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an entry missing required fields', () => {
    const result = catalogEntrySchema.safeParse({ id: 'x', catalogType: 'skill' })
    expect(result.success).toBe(false)
  })
})

describe('catalogExportPackSchema', () => {
  it('accepts a valid export pack', () => {
    const pack = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bundleId: 'malaysia-default',
      manifest: bundle.manifest,
      mergedEntries: mergeBundleWithOverrides(bundle.entries, emptyOverrides('malaysia-default')),
    }
    expect(catalogExportPackSchema.safeParse(pack).success).toBe(true)
  })

  it('rejects a pack with the wrong schema version', () => {
    const result = catalogExportPackSchema.safeParse({
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      bundleId: 'malaysia-default',
      manifest: bundle.manifest,
      mergedEntries: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a pack with malformed entries', () => {
    const result = catalogExportPackSchema.safeParse({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bundleId: 'malaysia-default',
      manifest: bundle.manifest,
      mergedEntries: [{ id: 'bad' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects arbitrary JSON', () => {
    expect(catalogExportPackSchema.safeParse({ foo: 'bar' }).success).toBe(false)
  })
})

describe('catalogOverrideStateSchema', () => {
  it('accepts a valid override state', () => {
    const state = emptyOverrides('malaysia-default')
    state.entries['some-id'] = { deleted: true }
    expect(catalogOverrideStateSchema.safeParse(state).success).toBe(true)
  })

  it('rejects an override state with an invalid entry override', () => {
    const state = {
      ...emptyOverrides('malaysia-default'),
      entries: { broken: { deleted: false } },
    }
    expect(catalogOverrideStateSchema.safeParse(state).success).toBe(false)
  })
})

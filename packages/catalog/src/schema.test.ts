import { describe, expect, it } from 'vitest'
import { getBundledCatalog } from '@rb/catalog/bundles'
import {
  catalogEntrySchema,
  catalogExportPackSchema,
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
      mergedEntries: bundle.entries,
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

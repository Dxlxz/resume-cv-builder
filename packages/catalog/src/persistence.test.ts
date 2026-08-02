import { beforeEach, describe, expect, it } from 'vitest'
import { emptyOverrides } from '@rb/catalog/registry'
import {
  loadCatalogOverrides,
  loadOrCreateOverrides,
  saveCatalogOverrides,
} from '@rb/catalog/persistence'

const STORAGE_KEY = 'resume-cv-builder-catalog-v1'

describe('catalog persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a valid override state', () => {
    const state = emptyOverrides('malaysia-default')
    state.entries['some-id'] = { deleted: true }
    saveCatalogOverrides(state)
    expect(loadCatalogOverrides()).toEqual(state)
  })

  it('falls back to null without deleting the raw value when overrides are malformed', () => {
    const raw = JSON.stringify({ schemaVersion: 1, bundleId: 'malaysia-default', entries: { x: { deleted: 'yes' } }, customEntries: [], updatedAt: '2026-01-01' })
    localStorage.setItem(STORAGE_KEY, raw)

    expect(loadCatalogOverrides()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })

  it('loadOrCreateOverrides falls back to empty overrides for malformed data', () => {
    localStorage.setItem(STORAGE_KEY, 'not json')
    const result = loadOrCreateOverrides('malaysia-default')
    expect(result.entries).toEqual({})
    expect(result.customEntries).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('not json')
  })
})

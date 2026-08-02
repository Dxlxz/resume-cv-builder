import { create } from 'zustand'
import { bundleIdForPreset } from '@rb/catalog/bundleForPreset'
import { getBundledCatalog } from '@rb/catalog/bundles'
import {
  emptyOverrides,
  getBundleManifest,
  getMergedEntries,
  isDeletedOverride,
  mergeBundleWithOverrides,
} from '@rb/catalog/registry'
import { compactOverrides, entriesEqual, packToOverrides } from '@rb/catalog/diff'
import {
  loadOrCreateOverrides,
  saveCatalogOverrides,
} from '@rb/catalog/persistence'
import { filterEntries, resolveEntryByLabel } from '@rb/catalog/search'
import type {
  CatalogEntry,
  CatalogExportPack,
  CatalogOverrideState,
  CatalogType,
  SearchOpts,
} from '@rb/catalog/types'
import { createId } from '@rb/core/utils'

interface CatalogState {
  activeBundleId: string
  overrides: CatalogOverrideState
  init: (presetBundleId?: string) => void
  setActiveBundle: (bundleId: string) => void
  syncBundleForPreset: (presetId: Parameters<typeof bundleIdForPreset>[0]) => void
  getEntries: (type: CatalogType) => CatalogEntry[]
  search: (type: CatalogType, query: string, opts?: SearchOpts) => CatalogEntry[]
  resolveLabel: (type: CatalogType, input: string) => CatalogEntry | null
  upsertEntry: (entry: CatalogEntry) => void
  deleteEntry: (id: string) => void
  resetVocabulary: (type: CatalogType) => void
  resetAll: () => void
  importPack: (pack: CatalogExportPack, mode: 'merge' | 'replace') => void
  exportPack: () => CatalogExportPack | null
  touch: () => void
}

function touchOverrides(overrides: CatalogOverrideState): CatalogOverrideState {
  return { ...overrides, updatedAt: new Date().toISOString() }
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  activeBundleId: 'malaysia-default',
  overrides: emptyOverrides('malaysia-default'),

  init: (presetBundleId) => {
    const bundleId = presetBundleId ?? 'malaysia-default'
    const loaded = { ...loadOrCreateOverrides(bundleId), bundleId }
    const compacted = compactOverrides(loaded, getBundledCatalog(bundleId) ?? undefined)
    if (compacted !== loaded) {
      saveCatalogOverrides(compacted)
    }
    set({
      activeBundleId: bundleId,
      overrides: compacted,
    })
  },

  setActiveBundle: (bundleId) => {
    const current = get()
    set({
      activeBundleId: bundleId,
      overrides: { ...current.overrides, bundleId },
    })
    get().touch()
  },

  syncBundleForPreset: (presetId) => {
    get().setActiveBundle(bundleIdForPreset(presetId))
  },

  getEntries: (type) => {
    const { activeBundleId, overrides } = get()
    return getMergedEntries(activeBundleId, overrides, type)
  },

  search: (type, query, opts) => {
    const entries = get().getEntries(type)
    return filterEntries(entries, query, opts)
  },

  resolveLabel: (type, input) => {
    return resolveEntryByLabel(get().getEntries(type), input)
  },

  upsertEntry: (entry) => {
    const { overrides, activeBundleId } = get()
    const bundle = getBundledCatalog(activeBundleId)
    const bundled = bundle?.entries.find((e) => e.id === entry.id)
    const inBundle = bundled !== undefined

    const entries = { ...overrides.entries }
    if (bundled && entriesEqual(bundled, entry)) {
      delete entries[entry.id]
    } else {
      entries[entry.id] = entry
    }

    const next: CatalogOverrideState = touchOverrides({
      ...overrides,
      entries,
      customEntries: inBundle
        ? overrides.customEntries
        : [...overrides.customEntries.filter((e) => e.id !== entry.id), entry],
    })
    set({ overrides: next })
    saveCatalogOverrides(next)
  },

  deleteEntry: (id) => {
    const { overrides } = get()
    const next: CatalogOverrideState = touchOverrides({
      ...overrides,
      entries: { ...overrides.entries, [id]: { deleted: true } },
      customEntries: overrides.customEntries.filter((e) => e.id !== id),
    })
    set({ overrides: next })
    saveCatalogOverrides(next)
  },

  resetVocabulary: (type) => {
    const { overrides, activeBundleId } = get()
    const bundle = getBundledCatalog(activeBundleId)
    if (!bundle) return
    const ids = bundle.entries.filter((e) => e.catalogType === type).map((e) => e.id)
    const entries = { ...overrides.entries }
    for (const id of ids) {
      delete entries[id]
    }
    const next: CatalogOverrideState = touchOverrides({
      ...overrides,
      entries,
      customEntries: overrides.customEntries.filter((e) => e.catalogType !== type),
    })
    set({ overrides: next })
    saveCatalogOverrides(next)
  },

  resetAll: () => {
    const bundleId = get().activeBundleId
    const next = emptyOverrides(bundleId)
    set({ overrides: next })
    saveCatalogOverrides(next)
  },

  importPack: (pack, mode) => {
    const bundleId = pack.bundleId
    const bundle = getBundledCatalog(bundleId) ?? undefined
    const diff = packToOverrides(pack, bundle)

    if (mode === 'replace') {
      const next: CatalogOverrideState = {
        schemaVersion: 1,
        bundleId,
        entries: diff.entries,
        customEntries: diff.customEntries,
        updatedAt: new Date().toISOString(),
      }
      set({ activeBundleId: bundleId, overrides: next })
      saveCatalogOverrides(next)
      return
    }

    const current = get().overrides
    const customById = new Map(current.customEntries.map((e) => [e.id, e]))
    for (const entry of diff.customEntries) {
      customById.set(entry.id, entry)
    }
    const next: CatalogOverrideState = touchOverrides({
      ...current,
      bundleId,
      entries: { ...current.entries, ...diff.entries },
      customEntries: [...customById.values()],
    })
    set({ activeBundleId: bundleId, overrides: next })
    saveCatalogOverrides(next)
  },

  exportPack: () => {
    const { activeBundleId, overrides } = get()
    const bundle = getBundledCatalog(activeBundleId)
    const manifest = getBundleManifest(activeBundleId)
    if (!bundle || !manifest) return null
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      bundleId: activeBundleId,
      manifest,
      mergedEntries: mergeBundleWithOverrides(bundle.entries, overrides),
    }
  },

  touch: () => {
    const next = touchOverrides(get().overrides)
    set({ overrides: next })
    saveCatalogOverrides(next)
  },
}))

export function createCatalogEntry(
  catalogType: CatalogType,
  label: string,
  partial: Partial<CatalogEntry> = {},
): CatalogEntry {
  return {
    id: createId(),
    catalogType,
    label,
    active: true,
    ...partial,
  }
}

export function categoryIdForSkillGroupName(groupName: string): string | undefined {
  const n = groupName.trim().toLowerCase()
  if (n.includes('industry') || n.includes('domain') || n.includes('knowledge')) return 'cat-industry'
  if (n.includes('tool') || n.includes('technolog')) return 'cat-tools'
  if (n.includes('interpersonal') || n.includes('soft')) return 'cat-interpersonal'
  if (n.includes('other')) return 'cat-other'
  return undefined
}

export function isLanguagesSkillGroup(groupName: string): boolean {
  return groupName.trim().toLowerCase().includes('language')
}

export { isDeletedOverride }

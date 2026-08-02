import { useMemo } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { bundleIdForPreset } from '@rb/catalog/bundleForPreset'
import { getBundledCatalog } from '@rb/catalog/bundles'
import { filterEntries, resolveEntryByLabel } from '@rb/catalog/search'
import type { CatalogEntry, CatalogType, SearchOpts } from '@rb/catalog/types'

/**
 * Catalog access for pickers: reads the bundled vocabulary that matches the
 * document's preset. No override store, no admin - catalogs are edited in
 * code (packages/catalog/src/bundles).
 */

function entriesOfType(entries: CatalogEntry[], type: CatalogType): CatalogEntry[] {
  return entries.filter((e) => e.catalogType === type)
}

export function useCatalogBundle() {
  const presetId = useDocumentStore((s) => s.document?.meta.presetId)

  return useMemo(() => {
    const bundle = presetId ? getBundledCatalog(bundleIdForPreset(presetId)) : null
    const all = bundle?.entries ?? []

    return {
      search: (type: CatalogType, query: string, opts: SearchOpts = {}) =>
        filterEntries(entriesOfType(all, type), query, opts),
      resolveLabel: (type: CatalogType, input: string): CatalogEntry | null =>
        resolveEntryByLabel(entriesOfType(all, type), input),
      getEntries: (type: CatalogType): CatalogEntry[] => entriesOfType(all, type),
    }
  }, [presetId])
}

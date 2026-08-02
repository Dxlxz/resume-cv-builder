import type {
  CatalogEntry,
  CatalogEntryOverride,
  CatalogOverrideState,
  CatalogType,
} from '@rb/catalog/types'
import { getBundledCatalog } from '@rb/catalog/bundles'

export function mergeBundleWithOverrides(
  bundleEntries: CatalogEntry[],
  overrides: CatalogOverrideState,
): CatalogEntry[] {
  const byId = new Map<string, CatalogEntry>()
  for (const entry of bundleEntries) {
    byId.set(entry.id, entry)
  }

  for (const [id, override] of Object.entries(overrides.entries)) {
    if ('deleted' in override && override.deleted) {
      byId.delete(id)
      continue
    }
    const base = byId.get(id)
    byId.set(id, { ...(base ?? (override as CatalogEntry)), ...(override as CatalogEntry), id })
  }

  for (const custom of overrides.customEntries) {
    byId.set(custom.id, custom)
  }

  return [...byId.values()]
}

export function getMergedEntries(
  bundleId: string,
  overrides: CatalogOverrideState,
  catalogType?: CatalogType,
): CatalogEntry[] {
  const bundle = getBundledCatalog(bundleId)
  if (!bundle) return []
  const merged = mergeBundleWithOverrides(bundle.entries, overrides)
  if (!catalogType) return merged
  return merged.filter((e) => e.catalogType === catalogType)
}

export function getBundleManifest(bundleId: string) {
  return getBundledCatalog(bundleId)?.manifest ?? null
}

export function emptyOverrides(bundleId: string): CatalogOverrideState {
  return {
    schemaVersion: 1,
    bundleId,
    entries: {},
    customEntries: [],
    updatedAt: new Date().toISOString(),
  }
}

export function isDeletedOverride(value: CatalogEntryOverride): value is { deleted: true } {
  return 'deleted' in value && value.deleted === true
}

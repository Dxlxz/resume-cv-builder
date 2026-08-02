import type { BundledCatalog } from '@rb/catalog/types'
import { internationalEntries, internationalManifest } from '@rb/catalog/bundles/international-default'
import { malaysiaEntries, malaysiaManifest } from '@rb/catalog/bundles/malaysia-default'

export const BUNDLED_CATALOGS: Record<string, BundledCatalog> = {
  'malaysia-default': {
    manifest: malaysiaManifest,
    entries: malaysiaEntries,
  },
  'international-default': {
    manifest: internationalManifest,
    entries: internationalEntries,
  },
}

export function getBundledCatalog(bundleId: string): BundledCatalog | null {
  return BUNDLED_CATALOGS[bundleId] ?? null
}

export const BUNDLE_LIST = Object.values(BUNDLED_CATALOGS).map((b) => b.manifest)

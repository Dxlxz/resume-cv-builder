import type { CatalogOverrideState } from '@rb/catalog/types'
import { emptyOverrides } from '@rb/catalog/registry'
import { catalogOverrideStateSchema } from '@rb/catalog/schema'

const STORAGE_KEY = 'resume-cv-builder-catalog-v1'

export function loadCatalogOverrides(): CatalogOverrideState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const result = catalogOverrideStateSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export function saveCatalogOverrides(state: CatalogOverrideState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearCatalogOverrides(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function loadOrCreateOverrides(bundleId: string): CatalogOverrideState {
  const saved = loadCatalogOverrides()
  if (saved) return saved
  return emptyOverrides(bundleId)
}

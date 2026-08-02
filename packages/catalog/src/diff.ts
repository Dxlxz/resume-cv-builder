import type {
  BundledCatalog,
  CatalogEntry,
  CatalogExportPack,
  CatalogOverrideState,
} from '@rb/catalog/types'
import { isDeletedOverride } from '@rb/catalog/registry'

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((item, i) => valuesEqual(item, b[i]))
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const aRecord = a as Record<string, unknown>
    const bRecord = b as Record<string, unknown>
    const aKeys = Object.keys(aRecord).filter((k) => aRecord[k] !== undefined)
    const bKeys = Object.keys(bRecord).filter((k) => bRecord[k] !== undefined)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every(
      (key) => bRecord[key] !== undefined && valuesEqual(aRecord[key], bRecord[key]),
    )
  }
  return false
}

/** Structural, key-order-insensitive equality. Absent keys and `undefined` values are equivalent. */
export function entriesEqual(a: CatalogEntry, b: CatalogEntry): boolean {
  return valuesEqual(a, b)
}

/**
 * Diffs pack entries against the active bundle.
 * - `entries`: pack entries that exist in the bundle but differ from it (overrides).
 * - `customEntries`: pack entries absent from the bundle.
 *
 * Re-importing an unmodified bundle's export pack yields `{ entries: {}, customEntries: [] }`.
 */
export function packToOverrides(
  pack: CatalogExportPack,
  bundle: BundledCatalog | undefined,
): Pick<CatalogOverrideState, 'entries' | 'customEntries'> {
  const bundleById = new Map(bundle?.entries.map((entry) => [entry.id, entry]) ?? [])

  const entries: CatalogOverrideState['entries'] = {}
  const customEntries: CatalogEntry[] = []

  for (const entry of pack.mergedEntries) {
    const bundled = bundleById.get(entry.id)
    if (!bundled) {
      customEntries.push(entry)
    } else if (!entriesEqual(bundled, entry)) {
      entries[entry.id] = entry
    }
  }

  return { entries, customEntries }
}

/** Removes overrides that are structurally identical to the bundled entry they shadow. */
export function compactOverrides(
  overrides: CatalogOverrideState,
  bundle: BundledCatalog | undefined,
): CatalogOverrideState {
  if (!bundle) return overrides
  const bundleById = new Map(bundle.entries.map((entry) => [entry.id, entry]))

  const entries: CatalogOverrideState['entries'] = {}
  let changed = false
  for (const [id, override] of Object.entries(overrides.entries)) {
    const bundled = bundleById.get(id)
    if (!isDeletedOverride(override) && bundled && entriesEqual(bundled, override)) {
      changed = true
      continue
    }
    entries[id] = override
  }

  return changed ? { ...overrides, entries } : overrides
}

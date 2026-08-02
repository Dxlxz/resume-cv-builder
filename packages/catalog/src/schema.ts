import { z } from 'zod'
import type { CatalogType } from '@rb/catalog/types'
import { CATALOG_TYPES } from '@rb/catalog/types'
import { LOCALES, PRESET_IDS } from '@rb/core/types/document'

export const catalogEntrySchema = z.object({
  id: z.string().min(1),
  catalogType: z.enum(CATALOG_TYPES as [CatalogType, ...CatalogType[]]),
  label: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  industryId: z.string().optional(),
  locale: z.enum(LOCALES).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean(),
  sortOrder: z.number().optional(),
  meta: z.record(z.string(), z.string()).optional(),
})

export const catalogBundleManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  locale: z.enum(LOCALES),
  presetIds: z.array(z.enum(PRESET_IDS)),
  updatedAt: z.string(),
})

export const catalogExportPackSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  bundleId: z.string(),
  manifest: catalogBundleManifestSchema,
  mergedEntries: z.array(catalogEntrySchema),
})

import type { z } from 'zod'
import type {
  catalogBundleManifestSchema,
  catalogEntrySchema,
  catalogExportPackSchema,
} from '@rb/catalog/schema'
import type { Locale } from '@rb/core/types/document'

export type CatalogType =
  | 'skill'
  | 'skill-category'
  | 'language'
  | 'language-proficiency'
  | 'occupation'
  | 'industry'
  | 'institution'
  | 'degree-type'
  | 'location'
  | 'certification'
  | 'action-verb'

export const CATALOG_TYPES: CatalogType[] = [
  'skill-category',
  'skill',
  'language',
  'language-proficiency',
  'occupation',
  'industry',
  'institution',
  'degree-type',
  'location',
  'certification',
  'action-verb',
]

export const CATALOG_TYPE_LABELS: Record<CatalogType, string> = {
  'skill-category': 'Skill categories',
  skill: 'Skills',
  language: 'Languages',
  'language-proficiency': 'Language proficiency',
  occupation: 'Occupations',
  industry: 'Industries',
  institution: 'Institutions',
  'degree-type': 'Degree types',
  location: 'Locations',
  certification: 'Certifications',
  'action-verb': 'Action verbs',
}

export type CatalogEntry = z.infer<typeof catalogEntrySchema>


export type CatalogBundleManifest = z.infer<typeof catalogBundleManifestSchema>


export type CatalogExportPack = z.infer<typeof catalogExportPackSchema>

export interface SearchOpts {
  categoryId?: string
  industryId?: string
  locale?: Locale
  limit?: number
  activeOnly?: boolean
}

export interface BundledCatalog {
  manifest: CatalogBundleManifest
  entries: CatalogEntry[]
}

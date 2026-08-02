import type {
  DocumentType,
  ExportProfile,
  Locale,
  PageSize,
  PresetId,
  SectionId,
  TemplateId,
  ThemeId,
} from '@rb/core/types/document'
import type { LayoutProfile, TypographyScale } from '@rb/themes/types'

export type ValidatorId = 'ats' | 'malaysia-regional'

export interface PresetDefinition {
  id: PresetId
  name: string
  description: string
  region: string
  defaults: {
    documentType: DocumentType
    templateId: TemplateId
    themeId: ThemeId
    pageSize: PageSize
    exportProfile: ExportProfile
    locale: Locale
    sectionOrder?: SectionId[]
  }
  labels: Partial<Record<SectionId, string>>
  hints: string[]
  validators: ValidatorId[]
  /** Density tuning — merged over theme and template profiles (preset wins). */
  typography?: Partial<TypographyScale>
  layout?: Partial<LayoutProfile>
}

import type { DocumentType, PresetId, ResumeDocument } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { getPreset } from '@rb/presets/registry'

export function createEmptyDocument(
  documentType: DocumentType,
  presetId: PresetId = 'international-generic',
): ResumeDocument {
  const preset = getPreset(presetId)
  const now = new Date().toISOString()
  const defaults = preset.defaults

  return {
    meta: {
      schemaVersion: 2,
      documentType,
      presetId,
      templateId: defaults.templateId ?? (documentType === 'resume' ? 'classic' : 'academic'),
      themeId: defaults.themeId,
      exportProfile: defaults.exportProfile,
      locale: defaults.locale,
      sectionOrder: defaults.sectionOrder ?? [...ALL_SECTIONS],
      hiddenSections: [],
      pageSize: defaults.pageSize ?? (documentType === 'resume' ? 'letter' : 'a4'),
      updatedAt: now,
    },
    contact: { fullName: '', email: '' },
    summary: '',
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    projects: [],
    volunteer: [],
    references: [],
  }
}

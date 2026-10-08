import type { DocumentType, PresetId, ResumeDocument } from '@rb/core/types/document'
import { ALL_SECTIONS, COVER_LETTER_SECTIONS } from '@rb/core/types/document'
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
      schemaVersion: 3,
      documentType,
      presetId,
      templateId:
        documentType === 'cover-letter'
          ? 'classic'
          : (defaults.templateId ?? (documentType === 'resume' ? 'classic' : 'academic')),
      themeId: defaults.themeId,
      exportProfile: defaults.exportProfile,
      locale: defaults.locale,
      // A cover letter is a letter, not a trimmed resume: it gets its own
      // section set rather than hiding seven of the resume's.
      sectionOrder:
        documentType === 'cover-letter'
          ? [...COVER_LETTER_SECTIONS]
          : (defaults.sectionOrder ?? [...ALL_SECTIONS]),
      hiddenSections: [],
      sectionGuides: {},
      pageSize: defaults.pageSize ?? (documentType === 'cv' ? 'a4' : 'letter'),
      updatedAt: now,
    },
    contact: { fullName: '', email: '' },
    letter: documentType === 'cover-letter' ? { paragraphs: ['', ''] } : undefined,
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

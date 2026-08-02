import type { PresetDefinition } from '@rb/presets/types'
import { ALL_SECTIONS } from '@rb/core/types/document'

export const malaysiaCorporatePreset: PresetDefinition = {
  id: 'malaysia-corporate',
  name: 'Malaysia Corporate',
  description: 'JobStreet & Maukerja ready — A4, ATS-strict layout, British English norms.',
  region: 'Malaysia',
  defaults: {
    documentType: 'resume',
    templateId: 'ats-strict',
    themeId: 'navy-corporate',
    pageSize: 'a4',
    exportProfile: 'portal-safe',
    locale: 'en-MY',
    sectionOrder: [...ALL_SECTIONS],
  },
  labels: {
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    certifications: 'Certifications',
    skills: 'Skills',
    projects: 'Projects',
    volunteer: 'Leadership & Volunteer Experience',
    references: 'References',
  },
  hints: [
    'Keep to 1–2 pages for corporate roles',
    'Use city/state only — do not include IC/NRIC number',
    'Quantify impact in % or RM where possible',
    'British English preferred (organise, centre)',
    'Export uses ATS-safe single-column layout',
  ],
  validators: ['ats', 'malaysia-regional'],
  // Compact corporate density (applies to RESUME documents only — CVs keep
  // template density and no bullet cap): dense header, tight vertical rhythm,
  // capped bullets. Tuned for the 1–2 page corporate norm.
  typography: {
    nameSize: 16,
    sectionSize: 11,
    subheadingSize: 10.5,
    bodySize: 10,
    metaSize: 8.5,
    lineHeight: 1.32,
  },
  layout: {
    pageMarginPt: 40,
    sectionGapPt: 12,
    sectionTitleGapPt: 6,
    ruleToFirstSectionPt: 10,
    nameToMetaPt: 5,
    metaLineGapPt: 3,
    metaLineHeight: 1.3,
    headerRulePaddingPt: 5,
    itemSubtitleGapPt: 2,
    itemGapPt: 7,
    bulletGapPt: 3,
    skillGroupGapPt: 5,
    paragraphGapPt: 5,
    skillLineMaxChars: 105,
    maxBulletsPerItem: 3,
  },
}

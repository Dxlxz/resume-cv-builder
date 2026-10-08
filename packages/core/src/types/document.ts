export type DocumentType = 'resume' | 'cv' | 'cover-letter'
export type PageSize = 'letter' | 'a4'
export type SchemaVersion = 1 | 2 | 3

export const PRESET_IDS = ['malaysia-corporate', 'international-generic'] as const
export type PresetId = (typeof PRESET_IDS)[number]

export const TEMPLATE_IDS = [
  'classic',
  'academic',
  'ats-strict',
  'modern-rail',
  'banner',
  'sidebar',
  'ivy',
  'compact',
  'split',
  'executive',
  'harbor',
  'slate',
  'minimal',
] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const THEME_IDS = ['mono', 'navy-corporate', 'academic-serif'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const LOCALES = ['en-MY', 'en-US', 'en-GB'] as const
export type Locale = (typeof LOCALES)[number]

export const EXPORT_PROFILES = ['standard', 'portal-safe'] as const
export type ExportProfile = (typeof EXPORT_PROFILES)[number]

export type SectionId =
  | 'contact'
  | 'letter'
  | 'summary'
  | 'experience'
  | 'education'
  | 'certifications'
  | 'skills'
  | 'projects'
  | 'volunteer'
  | 'references'

export const ALL_SECTIONS: SectionId[] = [
  'contact',
  'letter',
  'summary',
  'experience',
  'education',
  'certifications',
  'skills',
  'projects',
  'volunteer',
  'references',
]

/** A cover letter is only these two sections, in this order. */
export const COVER_LETTER_SECTIONS: SectionId[] = ['contact', 'letter']

export const SECTION_LABELS: Record<SectionId, string> = {
  contact: 'Contact',
  letter: 'Letter',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  skills: 'Skills',
  projects: 'Projects',
  volunteer: 'Leadership & Volunteer Experience',
  references: 'References',
}

export interface DocumentMetaV1 {
  schemaVersion: 1
  documentType: DocumentType
  templateId: 'classic' | 'academic'
  sectionOrder: SectionId[]
  hiddenSections: SectionId[]
  pageSize: PageSize
  updatedAt: string
}

export interface DocumentMeta {
  schemaVersion: 3
  documentType: DocumentType
  presetId: PresetId
  templateId: TemplateId
  themeId: ThemeId
  exportProfile: ExportProfile
  locale: Locale
  sectionOrder: SectionId[]
  hiddenSections: SectionId[]
  /** Retained for saved drafts and JSON imports. No longer used by the app. */
  sectionGuides: Partial<Record<SectionId, string>>
  pageSize: PageSize
  updatedAt: string
}

/**
 * The parts of a cover letter that a resume has no equivalent for. The sender
 * block is `contact`, reused as-is, so the two document types share a header.
 */
export interface LetterSection {
  /** Free text so "12 August 2026" and "2026-08-12" are both fine. */
  date?: string
  recipientName?: string
  recipientTitle?: string
  company?: string
  companyAddress?: string
  /** e.g. "Dear Ms Rahman," — falls back to a neutral greeting when empty. */
  salutation?: string
  /** One string per paragraph; blank entries are dropped at render time. */
  paragraphs: string[]
  /** e.g. "Yours sincerely," — the sender's name is printed underneath. */
  closing?: string
}

export interface ContactSection {
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: string
  linkedIn?: string
  website?: string
}

export interface ExperienceItem {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  present: boolean
  bullets: string[]
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field?: string
  startDate?: string
  endDate?: string
  honors?: string
}

export interface SkillGroup {
  id: string
  name: string
  items: string[]
}

export interface ProjectItem {
  id: string
  name: string
  url?: string
  description?: string
  bullets: string[]
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  completed?: string
  verifyUrl?: string
}

export interface ReferenceItem {
  id: string
  name: string
  title: string
  company: string
  phone?: string
  email?: string
}

export interface ResumeDocumentV1 {
  meta: DocumentMetaV1
  contact: ContactSection
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: SkillGroup[]
  projects: ProjectItem[]
  certifications?: CertificationItem[]
  volunteer?: ExperienceItem[]
  references?: ReferenceItem[]
}

export interface ResumeDocument {
  meta: DocumentMeta
  contact: ContactSection
  /** Present on cover letters; absent on resumes and CVs. */
  letter?: LetterSection
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  certifications: CertificationItem[]
  skills: SkillGroup[]
  projects: ProjectItem[]
  volunteer: ExperienceItem[]
  references: ReferenceItem[]
}

export type SaveStatus = 'saved' | 'saving' | 'error'

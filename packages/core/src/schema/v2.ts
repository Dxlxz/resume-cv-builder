import { z } from 'zod'
import type { ResumeDocument } from '@rb/core/types/document'
import {
  EXPORT_PROFILES,
  LOCALES,
  PRESET_IDS,
  TEMPLATE_IDS,
  THEME_IDS,
} from '@rb/core/types/document'
import {
  certificationItemSchema,
  contactSchema,
  educationItemSchema,
  experienceItemSchema,
  exportContactSchema,
  projectItemSchema,
  referenceItemSchema,
  sectionIdSchema,
  skillGroupSchema,
} from '@rb/core/schema/shared'

export const documentMetaV2Schema = z.object({
  schemaVersion: z.literal(2),
  documentType: z.enum(['resume', 'cv']),
  presetId: z.enum(PRESET_IDS),
  templateId: z.enum(TEMPLATE_IDS),
  themeId: z.enum(THEME_IDS),
  exportProfile: z.enum(EXPORT_PROFILES),
  locale: z.enum(LOCALES),
  sectionOrder: z.array(sectionIdSchema),
  hiddenSections: z.array(sectionIdSchema),
  pageSize: z.enum(['letter', 'a4']),
  updatedAt: z.string(),
})

export const resumeDocumentV2Schema = z.object({
  meta: documentMetaV2Schema,
  contact: contactSchema,
  summary: z.string(),
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  certifications: z.array(certificationItemSchema).default([]),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  volunteer: z.array(experienceItemSchema).default([]),
  references: z.array(referenceItemSchema).default([]),
})

export type ParsedResumeDocument = z.infer<typeof resumeDocumentV2Schema>

export function parseDocument(data: unknown): ResumeDocument {
  return resumeDocumentV2Schema.parse(data)
}

export function safeParseV2(data: unknown) {
  return resumeDocumentV2Schema.safeParse(data)
}

export function validateForExport(document: ResumeDocument) {
  return exportContactSchema.safeParse(document.contact)
}

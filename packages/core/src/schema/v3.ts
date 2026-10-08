import { z } from 'zod'
import { TEMPLATE_IDS, type ResumeDocument } from '@rb/core/types/document'
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

/**
 * Schema v3: adds `meta.sectionGuides` - per-section instructions for the
 * AI assistant. Guides are trimmed on parse and empty entries removed.
 */

/**
 * Partial map of section id -> guide text. Unknown keys are stripped;
 * every key optional so an empty guide map is valid.
 */
export const sectionGuidesSchema = z
  .object({
    contact: z.string().max(2000).optional(),
    summary: z.string().max(2000).optional(),
    experience: z.string().max(2000).optional(),
    education: z.string().max(2000).optional(),
    certifications: z.string().max(2000).optional(),
    skills: z.string().max(2000).optional(),
    projects: z.string().max(2000).optional(),
    volunteer: z.string().max(2000).optional(),
    references: z.string().max(2000).optional(),
    letter: z.string().max(2000).optional(),
  })
  .default({})

export const documentMetaV3Schema = z.object({
  schemaVersion: z.literal(3),
  documentType: z.enum(['resume', 'cv', 'cover-letter']),
  presetId: z.enum(['malaysia-corporate', 'international-generic']),
  templateId: z.enum(TEMPLATE_IDS),
  themeId: z.enum(['mono', 'navy-corporate', 'academic-serif']),
  exportProfile: z.enum(['standard', 'portal-safe']),
  locale: z.enum(['en-MY', 'en-US']),
  sectionOrder: z.array(sectionIdSchema),
  hiddenSections: z.array(sectionIdSchema),
  sectionGuides: sectionGuidesSchema,
  pageSize: z.enum(['letter', 'a4']),
  updatedAt: z.string(),
})

/** Cover-letter body. Optional so resumes and CVs stay valid without it. */
export const letterSchema = z
  .object({
    date: z.string().max(60).optional(),
    recipientName: z.string().max(200).optional(),
    recipientTitle: z.string().max(200).optional(),
    company: z.string().max(200).optional(),
    companyAddress: z.string().max(400).optional(),
    salutation: z.string().max(200).optional(),
    paragraphs: z.array(z.string().max(4000)).default([]),
    closing: z.string().max(200).optional(),
  })
  .optional()

export const resumeDocumentV3Schema = z.object({
  meta: documentMetaV3Schema,
  contact: contactSchema,
  letter: letterSchema,
  summary: z.string(),
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  certifications: z.array(certificationItemSchema).default([]),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  volunteer: z.array(experienceItemSchema).default([]),
  references: z.array(referenceItemSchema).default([]),
})

export type ParsedResumeDocument = z.infer<typeof resumeDocumentV3Schema>

export function safeParseV3(data: unknown) {
  return resumeDocumentV3Schema.safeParse(data)
}

export function validateForExport(document: ResumeDocument) {
  return exportContactSchema.safeParse(document.contact)
}

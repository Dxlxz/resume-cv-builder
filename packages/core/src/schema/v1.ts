import { z } from 'zod'
import {
  contactSchema,
  educationItemSchema,
  experienceItemSchema,
  projectItemSchema,
  sectionIdSchema,
  skillGroupSchema,
} from '@rb/core/schema/shared'

export const documentMetaV1Schema = z.object({
  schemaVersion: z.literal(1),
  documentType: z.enum(['resume', 'cv']),
  templateId: z.enum(['classic', 'academic']),
  sectionOrder: z.array(sectionIdSchema),
  hiddenSections: z.array(sectionIdSchema),
  pageSize: z.enum(['letter', 'a4']),
  updatedAt: z.string(),
})

export const resumeDocumentV1Schema = z.object({
  meta: documentMetaV1Schema,
  contact: contactSchema,
  summary: z.string(),
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
})

export function safeParseV1(data: unknown) {
  return resumeDocumentV1Schema.safeParse(data)
}

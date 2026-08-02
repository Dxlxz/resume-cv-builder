import { z } from 'zod'
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { createId } from '@rb/core/utils'

export const sectionIdSchema = z.enum([
  'contact',
  'summary',
  'experience',
  'education',
  'certifications',
  'skills',
  'projects',
  'volunteer',
  'references',
])

export const contactSchema = z.object({
  fullName: z.string(),
  headline: z.string().optional(),
  email: z.string(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedIn: z.string().optional(),
  website: z.string().optional(),
})

export const exportContactSchema = contactSchema.extend({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})

export const experienceItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  present: z.boolean(),
  bullets: z.array(z.string()),
})

export const educationItemSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  honors: z.string().optional(),
})

export const skillGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(z.string()),
})

export const projectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()),
})

export const certificationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  completed: z.string().optional(),
  verifyUrl: z.string().optional(),
})

export const referenceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  company: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
})

export const sectionsSchema = {
  contact: contactSchema,
  summary: z.string(),
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  certifications: z.array(certificationItemSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  volunteer: z.array(experienceItemSchema),
  references: z.array(referenceItemSchema),
}

export function isSectionEmpty(
  document: ResumeDocument,
  sectionId: SectionId,
): boolean {
  switch (sectionId) {
    case 'contact':
      return !document.contact.fullName.trim() && !document.contact.email.trim()
    case 'summary':
      return !document.summary.trim()
    case 'experience':
      return document.experience.length === 0
    case 'education':
      return document.education.length === 0
    case 'certifications':
      return document.certifications.length === 0
    case 'skills':
      return (
        document.skills.length === 0 ||
        document.skills.every((g) => g.items.every((i) => !i.trim()))
      )
    case 'projects':
      return document.projects.length === 0
    case 'volunteer':
      return document.volunteer.length === 0
    case 'references':
      return document.references.length === 0
    default:
      return true
  }
}

export function createEmptyExperience(): ResumeDocument['experience'][0] {
  return {
    id: createId(),
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    present: false,
    bullets: [''],
  }
}

export function createEmptyVolunteer(): ResumeDocument['volunteer'][0] {
  return createEmptyExperience()
}

export function createEmptyEducation(): ResumeDocument['education'][0] {
  return {
    id: createId(),
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    honors: '',
  }
}

export function createEmptySkillGroup(): ResumeDocument['skills'][0] {
  return { id: createId(), name: '', items: [''] }
}

export function createEmptyProject(): ResumeDocument['projects'][0] {
  return {
    id: createId(),
    name: '',
    url: '',
    description: '',
    bullets: [''],
  }
}

export function createEmptyCertification(): ResumeDocument['certifications'][0] {
  return {
    id: createId(),
    name: '',
    issuer: '',
    completed: '',
    verifyUrl: '',
  }
}

export function createEmptyReference(): ResumeDocument['references'][0] {
  return {
    id: createId(),
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
  }
}

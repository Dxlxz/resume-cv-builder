import type { ResumeDocument } from '@rb/core/types/document'

export interface TemplateDefinition {
  id: ResumeDocument['meta']['templateId']
  name: string
  description: string
  atsOptimized: boolean
}

export const TEMPLATES: Record<ResumeDocument['meta']['templateId'], TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean centered header, ideal for resumes',
    atsOptimized: false,
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional CV layout with education emphasis',
    atsOptimized: false,
  },
  'ats-strict': {
    id: 'ats-strict',
    name: 'ATS Strict',
    description: 'Single column, standard headers — best for JobStreet & ATS',
    atsOptimized: true,
  },
  'modern-rail': {
    id: 'modern-rail',
    name: 'Modern Rail',
    description: 'Dates in a left gutter, accent section bars, skills grid',
    atsOptimized: true,
  },
  banner: {
    id: 'banner',
    name: 'Banner',
    description: 'Full-width colour header, single reading column beneath',
    atsOptimized: true,
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATES)

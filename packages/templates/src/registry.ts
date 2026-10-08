import type { ResumeDocument } from '@rb/core/types/document'

export interface TemplateDefinition {
  id: ResumeDocument['meta']['templateId']
  name: string
  description: string
  atsOptimized: boolean
  /** Reading columns on the page. Two columns keep chronology in the main column. */
  columns: 1 | 2
}

export const TEMPLATES: Record<ResumeDocument['meta']['templateId'], TemplateDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean centered header, ideal for resumes',
    atsOptimized: false,
    columns: 1,
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional CV layout with education emphasis',
    atsOptimized: false,
    columns: 1,
  },
  'ats-strict': {
    id: 'ats-strict',
    name: 'ATS Strict',
    description: 'Single column, standard headers — best for JobStreet & ATS',
    atsOptimized: true,
    columns: 1,
  },
  'modern-rail': {
    id: 'modern-rail',
    name: 'Modern Rail',
    description: 'Dates in a left gutter, accent section bars, skills grid',
    atsOptimized: true,
    columns: 1,
  },
  banner: {
    id: 'banner',
    name: 'Banner',
    description: 'Full-width colour header, single reading column beneath',
    atsOptimized: true,
    columns: 1,
  },
  ivy: {
    id: 'ivy',
    name: 'Ivy',
    description: 'Serif, centered name, ruled headings. Dense and calm, like a Harvard page',
    atsOptimized: true,
    columns: 1,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'One-page density: small margins, tight spacing, inline rules',
    atsOptimized: true,
    columns: 1,
  },
  split: {
    id: 'split',
    name: 'Split',
    description: 'Main column first, then a narrow right rail for skills and certificates',
    // Two columns: see the sidebar entry. ats-strict remains the portal choice.
    atsOptimized: false,
    columns: 2,
  },
  sidebar: {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Tinted rail for contact and skills, chronology in the main column',
    // Two columns are a reading-order risk for some parsers — see the
    // template profile comment. Use ats-strict for portal submissions.
    atsOptimized: false,
    columns: 2,
  },
  executive: {
    id: 'executive',
    name: 'Executive',
    description: 'Serif, ruled headings, dates in a left gutter. Formal and senior',
    atsOptimized: true,
    columns: 1,
  },
  harbor: {
    id: 'harbor',
    name: 'Harbor',
    description: 'Centered name, headings on soft shaded bars, skills grid',
    atsOptimized: true,
    columns: 1,
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    description: 'Dark full-height rail for name, contact and skills; chronology in the main column',
    // Two columns, like sidebar: ats-strict stays the portal choice.
    atsOptimized: false,
    columns: 2,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Wide margins, large name, no rules. Quiet and airy',
    atsOptimized: true,
    columns: 1,
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATES)

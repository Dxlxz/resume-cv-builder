import { z } from 'zod'
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { createId } from '@rb/core/utils'

/**
 * Idrizz edit plans: typed JSON the AI returns. Parsed strictly (unknown
 * top-level keys rejected), applied as a pure reducer so a hallucinated
 * field can never corrupt a document.
 */

const bulletDraft = z.object({
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  present: z.boolean().optional(),
  bullets: z.array(z.string()).optional(),
})

const skillGroupDraft = z.object({
  name: z.string(),
  items: z.array(z.string()),
})

const educationDraft = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  honors: z.string().optional(),
})

const certificationDraft = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  completed: z.string().optional(),
})

const projectDraft = z.object({
  name: z.string(),
  url: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).optional(),
})

const volunteerDraft = z.object({
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  present: z.boolean().optional(),
  bullets: z.array(z.string()).optional(),
})

const referenceDraft = z.object({
  name: z.string(),
  title: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
})

const idPatch = z.object({
  id: z.string(),
  patch: z.record(z.string(), z.unknown()),
})

const sectionOps = z.object({
  add: z.array(bulletDraft).optional(),
  edit: z.array(idPatch).optional(),
  remove: z.array(z.string()).optional(),
})

const sectionId = z.enum([
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

export const aiEditPlanSchema = z
  .object({
    summary: z.string().optional(),
    experience: sectionOps.optional(),
    education: z
      .object({
        add: z.array(educationDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    certifications: z
      .object({
        add: z.array(certificationDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    skills: z
      .object({
        add: z.array(skillGroupDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    projects: z
      .object({
        add: z.array(projectDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    volunteer: z
      .object({
        add: z.array(volunteerDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    references: z
      .object({
        add: z.array(referenceDraft).optional(),
        edit: z.array(idPatch).optional(),
        remove: z.array(z.string()).optional(),
      })
      .optional(),
    sections: z
      .object({
        hide: z.array(sectionId).optional(),
        show: z.array(sectionId).optional(),
      })
      .optional(),
  })
  .strict()

export type AiEditPlan = z.infer<typeof aiEditPlanSchema>

/**
 * True when the plan would actually change something: non-empty summary,
 * any non-empty add/edit/remove array, or any section hide/show. Empty
 * plans ({} or only empty ops) are treated as "no effects" - the chat
 * shows a helpful message instead of an empty review card.
 */
export function aiEditPlanHasEffects(plan: AiEditPlan): boolean {
  if (plan.summary !== undefined && plan.summary.trim().length > 0) return true
  if (plan.sections && (plan.sections.hide?.length || plan.sections.show?.length)) return true
  const sections: (keyof Omit<AiEditPlan, 'summary' | 'sections'>)[] = [
    'experience',
    'education',
    'certifications',
    'skills',
    'projects',
    'volunteer',
    'references',
  ]
  return sections.some((key) => {
    const ops = plan[key]
    if (!ops) return false
    return Boolean(
      (ops.add !== undefined && ops.add.length > 0) ||
        (ops.edit !== undefined && ops.edit.length > 0) ||
        (ops.remove !== undefined && ops.remove.length > 0),
    )
  })
}

const KNOWN_EXPERIENCE_KEYS = [
  'title',
  'company',
  'location',
  'startDate',
  'endDate',
  'present',
  'bullets',
] as const
const KNOWN_EDUCATION_KEYS = ['institution', 'degree', 'field', 'startDate', 'endDate', 'honors'] as const
const KNOWN_CERTIFICATION_KEYS = ['name', 'issuer', 'completed'] as const
const KNOWN_SKILL_KEYS = ['name', 'items'] as const
const KNOWN_PROJECT_KEYS = ['name', 'url', 'description', 'bullets'] as const
const KNOWN_VOLUNTEER_KEYS = [
  'title',
  'company',
  'location',
  'startDate',
  'endDate',
  'present',
  'bullets',
] as const
const KNOWN_REFERENCE_KEYS = ['name', 'title', 'company', 'phone', 'email'] as const

function pickKnown(
  patch: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in patch) out[key] = patch[key]
  }
  return out
}

function applySectionOps<T extends { id: string }>(
  items: T[],
  ops: { add?: unknown[]; edit?: { id: string; patch: Record<string, unknown> }[]; remove?: string[] },
  keys: readonly string[],
  make: (draft: Record<string, unknown>) => T,
): T[] {
  let next = [...items]
  if (ops.remove?.length) {
    const removed = new Set(ops.remove)
    next = next.filter((item) => !removed.has(item.id))
  }
  if (ops.edit?.length) {
    next = next.map((item) => {
      const patch = ops.edit!.find((p) => p.id === item.id)
      return patch ? { ...item, ...pickKnown(patch.patch, keys) } : item
    })
  }
  if (ops.add?.length) {
    for (const draft of ops.add) {
      next = [...next, make(draft as Record<string, unknown>)]
    }
  }
  return next
}

function draftItem(d: Record<string, unknown>): { id: string } & Record<string, unknown> {
  return { id: createId(), ...d }
}

function withBullets<T extends { bullets?: string[] }>(item: T): T {
  if (!Array.isArray(item.bullets)) item.bullets = []
  return item
}

/**
 * Applies a validated edit plan to a document. Pure: returns a new
 * document, never mutates the input. Unknown patch fields are dropped.
 */
export function applyAiEditPlan(
  document: ResumeDocument,
  plan: AiEditPlan,
): ResumeDocument {
  const next: ResumeDocument = {
    ...document,
    meta: { ...document.meta, hiddenSections: [...document.meta.hiddenSections] },
  }

  if (plan.summary !== undefined) next.summary = plan.summary

  if (plan.experience) {
    next.experience = applySectionOps(
      document.experience,
      plan.experience,
      KNOWN_EXPERIENCE_KEYS,
      (d) => withBullets(draftItem(d) as unknown as ResumeDocument['experience'][number]),
    )
  }
  if (plan.education) {
    next.education = applySectionOps(
      document.education,
      plan.education,
      KNOWN_EDUCATION_KEYS,
      (d) => draftItem(d) as unknown as ResumeDocument['education'][number],
    )
  }
  if (plan.certifications) {
    next.certifications = applySectionOps(
      document.certifications,
      plan.certifications,
      KNOWN_CERTIFICATION_KEYS,
      (d) => draftItem(d) as unknown as ResumeDocument['certifications'][number],
    )
  }
  if (plan.skills) {
    next.skills = applySectionOps(
      document.skills,
      plan.skills,
      KNOWN_SKILL_KEYS,
      (d) => draftItem(d) as unknown as ResumeDocument['skills'][number],
    )
  }
  if (plan.projects) {
    next.projects = applySectionOps(
      document.projects,
      plan.projects,
      KNOWN_PROJECT_KEYS,
      (d) => withBullets(draftItem(d) as unknown as ResumeDocument['projects'][number]),
    )
  }
  if (plan.volunteer) {
    next.volunteer = applySectionOps(
      document.volunteer,
      plan.volunteer,
      KNOWN_VOLUNTEER_KEYS,
      (d) => withBullets(draftItem(d) as unknown as ResumeDocument['volunteer'][number]),
    )
  }
  if (plan.references) {
    next.references = applySectionOps(
      document.references,
      plan.references,
      KNOWN_REFERENCE_KEYS,
      (d) => draftItem(d) as unknown as ResumeDocument['references'][number],
    )
  }

  if (plan.sections) {
    const hidden = new Set<SectionId>(document.meta.hiddenSections)
    plan.sections.hide?.forEach((section) => hidden.add(section))
    plan.sections.show?.forEach((section) => hidden.delete(section))
    next.meta.hiddenSections = [...hidden]
  }

  return next
}

/** Strips markdown fences and parses the model's JSON reply into a plan. */
export function parseAiEditPlan(text: string): AiEditPlan | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```$/m, '')
    .trim()
  if (!cleaned) return null
  try {
    const parsed: unknown = JSON.parse(cleaned)
    const result = aiEditPlanSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/** Maximum context length the AI proxy accepts (see api/ai-impl.ts). */
export const MAX_AI_CONTEXT_CHARS = 80_000

/** Compact document view sent to the model so it can reference real ids. */
export function buildDocumentContext(document: ResumeDocument): string {
  const context = {
    meta: {
      documentType: document.meta.documentType,
      presetId: document.meta.presetId,
      sectionOrder: document.meta.sectionOrder,
      hiddenSections: document.meta.hiddenSections,
      sectionGuides: document.meta.sectionGuides,
    },
    summary: document.summary,
    experience: document.experience.map((e) => ({
      id: e.id,
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      present: e.present,
      bullets: e.bullets,
    })),
    education: document.education,
    certifications: document.certifications,
    skills: document.skills,
    projects: document.projects,
    volunteer: document.volunteer,
    references: document.references,
  }
  const json = JSON.stringify(context)
  if (json.length > MAX_AI_CONTEXT_CHARS) {
    throw new Error('Document context is too large for the AI service.')
  }
  return json
}

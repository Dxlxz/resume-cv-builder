import { describe, expect, it } from 'vitest'
import {
  applyAiEditPlan,
  buildDocumentContext,
  parseAiEditPlan,
} from '@/lib/ai/edits'
import { sampleResumeDocument } from '@rb/fixtures'
import type { ResumeDocument } from '@rb/core/types/document'

describe('parseAiEditPlan', () => {
  it('parses plain JSON', () => {
    const plan = parseAiEditPlan('{"summary":"New summary."}')
    expect(plan?.summary).toBe('New summary.')
  })

  it('parses JSON inside markdown fences', () => {
    const plan = parseAiEditPlan('```json\n{"summary":"New summary."}\n```')
    expect(plan?.summary).toBe('New summary.')
  })

  it('rejects invalid JSON', () => {
    expect(parseAiEditPlan('not json at all')).toBeNull()
  })

  it('rejects unknown top-level keys', () => {
    expect(parseAiEditPlan('{"summary":"x","deleteEverything":true}')).toBeNull()
  })
})

describe('applyAiEditPlan', () => {
  it('rewrites the summary', () => {
    const doc = applyAiEditPlan(sampleResumeDocument, { summary: 'Tighter.' })
    expect(doc.summary).toBe('Tighter.')
  })

  it('adds an experience role with an id', () => {
    const doc = applyAiEditPlan(sampleResumeDocument, {
      experience: {
        add: [{ title: 'Intern', company: 'NewCo', bullets: ['Did things'] }],
      },
    })
    expect(doc.experience).toHaveLength(sampleResumeDocument.experience.length + 1)
    const added = doc.experience.at(-1)
    expect(added?.title).toBe('Intern')
    expect(added?.id).toBeTruthy()
    expect(added?.bullets).toEqual(['Did things'])
  })

  it('removes roles by id', () => {
    const target = sampleResumeDocument.experience[0]
    const doc = applyAiEditPlan(sampleResumeDocument, {
      experience: { remove: [target.id] },
    })
    expect(doc.experience.some((e) => e.id === target.id)).toBe(false)
  })

  it('edits only known patch fields', () => {
    const target = sampleResumeDocument.experience[0]
    const doc = applyAiEditPlan(sampleResumeDocument, {
      experience: {
        edit: [{ id: target.id, patch: { title: 'Senior Engineer', deleteMe: true } }],
      },
    })
    const edited = doc.experience.find((e) => e.id === target.id)
    expect(edited?.title).toBe('Senior Engineer')
    expect(edited && 'deleteMe' in edited).toBe(false)
  })

  it('adds and removes skill groups', () => {
    const target = sampleResumeDocument.skills[0]
    const doc = applyAiEditPlan(sampleResumeDocument, {
      skills: {
        add: [{ name: 'Languages', items: ['English'] }],
        remove: [target.id],
      },
    })
    expect(doc.skills.some((g) => g.id === target.id)).toBe(false)
    expect(doc.skills.some((g) => g.name === 'Languages' && g.items[0] === 'English')).toBe(true)
  })

  it('hides and shows sections', () => {
    const doc = applyAiEditPlan(sampleResumeDocument, {
      sections: { hide: ['volunteer'], show: ['projects'] },
    })
    expect(doc.meta.hiddenSections).toContain('volunteer')
    expect(doc.meta.hiddenSections).not.toContain('projects')
  })

  it('does not mutate the input document', () => {
    const before = JSON.stringify(sampleResumeDocument)
    applyAiEditPlan(sampleResumeDocument, { summary: 'Changed.' })
    expect(JSON.stringify(sampleResumeDocument)).toBe(before)
  })
})

describe('buildDocumentContext', () => {
  it('includes item ids so the model can reference them', () => {
    const context = buildDocumentContext(sampleResumeDocument)
    const parsed = JSON.parse(context) as ResumeDocument
    expect(parsed.experience[0].id).toBe(sampleResumeDocument.experience[0].id)
    expect(parsed.skills.length).toBe(sampleResumeDocument.skills.length)
  })

  it('includes section order and section guides so the model knows the sections', () => {
    const guided = {
      ...sampleResumeDocument,
      meta: {
        ...sampleResumeDocument.meta,
        sectionOrder: ['summary', 'experience'] as ResumeDocument['meta']['sectionOrder'],
        sectionGuides: { summary: 'British English, 2-4 sentences.' },
      },
    }
    const context = buildDocumentContext(guided)
    const parsed = JSON.parse(context) as ResumeDocument
    expect(parsed.meta.sectionOrder).toEqual(['summary', 'experience'])
    expect(parsed.meta.sectionGuides).toEqual({ summary: 'British English, 2-4 sentences.' })
  })
})

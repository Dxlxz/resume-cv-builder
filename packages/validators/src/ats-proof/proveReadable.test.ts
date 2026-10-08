/**
 * @vitest-environment node
 *
 * F-007 AC-3/AC-4: the builder proves its own PDF is readable. Rendered with the react-pdf pipeline here (node); the
 * Typst output is proved by the same checker in packages/typst.
 */
import { describe, expect, it } from 'vitest'
import type { ResumeDocument } from '@rb/core/types/document'
import { sampleResumeDocument } from '@rb/fixtures'
import { renderDocumentToPdf } from '@rb/pipeline/renderDocumentToPdf'
import { findingsToIssues, proveReadable } from '@rb/validators/ats-proof/proveReadable'
import { checkExtraction, extractPdfText } from '@rb/validators/ats-proof/extractPdfText'

describe('proveReadable', () => {
  it('passes a document against its own PDF', async () => {
    const pdf = await renderDocumentToPdf(sampleResumeDocument)
    expect(await proveReadable(pdf, sampleResumeDocument)).toEqual([])
  }, 60000)

  it('raises one ATS risk when visible text is missing from the PDF (AC-3)', async () => {
    const pdf = await renderDocumentToPdf(sampleResumeDocument)
    const extra: ResumeDocument = {
      ...sampleResumeDocument,
      experience: [
        ...sampleResumeDocument.experience,
        { ...sampleResumeDocument.experience[0], id: 'x', title: 'Chief Zebra Officer', company: 'Quokka Holdings', bullets: ['Herded zebras across the savannah daily.'] },
      ],
    }
    const issues = await proveReadable(pdf, extra)
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ level: 'warning', code: 'PDF_TEXT_MISSING' })
    expect(issues[0].message).toContain('Chief Zebra Officer')
  }, 60000)

  it('does not count a hidden section as lost (AC-4)', async () => {
    const hidden: ResumeDocument = {
      ...sampleResumeDocument,
      meta: { ...sampleResumeDocument.meta, hiddenSections: ['education', 'projects'] },
    }
    const pdf = await renderDocumentToPdf(hidden)
    expect(await proveReadable(pdf, hidden)).toEqual([])
  }, 60000)

  it('does not count bullets cut by the preset cap as lost (AC-4)', async () => {
    const role = sampleResumeDocument.experience[0]
    const long: ResumeDocument = {
      ...sampleResumeDocument,
      meta: { ...sampleResumeDocument.meta, presetId: 'malaysia-corporate', documentType: 'resume' },
      experience: [{ ...role, bullets: Array.from({ length: 8 }, (_, i) => `Delivered outcome number ${i + 1} for a client team.`) }],
    }
    const pdf = await renderDocumentToPdf(long)
    expect(await proveReadable(pdf, long)).toEqual([])
  }, 60000)
})

describe('findingsToIssues', () => {
  it('groups findings into one risk per kind, with an example', () => {
    const issues = findingsToIssues([
      { kind: 'hyphen-split', detail: 'in- house' },
      { kind: 'hyphen-split', detail: 'third- party' },
      { kind: 'reading-order', detail: 'Software Engineer' },
    ])
    expect(issues.map((i) => i.code)).toEqual(['PDF_BROKEN_WORD', 'PDF_READING_ORDER'])
    expect(issues.every((i) => i.level === 'warning')).toBe(true)
    expect(issues[0].message).toContain('in- house')
  })
})

describe('raw-data proof (independent of the visibility and cap rules)', () => {
  it('finds every role, bullet, school, certificate and skill of the sample in its PDF', async () => {
    // Built straight from the data, not through groundTruthFor, so a section wrongly hidden or a cap set too low
    // in the shared rules still fails here.
    const doc = sampleResumeDocument
    const words = (text: string) => text.trim().split(/\s+/).slice(0, 5).join(' ')
    const fields = [
      doc.contact.fullName,
      ...doc.experience.flatMap((r) => [r.title, r.company, ...r.bullets.map(words)]),
      ...doc.education.flatMap((e) => [e.institution, e.degree]),
      ...doc.certifications.map((c) => c.name),
      ...doc.skills.flatMap((g) => g.items),
    ]
    const pdf = await renderDocumentToPdf(doc)
    const extracted = await extractPdfText(new Uint8Array(await pdf.arrayBuffer()))
    expect(checkExtraction(extracted, { fields, order: [] })).toEqual([])
  }, 60000)
})
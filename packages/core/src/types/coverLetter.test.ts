/**
 * @vitest-environment node
 *
 * Cover letters use the same engine as resumes: a document type, one extra
 * section, no new machinery. These tests hold that line — if a letter ever
 * needs its own renderer, this is where it will show.
 */
import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { safeParseV3 } from '@rb/core/schema/v3'
import { renderDocumentToPdf } from '@rb/pipeline/renderDocumentToPdf'
import { extractPdfText } from '@rb/validators/ats-proof/extractPdfText'
import { COVER_LETTER_SECTIONS, type ResumeDocument } from '@rb/core/types/document'

function letterDocument(): ResumeDocument {
  const base = createEmptyDocument('cover-letter')
  return {
    ...base,
    contact: {
      ...base.contact,
      fullName: 'Farah Lim',
      email: 'farah.lim@example.com',
      phone: '+60 12-345 6789',
    },
    letter: {
      date: '12 August 2026',
      recipientName: 'Ms Nurul Rahman',
      recipientTitle: 'Hiring Manager',
      company: 'Northwind Energy Sdn Bhd',
      companyAddress: 'Kuala Lumpur',
      salutation: 'Dear Ms Rahman,',
      paragraphs: [
        'I am writing about the Data Science Engagement Lead role.',
        'At Example Analytics I built the governed data platform behind three government dashboards.',
      ],
      closing: 'Yours sincerely,',
    },
  }
}

describe('cover letters', () => {
  it('creates with its own section set, not a trimmed resume', () => {
    const doc = createEmptyDocument('cover-letter')
    expect(doc.meta.documentType).toBe('cover-letter')
    expect(doc.meta.sectionOrder).toEqual(COVER_LETTER_SECTIONS)
    expect(doc.letter?.paragraphs).toHaveLength(2)
  })

  it('is accepted by the v3 schema', () => {
    expect(safeParseV3(letterDocument()).success).toBe(true)
  })

  it('leaves resumes and CVs without a letter section', () => {
    expect(createEmptyDocument('resume').letter).toBeUndefined()
    expect(createEmptyDocument('cv').letter).toBeUndefined()
    expect(safeParseV3(createEmptyDocument('resume')).success).toBe(true)
  })

  it('renders every part of the letter, in reading order', async () => {
    const doc = letterDocument()
    const blob = await renderDocumentToPdf(doc)
    const extracted = await extractPdfText(new Uint8Array(await blob.arrayBuffer()))
    const { text } = extracted

    for (const expected of [
      'Farah Lim',
      '12 August 2026',
      'Ms Nurul Rahman',
      'Northwind Energy Sdn Bhd',
      'Dear Ms Rahman,',
      'I am writing about the Data Science Engagement Lead role.',
      'Yours sincerely,',
    ]) {
      expect(text).toContain(expected)
    }

    // Order matters in a letter more than anywhere else.
    expect(text.indexOf('Dear Ms Rahman,')).toBeLessThan(
      text.indexOf('I am writing about the Data Science Engagement Lead role.'),
    )
    expect(text.indexOf('I am writing about the Data Science Engagement Lead role.')).toBeLessThan(
      text.indexOf('Yours sincerely,'),
    )
  }, 60000)

  it('falls back to a neutral salutation and closing', async () => {
    const doc = letterDocument()
    const blob = await renderDocumentToPdf({
      ...doc,
      letter: { ...doc.letter!, salutation: '', closing: '' },
    })
    const { text } = await extractPdfText(new Uint8Array(await blob.arrayBuffer()))
    expect(text).toContain('Dear Hiring Manager,')
    expect(text).toContain('Yours sincerely,')
  }, 60000)

  it('renders in every template', async () => {
    for (const templateId of ['classic', 'ats-strict', 'banner'] as const) {
      const doc = letterDocument()
      const blob = await renderDocumentToPdf({
        ...doc,
        meta: { ...doc.meta, templateId },
      })
      const { text } = await extractPdfText(new Uint8Array(await blob.arrayBuffer()))
      expect(text).toContain('Dear Ms Rahman,')
    }
  }, 90000)
})

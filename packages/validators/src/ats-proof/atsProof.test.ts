/**
 * @vitest-environment node
 *
 * ATS proof: render every template, read the text back with pdf.js, and assert
 * the document survived. Node environment is required — under jsdom react-pdf
 * corrupts the embedded font subset (see registerPdfFonts.test.ts).
 *
 * Method after RenderCV's ATS compatibility report (MIT): known ground truth,
 * independent extraction engine, every theme tested.
 */
import { describe, expect, it } from 'vitest'
import { TEMPLATE_IDS, type ResumeDocument, type TemplateId } from '@rb/core/types/document'
import { sampleCvDocument, sampleResumeDocument } from '@rb/fixtures'
import { renderDocumentToPdf } from '@rb/render/renderDocumentToPdf'
import { groundTruthFor } from '@rb/validators/ats-proof/groundTruth'
import { checkExtraction, extractPdfText } from '@rb/validators/ats-proof/extractPdfText'

/** Content a parser is most likely to mangle. */
const EDGE_CASES: ResumeDocument = {
  ...sampleResumeDocument,
  contact: {
    ...sampleResumeDocument.contact,
    fullName: 'Núria García-López',
    location: 'Kota Kinabalu, Sabah',
  },
  summary:
    'Analyst with a verification link at coursera.org/verify/KUV9ZOIPSDEV and a deliberately long ' +
    'single sentence that must wrap across several lines without breaking any word in half, ' +
    'because a hyphen inserted mid-token is exactly what corrupts an extracted URL.',
  experience: [
    {
      ...sampleResumeDocument.experience[0],
      title: 'Enginyer de Programari',
      company: 'Universitat de Barcelona',
      present: true,
      endDate: '',
      bullets: [
        'Maintained ETL pipelines in PostgreSQL, MSSQL and MySQL across three environments.',
        'Delivered dashboards with diacritics: Lünen, Đà Nẵng, Kraków — all must survive.',
      ],
    },
  ],
}

async function renderAndCheck(doc: ResumeDocument, templateId: TemplateId) {
  const scoped: ResumeDocument = { ...doc, meta: { ...doc.meta, templateId } }
  const blob = await renderDocumentToPdf(scoped)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const extracted = await extractPdfText(bytes)
  return { extracted, findings: checkExtraction(extracted, groundTruthFor(scoped)) }
}

describe('ATS proof', () => {
  for (const templateId of TEMPLATE_IDS) {
    describe(templateId, () => {
      it('keeps every resume field extractable, in reading order', async () => {
        const { findings, extracted } = await renderAndCheck(sampleResumeDocument, templateId)
        expect(extracted.pageCount).toBeGreaterThan(0)
        expect(findings).toEqual([])
      }, 60000)

      it('keeps every CV field extractable, in reading order', async () => {
        const { findings } = await renderAndCheck(sampleCvDocument, templateId)
        expect(findings).toEqual([])
      }, 60000)

      it('survives diacritics, a URL and an unterminated date range', async () => {
        const { findings, extracted } = await renderAndCheck(EDGE_CASES, templateId)
        // The URL is the specific regression: hyphenation used to split it.
        expect(extracted.text).toContain('coursera.org/verify/KUV9ZOIPSDEV')
        expect(findings).toEqual([])
      }, 60000)

      it('embeds a real font rather than relying on a viewer substitute', async () => {
        const { extracted } = await renderAndCheck(sampleResumeDocument, templateId)
        expect(extracted.fonts.length).toBeGreaterThan(0)
      }, 60000)
    })
  }

  it('reports a reading-order failure when anchors are out of sequence', () => {
    // Guards the guard: if this ever passes trivially, the suite is worthless.
    const findings = checkExtraction(
      { pageCount: 1, pages: ['Second First'], text: 'Second First', fonts: ['Carlito'] },
      { fields: [], order: ['First', 'Second'] },
    )
    expect(findings.some((f) => f.kind === 'reading-order')).toBe(true)
  })

  it('reports a hyphen split', () => {
    const findings = checkExtraction(
      { pageCount: 1, pages: ['coursera.org/veri- fy/ABC'], text: 'coursera.org/veri- fy/ABC', fonts: ['Carlito'] },
      { fields: [], order: [] },
    )
    expect(findings.some((f) => f.kind === 'hyphen-split')).toBe(true)
  })
})

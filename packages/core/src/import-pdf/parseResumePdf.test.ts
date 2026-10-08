/**
 * @vitest-environment node
 *
 * Round-trip: a PDF this app produced must import back. That is the strongest
 * available ground truth — we know exactly what went in, so anything missing is
 * a parser fault rather than an annotation argument. Node environment for the
 * same font reason as the rest of the render tests.
 */
import { describe, expect, it } from 'vitest'
import { sampleResumeDocument } from '@rb/fixtures'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { renderDocumentToPdf } from '@rb/pipeline/renderDocumentToPdf'
import { parseResumePdf, parseLines } from '@rb/core/import-pdf/parseResumePdf'
import { groupIntoLines, type TextItem } from '@rb/core/import-pdf/readPdfText'
import type { ResumeDocument, TemplateId } from '@rb/core/types/document'

async function importOwnExport(templateId: TemplateId) {
  const source: ResumeDocument = {
    ...sampleResumeDocument,
    meta: { ...sampleResumeDocument.meta, templateId },
  }
  const blob = await renderDocumentToPdf(source)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return { source, parsed: await parseResumePdf(bytes, createEmptyDocument('resume')) }
}

function item(text: string, x: number, y: number, height = 10): TextItem {
  return { text, x, y, width: text.length * 5, height, fontName: 'f1', pageIndex: 0 }
}

describe('PDF import', () => {
  it('recovers the essentials from an ats-strict export', async () => {
    const { source, parsed } = await importOwnExport('ats-strict')

    expect(parsed.document.contact.fullName).toBe(source.contact.fullName)
    expect(parsed.document.contact.email).toBe(source.contact.email)
    expect(parsed.foundSections).toContain('experience')
    expect(parsed.foundSections).toContain('education')

    // Every role title should come back, though the parser may split entries
    // differently than the document did.
    const titles = parsed.document.experience.map((role) => role.title).join(' | ')
    for (const role of source.experience) {
      expect(titles).toContain(role.title)
    }
  }, 60000)

  it('recovers the essentials from the classic template too', async () => {
    const { source, parsed } = await importOwnExport('classic')
    expect(parsed.document.contact.fullName).toBe(source.contact.fullName)
    expect(parsed.foundSections).toContain('experience')
  }, 60000)

  it('refuses a PDF with no text layer rather than guessing', async () => {
    // A valid, empty PDF: structurally fine, nothing to read.
    const empty = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    await expect(parseResumePdf(empty, createEmptyDocument('resume'))).rejects.toThrow()
  })

  describe('line assembly', () => {
    it('groups items on the same baseline and orders top-down', () => {
      const lines = groupIntoLines([
        item('World', 60, 700),
        item('Hello', 10, 700),
        item('Second line', 10, 680),
      ])
      expect(lines.map((l) => l.text)).toEqual(['Hello World', 'Second line'])
    })

    it('does not invent spaces inside a tight run', () => {
      const lines = groupIntoLines([item('Kota', 10, 700), item('Kinabalu', 31, 700)])
      // 'Kota' is 20pt wide starting at 10, so the next item begins 1pt later —
      // kerning, not a word gap.
      expect(lines[0].text).toBe('KotaKinabalu')
    })
  })

  describe('field extraction', () => {
    const base = createEmptyDocument('resume')

    it('reads a name, contact line and dated role', () => {
      const parsed = parseLines(
        groupIntoLines([
          item('Ada Lovelace', 10, 800, 18),
          item('ada@example.com · +60 12-345 6789', 10, 780),
          item('EXPERIENCE', 10, 750),
          item('Mathematician', 10, 730),
          item('Analytical Engine Co', 10, 715),
          item('Jan 2020 - Present', 400, 730),
          item('• Wrote the first algorithm.', 10, 700),
        ]),
        base,
      )

      expect(parsed.document.contact.fullName).toBe('Ada Lovelace')
      expect(parsed.document.contact.email).toBe('ada@example.com')
      expect(parsed.document.experience[0].title).toContain('Mathematician')
      expect(parsed.document.experience[0].present).toBe(true)
      expect(parsed.document.experience[0].startDate).toBe('2020-01')
      expect(parsed.document.experience[0].bullets).toEqual(['Wrote the first algorithm.'])
    })

    it('reads labelled skill groups', () => {
      const parsed = parseLines(
        groupIntoLines([
          item('Name', 10, 800, 18),
          item('SKILLS', 10, 700),
          item('Languages: Python, TypeScript, SQL', 10, 680),
        ]),
        base,
      )
      expect(parsed.document.skills[0].name).toBe('Languages')
      expect(parsed.document.skills[0].items).toEqual(['Python', 'TypeScript', 'SQL'])
    })

    it('closes a date range that has a real end', () => {
      const parsed = parseLines(
        groupIntoLines([
          item('Name', 10, 800, 18),
          item('EXPERIENCE', 10, 700),
          item('Analyst', 10, 680),
          item('Mar 2019 – Aug 2021', 400, 680),
        ]),
        base,
      )
      expect(parsed.document.experience[0].startDate).toBe('2019-03')
      expect(parsed.document.experience[0].endDate).toBe('2021-08')
      expect(parsed.document.experience[0].present).toBe(false)
    })
  })
})

/**
 * @vitest-environment node
 *
 * F-006 Typst engine: every template rendered by Typst must pass the same ATS proof as the react-pdf engine, and user
 * text must never be read as Typst markup or code.
 */
import { describe, expect, it } from 'vitest'
import { TEMPLATE_IDS, type ResumeDocument, type TemplateId } from '@rb/core/types/document'
import { themeForDocument } from '@rb/themes/registry'
import { sampleCvDocument, sampleResumeDocument } from '@rb/fixtures'
import { groundTruthFor } from '@rb/validators/ats-proof/groundTruth'
import { checkExtraction, extractPdfText } from '@rb/validators/ats-proof/extractPdfText'
import { documentToTypst, renderDocumentWithTypst, supportsTypst } from '@rb/typst/renderWithTypst'
import { layoutToTypst, typstString, typstText } from '@rb/typst/toTypst'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { resolveDocumentStyles } from '@rb/styles'

const ivy = (doc: ResumeDocument): ResumeDocument => ({ ...doc, meta: { ...doc.meta, templateId: 'ivy', themeId: 'academic-serif' } })

async function render(doc: ResumeDocument) {
  const blob = await renderDocumentWithTypst(doc)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  // pdf.js takes ownership of the buffer, so keep the raw text first.
  const raw = new TextDecoder('latin1').decode(bytes)
  return { raw, extracted: await extractPdfText(bytes) }
}

const EDGE: ResumeDocument = ivy({
  ...sampleResumeDocument,
  contact: { ...sampleResumeDocument.contact, fullName: 'Núria García-López', location: 'Kota Kinabalu, Sabah' },
  summary:
    'Analyst with a verification link at coursera.org/verify/KUV9ZOIPSDEV and a deliberately long single sentence that ' +
    'must wrap across several lines without breaking any word in half, because a hyphen inserted mid-token corrupts it.',
  experience: [
    {
      ...sampleResumeDocument.experience[0],
      title: 'Enginyer de Programari',
      company: 'Universitat de Barcelona',
      present: true,
      endDate: '',
      bullets: ['Delivered dashboards with diacritics: Lünen, Kraków — all must survive.'],
    },
  ],
})

describe('typstString', () => {
  it('escapes quotes, backslashes and newlines', () => {
    expect(typstString('a "b" \\c\nd')).toBe('"a \\"b\\" \\\\c\\nd"')
  })

  it('keeps tokens with an in-word hyphen unbreakable, and other text a plain string', () => {
    expect(typstText('in-house - x')).toBe('[#nobreak("in-house")#" "#"-"#" "#"x"]')
    expect(typstText('plain - text')).toBe('"plain - text"')
  })
})

describe('Typst trial (Ivy)', () => {
  it('covers every template', () => {
    for (const id of TEMPLATE_IDS) expect(supportsTypst(id)).toBe(true)
  })

  it('keeps every resume field extractable, in reading order', async () => {
    const doc = ivy(sampleResumeDocument)
    const { extracted } = await render(doc)
    expect(checkExtraction(extracted, groundTruthFor(doc))).toEqual([])
  }, 60000)

  it('keeps every CV field extractable, in reading order', async () => {
    const doc = ivy(sampleCvDocument)
    const { extracted } = await render(doc)
    expect(checkExtraction(extracted, groundTruthFor(doc))).toEqual([])
  }, 60000)

  it('survives diacritics, a URL and an unterminated date range', async () => {
    const { extracted } = await render(EDGE)
    expect(extracted.text).toContain('coursera.org/verify/KUV9ZOIPSDEV')
    expect(checkExtraction(extracted, groundTruthFor(EDGE))).toEqual([])
  }, 60000)

  it('prints markup and code characters literally', async () => {
    const hostile = '#strong[x] *bold* _it_ $x^2$ @ref <lbl> `raw` ] \\ "q" = - +'
    const doc = ivy({ ...sampleResumeDocument, summary: hostile })
    expect(documentToTypst(doc)).toContain(typstString(hostile))
    const { extracted } = await render(doc)
    const flat = extracted.text.replace(/\s+/g, ' ')
    expect(flat).toContain('#strong[x] *bold* _it_ $x^2$ @ref <lbl> `raw` ] \\ "q" = - +')
  }, 60000)

  it('writes a tagged PDF with a language, a title and embedded fonts', async () => {
    const { raw, extracted } = await render(ivy(sampleResumeDocument))
    expect(raw).toContain('/StructTreeRoot')
    expect(raw).toMatch(/\/Lang \(en\)/)
    expect(raw).toContain('/MarkInfo')
    expect(extracted.fonts.length).toBeGreaterThan(0)
  }, 60000)
})

const inTemplate = (doc: ResumeDocument, templateId: TemplateId): ResumeDocument => ({
  ...doc,
  meta: { ...doc.meta, templateId, themeId: themeForDocument(templateId, doc.meta.documentType, doc.meta.themeId) },
})

describe.each(TEMPLATE_IDS)('Typst ATS proof: %s', (templateId) => {
  it.each([
    ['resume', sampleResumeDocument],
    ['CV', sampleCvDocument],
    ['edge case', EDGE],
  ] as const)('keeps every %s field extractable, in reading order', async (_label, base) => {
    const doc = inTemplate(base, templateId)
    const { extracted } = await render(doc)
    expect(extracted.pageCount).toBeGreaterThan(0)
    expect(checkExtraction(extracted, groundTruthFor(doc))).toEqual([])
  }, 60000)
})

describe('Typst source details', () => {
  it('keeps the date rail on the lead-in of a long, fragmented item', () => {
    const long = {
      ...sampleResumeDocument.experience[0],
      bullets: Array.from({ length: 30 }, (_, i) => `Bullet number ${i + 1} describing a long piece of delivered work.`),
    }
    const doc = inTemplate({ ...sampleCvDocument, experience: [long] }, 'modern-rail')
    const layout = compileLayout(doc)
    const header = layout.blocks.find((b) => b.content.kind === 'itemHeader')
    expect(header).toBeDefined()
    const source = layoutToTypst({ ...layout, blocks: [header!] }, resolveDocumentStyles(doc), {
      title: 't', author: 'a', keywords: [], pageSize: 'a4', lang: 'en',
    })
    expect(source).toMatch(/railrow\(pal, /)
  })

  it('escapes the language code', () => {
    const doc = ivy(sampleResumeDocument)
    const evil = 'x", hyphenate: true) #read("/main.typ") //'
    const source = layoutToTypst(compileLayout(doc), resolveDocumentStyles(doc), {
      title: 't', author: 'a', keywords: [], pageSize: 'a4', lang: evil,
    })
    expect(source).toContain(`lang: ${typstString(evil)}`)
    // Inside the literal the quote is escaped, so the string never ends early.
    expect(source).not.toContain('lang: "x", hyphenate')
  })
})
import { describe, expect, it } from 'vitest'
import { sampleResumeDocument } from '@rb/fixtures'
import { THEME_IDS, type TemplateId } from '@rb/core/types/document'
import { themeForDocument } from '@rb/themes/registry'
import { inverseResolvedStyles, resolveDocumentStyles } from '@rb/styles/shared/resolveDocumentStyles'
import { contrastRatio } from '@rb/styles/shared/contrast'
import { parsePt } from '@rb/styles/shared/pt'

function inTemplate(templateId: TemplateId) {
  const { meta } = sampleResumeDocument
  return {
    ...sampleResumeDocument,
    meta: { ...meta, templateId, themeId: themeForDocument(templateId, meta.documentType, meta.themeId) },
  }
}

describe('shaded-bar section titles (harbor)', () => {
  const resolved = resolveDocumentStyles(inTemplate('harbor'))

  it('tints the title and pads it the same in the measured HTML and the PDF', () => {
    const { css, pdf, theme, layout } = resolved
    expect(pdf.sectionTitle.backgroundColor).toBe(theme.colors.border)
    expect(css.sectionTitle.backgroundColor).toBe(theme.colors.border)
    // The planner measures the HTML title; a padding mismatch would shift every page break.
    expect(parsePt(String(css.sectionTitle.paddingTop))).toBe(pdf.sectionTitle.paddingTop)
    expect(parsePt(String(css.sectionTitle.paddingBottom))).toBe(pdf.sectionTitle.paddingBottom)
    expect(parsePt(String(css.sectionTitle.paddingLeft))).toBe(pdf.sectionTitle.paddingLeft)
    expect(pdf.sectionTitle.paddingTop).toBe(layout.shadedBarPaddingPt)
    expect(pdf.sectionTitle.textAlign).toBe('center')
    expect(css.sectionTitle.textAlign).toBe('center')
  })

  it.each(THEME_IDS)('keeps the title readable on the bar with the %s theme', (themeId) => {
    const doc = { ...inTemplate('harbor'), meta: { ...inTemplate('harbor').meta, themeId } }
    const { colors } = resolveDocumentStyles(doc).theme
    expect(contrastRatio(colors.accent, colors.border)).toBeGreaterThanOrEqual(4.5)
  })

  it('leaves other decorations untinted', () => {
    const ivy = resolveDocumentStyles(inTemplate('ivy'))
    expect(ivy.pdf.sectionTitle.backgroundColor).toBeUndefined()
    expect(ivy.css.sectionTitle.backgroundColor).toBeUndefined()
  })
})

describe('inverse rail styles (slate)', () => {
  const resolved = resolveDocumentStyles(inTemplate('slate'))
  const inverse = inverseResolvedStyles(resolved)

  it('sets rail text in the paper colour on the accent', () => {
    expect(inverse.pdf.body.color).toBe(resolved.theme.colors.paper)
    expect(inverse.pdf.sectionTitle.color).toBe(resolved.theme.colors.paper)
    expect(inverse.theme.colors.paper).toBe(resolved.theme.colors.accent)
  })

  it('changes colours only, so the measured plan still holds', () => {
    expect(inverse.typography).toEqual(resolved.typography)
    expect(inverse.layout).toEqual(resolved.layout)
    expect(inverse.pdf.body.fontSize).toBe(resolved.pdf.body.fontSize)
    expect(inverse.pdf.sectionTitle.marginBottom).toBe(resolved.pdf.sectionTitle.marginBottom)
  })

  it('keeps every rail text colour readable on every theme', () => {
    for (const themeId of THEME_IDS) {
      const doc = { ...inTemplate('slate'), meta: { ...inTemplate('slate').meta, themeId } }
      const { colors } = inverseResolvedStyles(resolveDocumentStyles(doc)).theme
      expect(contrastRatio(colors.text, colors.paper)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(colors.textMuted, colors.paper)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

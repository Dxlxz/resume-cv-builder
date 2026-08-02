import { describe, expect, it } from 'vitest'
import {sampleCvDocument, sampleProfileDocument} from '@rb/fixtures'
import { parityDeltaPt, resolveDocumentStyles } from '@rb/styles/shared/resolveDocumentStyles'
import { parsePt } from '@rb/styles/shared/pt'
import { minPresenceForSection } from '@rb/templates/shared/spacingHelpers'

describe('resolveDocumentStyles', () => {
  it('applies Malaysia corporate compact density (preset overrides win)', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    expect(resolved.typography.bodySize).toBe(10)
    expect(resolved.typography.nameSize).toBe(16)
    expect(resolved.typography.sectionSize).toBe(11)
    expect(resolved.typography.lineHeight).toBe(1.32)
    expect(resolved.layout.pageMarginPt).toBe(40)
    expect(resolved.layout.sectionGapPt).toBe(12)
    expect(resolved.layout.sectionTitleGapPt).toBe(6)
    expect(resolved.layout.bulletGapPt).toBe(3)
    expect(resolved.layout.skillGroupGapPt).toBe(5)
    expect(resolved.layout.maxBulletsPerItem).toBe(3)
    expect(resolved.theme.colors.accent).toBe('#1F3864')
  })

  it('does not apply preset density or bullet caps to CV documents', () => {
    const resolved = resolveDocumentStyles(sampleCvDocument)
    // Academic template density, not the compact resume preset.
    expect(resolved.typography.bodySize).toBe(11)
    expect(resolved.typography.lineHeight).toBe(1.45)
    expect(resolved.layout.maxBulletsPerItem).toBeUndefined()
  })

  it('uses single-source section rhythm (no double section margins)', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    expect(resolved.css.section.marginBottom).toBe(0)
    expect(resolved.pdf.section.marginBottom).toBe(0)
    expect(resolved.css.sectionTitleFirst.marginTop).toBe(0)
    expect(resolved.pdf.sectionTitleFirst.marginTop).toBe(0)
    expect(resolved.css.sectionTitle.marginTop).toBe(0)
    expect(resolved.pdf.sectionTitle.marginTop).toBe(0)
  })

  it('uses A4 page dimensions for Malaysia preset', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    expect(resolved.page.size).toBe('a4')
    expect(resolved.page.widthMm).toBe(210)
    expect(resolved.page.heightMm).toBe(297)
  })

  it('merges classic template typography overrides', () => {
    // international-generic has no density overrides — template layer visible.
    const resolved = resolveDocumentStyles({
      ...sampleProfileDocument,
      meta: {
        ...sampleProfileDocument.meta,
        presetId: 'international-generic',
        templateId: 'classic',
      },
    })
    expect(resolved.typography.nameSize).toBe(20)
    expect(resolved.layout.headerAlign).toBe('center')
    expect(resolved.layout.sectionGapPt).toBe(18)
    expect(resolved.layout.headerGapPt).toBe(14)
  })

  it('merges academic template layout', () => {
    const resolved = resolveDocumentStyles({
      ...sampleProfileDocument,
      meta: {
        ...sampleProfileDocument.meta,
        presetId: 'international-generic',
        templateId: 'academic',
        themeId: 'academic-serif',
      },
    })
    expect(resolved.typography.bodySize).toBe(11)
    expect(resolved.typography.lineHeight).toBe(1.45)
    expect(resolved.layout.pageMarginPt).toBe(40)
    expect(resolved.layout.sectionTitleTransform).toBe('none')
  })

  it('keeps preview and PDF name/body sizes within 1pt', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    const cssName = parsePt(String(resolved.css.name.fontSize))
    const cssBody = parsePt(String(resolved.css.root.fontSize))
    expect(parityDeltaPt(String(resolved.css.name.fontSize), resolved.typography.nameSize)).toBeLessThanOrEqual(1)
    expect(parityDeltaPt(String(resolved.css.root.fontSize), resolved.typography.bodySize)).toBeLessThanOrEqual(1)
    expect(cssName).toBe(resolved.typography.nameSize)
    expect(cssBody).toBe(resolved.typography.bodySize)
    expect(resolved.pdf.name.fontSize).toBe(resolved.typography.nameSize)
    expect(resolved.pdf.page.fontSize).toBe(resolved.typography.bodySize)
    expect(resolved.pdf.page.fontFamily).toBe('Carlito')
    expect(resolved.pdf.name.fontFamily).toBe('Carlito')
    expect(resolved.pdf.name.fontWeight).toBe(700)
  })

  it('computes minPresenceAhead from typography tokens', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    const minPresence = minPresenceForSection(resolved.typography, resolved.layout)
    expect(minPresence).toBeGreaterThanOrEqual(50)
    expect(minPresence).toBeLessThanOrEqual(90)
  })

  it('uses spacing-only section titles for ATS Strict', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    expect(resolved.layout.sectionTitleDecoration).toBe('spacing-only')
    expect(resolved.pdf.sectionTitle.borderBottomWidth).toBe(0)
    expect(resolved.css.sectionTitle.borderBottomWidth).toBeUndefined()
  })

  it('applies compact header meta line spacing tokens', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    expect(resolved.layout.nameToMetaPt).toBe(5)
    expect(resolved.layout.metaLineGapPt).toBe(3)
    expect(resolved.layout.ruleToFirstSectionPt).toBe(10)
    expect(resolved.pdf.name.marginBottom).toBe(0)
    expect(resolved.pdf.meta.marginBottom).toBe(0)
    expect(resolved.pdf.meta.lineHeight).toBe(1.3)
  })
})

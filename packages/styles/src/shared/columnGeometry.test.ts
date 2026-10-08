import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT } from '@rb/themes/types'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { sampleResumeDocument } from '@rb/fixtures'
import { resolveDocumentStyles } from '@rb/styles'
import { columnGeometry } from './columnGeometry'

const A4_PT = 210 * (72 / 25.4)

describe('columnGeometry', () => {
  it('gives the same text width on either side of a rail', () => {
    const left = columnGeometry({ ...DEFAULT_LAYOUT, sidebarSide: 'left', sidebarWidthPt: 200 }, A4_PT)
    const right = columnGeometry({ ...DEFAULT_LAYOUT, sidebarSide: 'right', sidebarWidthPt: 200 }, A4_PT)
    expect(left.sideContentPt).toBe(right.sideContentPt)
    expect(left.mainContentPt).toBe(right.mainContentPt)
  })

  it('accounts for every point of the page: padding plus text equals the outer widths', () => {
    for (const sidebarSide of ['left', 'right'] as const) {
      const layout = { ...DEFAULT_LAYOUT, sidebarSide, sidebarRule: true, sidebarWidthPt: 206 }
      const g = columnGeometry(layout, A4_PT)
      const railText = g.railOuterPt - g.railPaddingLeftPt - g.railPaddingRightPt - 0.75
      expect(railText).toBeCloseTo(g.sideContentPt, 6)
      const mainOuter = A4_PT - g.railOuterPt
      expect(mainOuter - g.mainPaddingLeftPt - g.mainPaddingRightPt).toBeCloseTo(g.mainContentPt, 6)
    }
  })

  it.each(['sidebar', 'split', 'slate'] as const)('is what the %s plan measures at (AC-11 geometry)', (templateId) => {
    const doc = { ...sampleResumeDocument, meta: { ...sampleResumeDocument.meta, templateId } }
    const compiled = compileLayout(doc)
    const { layout } = resolveDocumentStyles(doc)
    const g = columnGeometry(layout, A4_PT)
    expect(compiled.columnWidthsPt?.side).toBeCloseTo(g.sideContentPt, 6)
    expect(compiled.columnWidthsPt?.main).toBeCloseTo(g.mainContentPt, 6)
  })
})

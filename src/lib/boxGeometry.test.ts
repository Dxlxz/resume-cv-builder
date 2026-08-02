import { describe, expect, it } from 'vitest'
import { pageBoxesForPlan } from '@/lib/boxGeometry'
import type { LayoutPlanResult, MeasuredBlock } from '@rb/layout/types'

function block(id: string, sectionId: MeasuredBlock['sectionId'], height: number): MeasuredBlock {
  return {
    id,
    sectionId,
    type: 'paragraph',
    breakPolicy: 'auto',
    spacingBeforePt: 0,
    spacingAfterPt: 0,
    content: { kind: 'paragraph', text: id },
    bbox: { x: 40, y: 0, width: 460, height },
  }
}

function planWith(blocks: MeasuredBlock[], slices: { blockId: string; pageIndex: number; yPt: number }[]): LayoutPlanResult {
  return {
    layout: { templateId: 'ats-strict', blocks: [], contentWidthPt: 500, contentHeightPt: 700 },
    measured: { blocks, totalHeightPt: 0, contentWidthPt: 500 },
    plan: {
      pageCount: 2,
      contentHeightPt: 700,
      contentWidthPt: 500,
      slices: slices.map((s) => ({ pageIndex: s.pageIndex, blockId: s.blockId, yPt: s.yPt })),
      breaks: [{ yPt: 300, pageIndex: 1, reason: 'auto experience-x' }],
      fillRatio: [1, 0.5],
    },
    blockHints: {},
  }
}

describe('pageBoxesForPlan', () => {
  const plan = planWith(
    [block('experience-x', 'experience', 100), block('summary-body', 'summary', 80)],
    [
      { blockId: 'experience-x', pageIndex: 0, yPt: 20 },
      { blockId: 'summary-body', pageIndex: 1, yPt: 10 },
    ],
  )

  it('maps slices to their page with exact pt-to-px scaling', () => {
    const page0 = pageBoxesForPlan(plan, 0, 2)
    expect(page0.boxes).toHaveLength(1)
    expect(page0.boxes[0]).toMatchObject({
      blockId: 'experience-x',
      sectionId: 'experience',
      x: 80,
      y: 40,
      width: 920,
      height: 200,
    })
  })

  it('groups boxes by page', () => {
    expect(pageBoxesForPlan(plan, 1, 1).boxes[0].blockId).toBe('summary-body')
    expect(pageBoxesForPlan(plan, 1, 1).boxes[0].y).toBe(10)
  })

  it('reports page share and fill ratio', () => {
    const page0 = pageBoxesForPlan(plan, 0, 1)
    expect(page0.boxes[0].share).toBeCloseTo(100 / 700)
    expect(page0.fillRatio).toBe(1)
    expect(pageBoxesForPlan(plan, 1, 1).fillRatio).toBe(0.5)
  })

  it('puts breaks on the page they cut', () => {
    const page0 = pageBoxesForPlan(plan, 0, 1)
    expect(page0.breaks).toHaveLength(1)
    expect(page0.breaks[0].yPt).toBe(300)
    expect(pageBoxesForPlan(plan, 1, 1).breaks).toHaveLength(0)
  })

  it('handles empty pages', () => {
    expect(pageBoxesForPlan(plan, 5, 1).boxes).toEqual([])
  })
})

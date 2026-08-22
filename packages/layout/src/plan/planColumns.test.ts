import { describe, expect, it } from 'vitest'
import type { MeasuredBlock } from '@rb/layout/types'
import { planColumns } from '@rb/layout/plan/planColumns'

function block(
  id: string,
  column: 'main' | 'side',
  height: number,
): MeasuredBlock {
  return {
    id,
    column,
    sectionId: 'experience',
    type: 'paragraph',
    breakPolicy: 'auto',
    spacingBeforePt: 0,
    spacingAfterPt: 0,
    content: { kind: 'paragraph', text: id },
    bbox: { x: 0, y: 0, width: 100, height },
  }
}

const WIDTHS = { side: 168, main: 325 }

describe('planColumns', () => {
  it('paginates each column independently', () => {
    const plan = planColumns(
      [
        // Main overflows onto a second page; the sidebar does not.
        block('m1', 'main', 400),
        block('m2', 'main', 400),
        block('s1', 'side', 100),
      ],
      500,
      WIDTHS,
    )

    expect(plan.pageCount).toBe(2)
    const m2 = plan.slices.find((s) => s.blockId === 'm2')
    const s1 = plan.slices.find((s) => s.blockId === 's1')
    expect(m2?.pageIndex).toBe(1)
    // The sidebar is short, so it stays on page 1 — it must not be dragged
    // along by the main column's break.
    expect(s1?.pageIndex).toBe(0)
  })

  it('is as long as the taller column', () => {
    const plan = planColumns(
      [block('m1', 'main', 100), block('s1', 'side', 400), block('s2', 'side', 400)],
      500,
      WIDTHS,
    )
    expect(plan.pageCount).toBe(2)
  })

  it('tags every slice with its column', () => {
    const plan = planColumns([block('m1', 'main', 10), block('s1', 'side', 10)], 500, WIDTHS)
    expect(plan.slices.map((s) => s.column).sort()).toEqual(['main', 'side'])
  })

  it('reports a fill ratio per page', () => {
    const plan = planColumns([block('m1', 'main', 250)], 500, WIDTHS)
    expect(plan.fillRatio).toHaveLength(1)
    expect(plan.fillRatio[0]).toBeCloseTo(0.5)
  })

  it('handles a document with no sidebar content', () => {
    const plan = planColumns([block('m1', 'main', 100)], 500, WIDTHS)
    expect(plan.pageCount).toBe(1)
    expect(plan.slices).toHaveLength(1)
  })
})

import { describe, expect, it } from 'vitest'
import type { BreakPolicy, MeasuredBlock } from '@rb/layout/types'
import {sampleProfileDocument} from '@rb/fixtures'
import { compileStandardLayout } from '@rb/layout/compile/compileStandardLayout'
import { measureLayout } from '@rb/layout/measure/measureLayout'
import { planPages } from '@rb/layout/plan/planPages'
import { resolveDocumentStyles } from '@rb/styles'

function fakeBlock(
  id: string,
  height: number,
  breakPolicy: BreakPolicy = 'auto',
  spacingBeforePt = 0,
  spacingAfterPt = 0,
): MeasuredBlock {
  return {
    id,
    sectionId: 'experience',
    type: breakPolicy === 'keepWithNext' ? 'sectionTitle' : 'paragraph',
    breakPolicy,
    spacingBeforePt,
    spacingAfterPt,
    content: { kind: 'paragraph', text: id },
    bbox: { x: 0, y: 0, width: 500, height },
  }
}

describe('planPages', () => {
  it('plans personal profile within 1–3 pages', async () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    const styles = resolveDocumentStyles(sampleProfileDocument)
    const measured = await measureLayout(layout, styles)
    const plan = planPages(measured.blocks, layout.contentHeightPt, layout.contentWidthPt)

    expect(plan.pageCount).toBeGreaterThanOrEqual(1)
    expect(plan.pageCount).toBeLessThanOrEqual(3)
    expect(plan.slices.length).toBe(layout.blocks.length)
    expect(plan.slices.every((s) => s.yPt >= 0)).toBe(true)
    expect(plan.fillRatio.length).toBe(plan.pageCount)
  })

  it('avoids orphan section titles when possible', async () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    const styles = resolveDocumentStyles(sampleProfileDocument)
    const measured = await measureLayout(layout, styles)
    const plan = planPages(measured.blocks, layout.contentHeightPt, layout.contentWidthPt)

    for (const slice of plan.slices.filter((s) => s.blockId.endsWith('-title'))) {
      const titleIdx = plan.slices.findIndex((s) => s.blockId === slice.blockId)
      const next = plan.slices[titleIdx + 1]
      if (!next) continue
      if (slice.pageIndex !== next.pageIndex) {
        expect(plan.breaks.some((b) => b.reason.includes(slice.blockId))).toBe(true)
      }
    }
  })

  it('collapses spacingBefore at the top of a new page', () => {
    const blocks = [
      fakeBlock('a', 650),
      fakeBlock('b-title', 20, 'keepWithNext', 16),
      fakeBlock('c', 100),
    ]
    const plan = planPages(blocks, 700, 500)

    expect(plan.pageCount).toBe(2)
    const titleSlice = plan.slices.find((s) => s.blockId === 'b-title')
    expect(titleSlice?.pageIndex).toBe(1)
    // The 16pt section gap is dropped at the top of page 2.
    expect(titleSlice?.yPt).toBe(0)
  })

  it('breaks before keepWithNext block when only the title would fit', () => {
    // Title fits at the bottom (650 + 16 + 20 = 686 ≤ 700) but its peek of the
    // next block does not — the title must move to the next page.
    const blocks = [
      fakeBlock('a', 650),
      fakeBlock('b-title', 20, 'keepWithNext', 16),
      fakeBlock('c', 200),
    ]
    const plan = planPages(blocks, 700, 500, { keepWithNextPeekPt: 30 })

    expect(plan.slices.find((s) => s.blockId === 'b-title')?.pageIndex).toBe(1)
    expect(plan.breaks.some((b) => b.reason.includes('b-title'))).toBe(true)
  })

  it('does not break a keepWithNext block when title plus peek fit', () => {
    // 600 + 16 + 20 + min(200, 30) = 666 ≤ 700 — title stays on page 1 even
    // though the full next block would not fit (capped peek, not full pairing).
    const blocks = [
      fakeBlock('a', 600),
      fakeBlock('b-title', 20, 'keepWithNext', 16),
      fakeBlock('c', 200),
    ]
    const plan = planPages(blocks, 700, 500, { keepWithNextPeekPt: 30 })

    expect(plan.slices.find((s) => s.blockId === 'b-title')?.pageIndex).toBe(0)
  })

  it('keeps the widow-guard bullet with the last bullet of a fragmented item', () => {
    // Penultimate bullet is keepWithNext: if the last bullet cannot fit after
    // it, both move — the last bullet is never alone on a page.
    const blocks = [
      fakeBlock('a', 650),
      fakeBlock('item-b0', 20),
      fakeBlock('item-b1', 20, 'keepWithNext'),
      fakeBlock('item-b2', 20),
    ]
    const plan = planPages(blocks, 700, 500, { keepWithNextPeekPt: 30 })

    // b1 alone would fit on page 1 (670 + 20 = 690 ≤ 700), but with its peek
    // of b2 it does not — both must land on page 2 together.
    const b1 = plan.slices.find((s) => s.blockId === 'item-b1')
    const b2 = plan.slices.find((s) => s.blockId === 'item-b2')
    expect(b1?.pageIndex).toBe(1)
    expect(b2?.pageIndex).toBe(1)
  })
})

import type { MeasuredBlock, PageBreak, PagePlan, PageSlice } from '@rb/layout/types'

export interface PlanPagesOptions {
  /**
   * How much of the next block a keepWithNext block must bring onto its page
   * (pt). Capped peek instead of the full next block, so a title followed by a
   * long item does not force an early break and a half-empty page.
   */
  keepWithNextPeekPt?: number
}

const DEFAULT_KEEP_WITH_NEXT_PEEK_PT = 30

export function planPages(
  blocks: MeasuredBlock[],
  contentHeightPt: number,
  contentWidthPt: number,
  options: PlanPagesOptions = {},
): PagePlan {
  if (blocks.length === 0 || contentHeightPt <= 0) {
    return {
      pageCount: 1,
      contentHeightPt,
      contentWidthPt,
      slices: [],
      breaks: [],
      fillRatio: [0],
    }
  }

  const peekPt = options.keepWithNextPeekPt ?? DEFAULT_KEEP_WITH_NEXT_PEEK_PT
  const slices: PageSlice[] = []
  const breaks: PageBreak[] = []
  const pageUsed: number[] = [0]

  let pageIndex = 0
  let yOnPage = 0

  const newPage = (reason: string, yPt: number) => {
    pageUsed[pageIndex] = yOnPage
    breaks.push({ yPt, pageIndex: pageIndex + 1, reason })
    pageIndex++
    pageUsed.push(0)
    yOnPage = 0
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const next = blocks[i + 1]
    // spacingBefore collapses at the top of a page — a section landing on a
    // fresh page starts at the margin, not margin + section gap.
    let top = yOnPage > 0 ? yOnPage + block.spacingBeforePt : yOnPage
    const blockHeight = block.bbox.height
    const totalBlock = blockHeight + block.spacingAfterPt

    if (block.breakPolicy === 'keepWithNext' && top > 0) {
      const nextPeek = next
        ? Math.min(next.bbox.height, peekPt) + next.spacingBeforePt
        : 0
      const needWithNext = blockHeight + block.spacingAfterPt + nextPeek
      if (top + needWithNext > contentHeightPt && blockHeight <= contentHeightPt) {
        newPage(`keep-with-next ${block.id}`, top)
        top = 0
      }
    } else if (
      top > 0 &&
      top + blockHeight > contentHeightPt &&
      block.breakPolicy === 'keep'
    ) {
      if (blockHeight <= contentHeightPt) {
        newPage(`keep ${block.id}`, top)
        top = 0
      }
    } else if (top > 0 && top + blockHeight > contentHeightPt && block.breakPolicy === 'auto') {
      newPage(`auto ${block.id}`, top)
      top = 0
    }

    slices.push({ pageIndex, blockId: block.id, yPt: top })
    yOnPage = top + totalBlock
  }

  pageUsed[pageIndex] = yOnPage

  const pageCount = pageIndex + 1
  const fillRatio = pageUsed.map((used) =>
    contentHeightPt > 0 ? Math.min(1, used / contentHeightPt) : 0,
  )

  return {
    pageCount: Math.max(1, pageCount),
    contentHeightPt,
    contentWidthPt,
    slices,
    breaks,
    fillRatio,
  }
}

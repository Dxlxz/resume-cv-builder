import type { ColumnId, MeasuredBlock, PagePlan } from '@rb/layout/types'
import { planPages, type PlanPagesOptions } from '@rb/layout/plan/planPages'

/**
 * Page planning for a two-column template.
 *
 * The columns are independent flows: the sidebar's content has nothing to do
 * with where the main column breaks, so each is planned on its own against the
 * same page height and the document is as long as the taller of the two.
 *
 * Planning them together — the naive approach — is what produces the classic
 * sidebar failure: the sidebar runs out on page 1, the main column continues,
 * and page 2 carries a full-height empty rail.
 */
export function planColumns(
  blocks: MeasuredBlock[],
  contentHeightPt: number,
  columnWidthsPt: Record<ColumnId, number>,
  options: PlanPagesOptions = {},
): PagePlan {
  const columns: ColumnId[] = ['side', 'main']
  const slices: PagePlan['slices'] = []
  const breaks: PagePlan['breaks'] = []
  const usedByPage: number[] = []

  let pageCount = 1

  for (const column of columns) {
    const columnBlocks = blocks.filter((block) => (block.column ?? 'main') === column)
    if (columnBlocks.length === 0) continue

    const plan = planPages(columnBlocks, contentHeightPt, columnWidthsPt[column], options)
    pageCount = Math.max(pageCount, plan.pageCount)

    for (const slice of plan.slices) {
      slices.push({ ...slice, column })
    }
    for (const pageBreak of plan.breaks) {
      breaks.push(pageBreak)
    }

    // Fill ratio reports how full each page is; with two columns the main one
    // is the meaningful signal, so take the larger per page.
    plan.fillRatio.forEach((ratio, pageIndex) => {
      usedByPage[pageIndex] = Math.max(usedByPage[pageIndex] ?? 0, ratio)
    })
  }

  const fillRatio = Array.from({ length: pageCount }, (_, i) => usedByPage[i] ?? 0)

  return {
    pageCount,
    contentHeightPt,
    contentWidthPt: columnWidthsPt.main + columnWidthsPt.side,
    slices,
    breaks,
    fillRatio,
  }
}

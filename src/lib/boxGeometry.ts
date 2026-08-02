import type { PageSlice, PageBreak, LayoutPlanResult } from '@rb/layout/types'
import type { SectionId } from '@rb/core/types/document'

export interface BoxRect {
  blockId: string
  sectionId: SectionId
  x: number
  y: number
  width: number
  height: number
  share: number
}

export interface PageBoxGeometry {
  pageIndex: number
  boxes: BoxRect[]
  breaks: PageBreak[]
  fillRatio: number
}

/**
 * Layout-plan geometry for one page, scaled from points to CSS pixels.
 * PDF units are points and the layout plan is in points, so the mapping
 * is exact: px = pt x scale.
 */
export function pageBoxesForPlan(
  plan: LayoutPlanResult,
  pageIndex: number,
  scale: number,
): PageBoxGeometry {
  const { measured, plan: pagePlan } = plan
  const blocksById = new Map(measured.blocks.map((b) => [b.id, b]))

  const boxes: BoxRect[] = pagePlan.slices
    .filter((slice: PageSlice) => slice.pageIndex === pageIndex)
    .map((slice) => {
      const block = blocksById.get(slice.blockId)
      if (!block) return null
      return {
        blockId: block.id,
        sectionId: block.sectionId,
        x: block.bbox.x * scale,
        y: slice.yPt * scale,
        width: block.bbox.width * scale,
        height: block.bbox.height * scale,
        share: pagePlan.contentHeightPt > 0 ? block.bbox.height / pagePlan.contentHeightPt : 0,
      }
    })
    .filter((box): box is BoxRect => box !== null)

  return {
    pageIndex,
    boxes,
    breaks: pagePlan.breaks.filter((b: PageBreak) => b.pageIndex - 1 === pageIndex),
    fillRatio: pagePlan.fillRatio[pageIndex] ?? 0,
  }
}

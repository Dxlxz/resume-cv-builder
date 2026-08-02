import type { LayoutBlockType, LayoutPlanResult } from '@rb/layout/types'
import { LAYOUT_DEBUG_COLORS } from '@rb/layout/debug/layoutDebugColors'

const PT_TO_PX = 96 / 72

export interface OverlayRect {
  blockId: string
  type: LayoutBlockType
  x: number
  y: number
  width: number
  height: number
  heightPt: number
}

export function layoutOverlayRects(
  planResult: LayoutPlanResult,
  pageIndex: number,
  pageWidthPx: number,
  marginPt: number,
): OverlayRect[] {
  const scale = pageWidthPx / planResult.plan.contentWidthPt
  const marginPx = marginPt * PT_TO_PX

  return planResult.plan.slices
    .filter((s) => s.pageIndex === pageIndex)
    .map((slice) => {
      const block = planResult.measured.blocks.find((b) => b.id === slice.blockId)
      if (!block) return null
      const widthPt = block.bbox.width > 0 ? block.bbox.width : planResult.plan.contentWidthPt
      return {
        blockId: block.id,
        type: block.type,
        x: marginPx,
        y: marginPx + slice.yPt * scale,
        width: widthPt * scale,
        height: block.bbox.height * scale,
        heightPt: block.bbox.height,
      }
    })
    .filter((r): r is OverlayRect => r !== null)
}

export function drawLayoutOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  planResult: LayoutPlanResult,
  pageIndex: number,
  pageWidthPx: number,
  pageHeightPx: number,
  marginPt: number,
): void {
  const rects = layoutOverlayRects(planResult, pageIndex, pageWidthPx, marginPt)
  const scale = pageWidthPx / planResult.plan.contentWidthPt
  const marginPx = marginPt * PT_TO_PX

  for (const rect of rects) {
    const color = LAYOUT_DEBUG_COLORS[rect.type] ?? 'rgba(100, 116, 139, 0.25)'
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)'
    ctx.lineWidth = 1
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    ctx.fillStyle = '#0f172a'
    ctx.font = '9px sans-serif'
    ctx.fillText(`${rect.blockId} (${Math.round(rect.heightPt)}pt)`, rect.x + 4, rect.y + 12)
  }

  for (const br of planResult.plan.breaks.filter((b) => b.pageIndex === pageIndex)) {
    const y = marginPx + br.yPt * scale
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(pageWidthPx, y)
    ctx.stroke()
    ctx.setLineDash([])
  }

  void pageHeightPx
}

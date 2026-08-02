import type { LayoutPlanResult } from '@rb/layout/types'
import { LAYOUT_DEBUG_COLORS } from '@rb/layout/debug/layoutDebugColors'
import { layoutOverlayRects } from '@rb/layout/debug/drawLayoutOverlay'

interface LayoutDebugOverlayProps {
  planResult: LayoutPlanResult
  pageIndex: number
  pageWidthPx: number
  pageHeightPx: number
  marginPt: number
}

export function LayoutDebugOverlay({
  planResult,
  pageIndex,
  pageWidthPx,
  pageHeightPx,
  marginPt,
}: LayoutDebugOverlayProps) {
  const scale = pageWidthPx / planResult.plan.contentWidthPt
  const rects = layoutOverlayRects(planResult, pageIndex, pageWidthPx, marginPt)
  const pageBreaks = planResult.plan.breaks.filter((b) => b.pageIndex === pageIndex)
  const marginPx = marginPt * (96 / 72)

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-20 h-full w-full"
      viewBox={`0 0 ${pageWidthPx} ${pageHeightPx}`}
      aria-hidden
    >
      {rects.map((rect) => (
        <g key={rect.blockId}>
          <rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={
              LAYOUT_DEBUG_COLORS[rect.type as keyof typeof LAYOUT_DEBUG_COLORS] ??
              'rgba(100, 116, 139, 0.25)'
            }
            stroke="rgba(15, 23, 42, 0.4)"
            strokeWidth={1}
          />
          <text x={rect.x + 4} y={rect.y + 12} fontSize={9} fill="#0f172a">
            {rect.blockId} ({Math.round(rect.heightPt)}pt)
          </text>
        </g>
      ))}
      {pageBreaks.map((br, i) => {
        const y = marginPx + br.yPt * scale
        return (
          <g key={`${br.reason}-${i}`}>
            <line
              x1={0}
              y1={y}
              x2={pageWidthPx}
              y2={y}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <text x={8} y={y - 4} fontSize={8} fill="#ef4444">
              {br.reason}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

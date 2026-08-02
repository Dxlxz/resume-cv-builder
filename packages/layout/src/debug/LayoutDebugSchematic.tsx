import type { LayoutPlanResult } from '@rb/layout/types'
import { LAYOUT_DEBUG_COLORS } from '@rb/layout/debug/layoutDebugColors'

interface LayoutDebugSchematicProps {
  planResult: LayoutPlanResult
  pageIndex: number
}

const MAX_BAR_PT = 120

export function LayoutDebugSchematic({ planResult, pageIndex }: LayoutDebugSchematicProps) {
  const { plan, measured } = planResult
  const contentHeight = plan.contentHeightPt || 1

  const blocks = plan.slices
    .filter((s) => s.pageIndex === pageIndex)
    .map((slice) => {
      const block = measured.blocks.find((b) => b.id === slice.blockId)
      return block ? { slice, block } : null
    })
    .filter(Boolean)

  if (blocks.length === 0) return null

  return (
    <div className="border-b border-[var(--gray-800)] px-3 py-2">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--gray-500)]">
        Page {pageIndex + 1} rhythm (planned)
      </p>
      <div
        className="relative rounded-sm border border-[var(--gray-800)] bg-[var(--gray-1000)]"
        style={{ height: 140 }}
        aria-hidden
      >
        {blocks.map((entry) => {
          if (!entry) return null
          const { block, slice } = entry
          const topPct = (slice.yPt / contentHeight) * 100
          const heightPct = Math.min(
            (block.bbox.height / contentHeight) * 100,
            (MAX_BAR_PT / contentHeight) * 100,
          )
          const color = LAYOUT_DEBUG_COLORS[block.type]
          return (
            <div
              key={block.id}
              title={`${block.id} · ${Math.round(block.bbox.height)}pt`}
              className="absolute left-1 right-1 min-h-[2px] rounded-sm opacity-80"
              style={{
                top: `${topPct}%`,
                height: `${Math.max(heightPct, 1.5)}%`,
                backgroundColor: color,
              }}
            />
          )
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-[var(--gray-600)]">
        Schematic from layout plan — not aligned to PDF viewer zoom.
      </p>
    </div>
  )
}

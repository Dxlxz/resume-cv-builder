import { useState } from 'react'
import type { LayoutPlanResult } from '@rb/layout/types'
import { LAYOUT_DEBUG_COLORS } from '@rb/layout/debug/layoutDebugColors'
import { LayoutDebugSchematic } from '@rb/layout/debug/LayoutDebugSchematic'

interface LayoutDebugInspectorProps {
  planResult: LayoutPlanResult
}

export function LayoutDebugInspector({ planResult }: LayoutDebugInspectorProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const { plan, measured } = planResult
  const fill = Math.round((plan.fillRatio[pageIndex] ?? 0) * 100)

  const blocksOnPage = plan.slices
    .filter((s) => s.pageIndex === pageIndex)
    .map((slice) => {
      const block = measured.blocks.find((b) => b.id === slice.blockId)
      return block ? { slice, block } : null
    })
    .filter(Boolean)

  return (
    /* Deliberately dark surface (sits on the dark PDF viewer canvas) — uses
       gray primitives from the vendored UDS tokens, not app chrome tokens. */
    <aside
      className="flex h-full w-72 shrink-0 flex-col border-l border-[var(--gray-800)] bg-[var(--gray-1000)]/95 text-[var(--gray-100)]"
      aria-label="Layout debug inspector"
    >
      <div className="border-b border-[var(--gray-800)] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gray-500)]">
          Layout debug
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--gray-500)]">
          Block list and rhythm schematic from the layout plan — independent of PDF viewer
          pixels.
        </p>
      </div>

      <LayoutDebugSchematic planResult={planResult} pageIndex={pageIndex} />

      <div className="flex gap-1 border-b border-[var(--gray-800)] px-2 py-2">
        {Array.from({ length: plan.pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPageIndex(i)}
            className={`rounded-sm px-2 py-1 text-xs font-medium ${
              pageIndex === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-[var(--gray-900)] text-[var(--gray-300)] hover:bg-[var(--gray-800)]'
            }`}
          >
            P{i + 1}
          </button>
        ))}
        <span className="ml-auto self-center text-[10px] text-[var(--gray-600)]">{fill}% fill</span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 text-[11px]">
        {blocksOnPage.map((entry) => {
          if (!entry) return null
          const { block, slice } = entry
          const color = LAYOUT_DEBUG_COLORS[block.type]
          return (
            <li
              key={block.id}
              className="mb-1.5 rounded-sm border border-[var(--gray-800)]/80 bg-[var(--gray-900)]/60 px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="font-mono text-[var(--gray-200)]">{block.id}</span>
              </div>
              <p className="mt-0.5 text-[var(--gray-500)]">
                {block.type} · {Math.round(block.bbox.height)}pt tall · y={Math.round(slice.yPt)}
                pt
                {block.spacingBeforePt > 0 ? ` · +${block.spacingBeforePt}pt before` : ''}
              </p>
            </li>
          )
        })}
      </ul>

      {plan.breaks.length > 0 && (
        <div className="border-t border-[var(--gray-800)] px-3 py-2 text-[10px] text-[var(--gray-500)]">
          <p className="font-medium text-[var(--gray-300)]">Page breaks</p>
          <ul className="mt-1 space-y-0.5">
            {plan.breaks.slice(0, 4).map((br, i) => (
              <li key={i}>
                P{br.pageIndex}: {br.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

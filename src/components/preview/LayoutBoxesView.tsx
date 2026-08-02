import { useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { SectionId } from '@rb/core/types/document'
import { getSectionColor } from '@/lib/sectionColors'
import { scrollToFormSection } from '@/lib/scrollToSection'

/**
 * The "Layout" layer of the preview: pages from the layout plan, each
 * measured block drawn as a section-tinted box (token colours only).
 * Rendered instantly from the plan - no PDF generation, so it updates
 * with the same debounce as the PDF preview but much cheaper.
 */
export function LayoutBoxesView() {
  const document = useDocumentStore((s) => s.document)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const focusedSection = useDocumentStore((s) => s.focusedSection)
  const [hoveredSection, setHoveredSection] = useState<SectionId | null>(null)

  if (!document || !layoutPlan) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Computing layout… open the preview to see the box view.
      </p>
    )
  }

  const { measured, plan } = layoutPlan
  const { contentWidthPt, contentHeightPt } = plan
  const blocksById = new Map(measured.blocks.map((b) => [b.id, b]))

  const pages = Array.from({ length: plan.pageCount }, (_, pageIndex) =>
    plan.slices.filter((s) => s.pageIndex === pageIndex),
  )

  const dimSection = hoveredSection ?? focusedSection

  const pageFill = (pageIndex: number) => plan.fillRatio[pageIndex] ?? 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {document.meta.sectionOrder.map((sectionId) => (
          <button
            key={sectionId}
            type="button"
            title={`Jump to ${getSectionLabel(sectionId, {})} in the form`}
            onMouseEnter={() => setHoveredSection(sectionId)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => scrollToFormSection(sectionId)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
              dimSection === sectionId
                ? 'border-border bg-card text-foreground'
                : 'border-border bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getSectionColor(sectionId).text }}
            />
            {getSectionLabel(sectionId, {})}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-5 pb-2">
        {pages.map((slices, pageIndex) => (
          <div key={pageIndex} className="flex w-full max-w-[34rem] flex-col gap-1">
            <div className="flex items-baseline justify-between px-0.5">
              <p className="text-xs font-medium text-muted-foreground">
                Page {pageIndex + 1} of {plan.pageCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(pageFill(pageIndex) * 100)}% full
              </p>
            </div>
            <div
              className="relative w-full animate-slide-up overflow-hidden rounded-sm border border-border bg-card shadow-[var(--shadow-raised)]"
              style={{ aspectRatio: `${contentWidthPt} / ${contentHeightPt}` }}
            >
              {slices.map((slice, index) => {
                const block = blocksById.get(slice.blockId)
                if (!block) return null
                const color = getSectionColor(block.sectionId)
                const share = Math.round((block.bbox.height / contentHeightPt) * 100)
                const dimmed = dimSection !== null && dimSection !== block.sectionId
                const isFocused = focusedSection === block.sectionId

                return (
                  <button
                    key={`${block.id}-${focusedSection === block.sectionId ? 'focus' : 'idle'}`}
                    type="button"
                    title={`${getSectionLabel(block.sectionId, {})} · ${Math.round(block.bbox.height)}pt tall · ${share}% of this page`}
                    aria-label={`${getSectionLabel(block.sectionId, {})} · jump to section`}
                    onClick={() => scrollToFormSection(block.sectionId)}
                    onMouseEnter={() => setHoveredSection(block.sectionId)}
                    onMouseLeave={() => setHoveredSection(null)}
                    className={`absolute animate-fade-in rounded-sm p-0 text-left transition-all duration-[var(--duration-state)] ${isFocused ? 'animate-pop-in' : ''}`}
                    style={{
                      left: `${(block.bbox.x / contentWidthPt) * 100}%`,
                      top: `${(slice.yPt / contentHeightPt) * 100}%`,
                      width: `${(block.bbox.width / contentWidthPt) * 100}%`,
                      height: `${(block.bbox.height / contentHeightPt) * 100}%`,
                      backgroundColor: color.fill,
                      border: `1px solid ${color.border}`,
                      opacity: dimmed ? 0.25 : 1,
                      boxShadow: isFocused ? `0 0 0 2px ${color.text}` : undefined,
                      animationDelay: `${Math.min(index, 12) * 25}ms`,
                    }}
                  />
                )
              })}

              {plan.breaks
                .filter((b) => b.pageIndex - 1 === pageIndex)
                .map((breakItem, index) => (
                  <div
                    key={`break-${index}`}
                    aria-hidden
                    className="absolute left-0 flex w-full items-center gap-1"
                    style={{ top: `${(breakItem.yPt / contentHeightPt) * 100}%` }}
                  >
                    <span className="block h-px flex-1 border-t border-dashed border-status-danger/50" />
                    <span className="rounded-full bg-badge-danger px-1.5 py-px text-[9px] text-status-danger-foreground">
                      page break
                    </span>
                    <span className="block h-px flex-1 border-t border-dashed border-status-danger/50" />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

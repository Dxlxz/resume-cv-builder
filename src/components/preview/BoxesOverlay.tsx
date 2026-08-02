import type { SectionId } from '@rb/core/types/document'
import type { LayoutPlanResult } from '@rb/layout/types'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getSectionColor } from '@/lib/sectionColors'
import { pageBoxesForPlan } from '@/lib/boxGeometry'
import { scrollToFormSection } from '@/lib/scrollToSection'

interface BoxesOverlayProps {
  plan: LayoutPlanResult
  pageIndex: number
  scale: number
  hoveredSection: SectionId | null
  onHoverSection: (sectionId: SectionId | null) => void
}

/**
 * Section-tinted boxes over one rendered PDF page, positioned exactly by
 * the layout plan (pt x scale = px). Hovering a box dims the rest of the
 * page; clicking jumps to the section in the form.
 */
export function BoxesOverlay({
  plan,
  pageIndex,
  scale,
  hoveredSection,
  onHoverSection,
}: BoxesOverlayProps) {
  const focusedSection = useDocumentStore((s) => s.focusedSection)
  const geometry = pageBoxesForPlan(plan, pageIndex, scale)
  const dimSection = hoveredSection ?? focusedSection

  return (
    <div className="pointer-events-none absolute inset-0">
      {geometry.boxes.map((box, index) => {
        const color = getSectionColor(box.sectionId)
        const dimmed = dimSection !== null && dimSection !== box.sectionId
        const isFocused = focusedSection === box.sectionId

        return (
          <button
            key={`${box.blockId}-${focusedSection === box.sectionId ? 'focus' : 'idle'}`}
            type="button"
            title={`${getSectionLabel(box.sectionId, {})} · ${Math.round(box.height / scale)}pt tall · ${Math.round(box.share * 100)}% of this page`}
            aria-label={`${getSectionLabel(box.sectionId, {})} · jump to section`}
            onClick={() => scrollToFormSection(box.sectionId)}
            onMouseEnter={() => onHoverSection(box.sectionId)}
            onMouseLeave={() => onHoverSection(null)}
            className={`absolute animate-fade-in rounded-sm p-0 text-left transition-all duration-[var(--duration-state)] ${isFocused ? 'animate-pop-in' : ''}`}
            style={{
              left: box.x,
              top: box.y,
              width: box.width,
              height: box.height,
              backgroundColor: color.fill,
              border: `1px solid ${color.border}`,
              opacity: dimmed ? 0.25 : 1,
              boxShadow: isFocused ? `0 0 0 2px ${color.text}` : undefined,
              animationDelay: `${Math.min(index, 12) * 25}ms`,
            }}
          />
        )
      })}

      {geometry.breaks.map((breakItem, index) => (
        <div
          key={`break-${index}`}
          aria-hidden
          className="absolute left-0 flex w-full items-center gap-1"
          style={{ top: breakItem.yPt * scale }}
        >
          <span className="block h-px flex-1 border-t border-dashed border-status-danger/50" />
          <span className="rounded-full bg-badge-danger px-1.5 py-px text-[9px] text-status-danger-foreground">
            page break
          </span>
          <span className="block h-px flex-1 border-t border-dashed border-status-danger/50" />
        </div>
      ))}
    </div>
  )
}

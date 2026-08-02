import { useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getPreset } from '@rb/presets/registry'
import type { SectionId } from '@rb/core/types/document'
import { filledSectionIds } from '@/lib/sectionStatus'
import { scrollToFormSection } from '@/lib/scrollToSection'

/**
 * Sections rail: the primary navigation of the editor. One row per visible
 * section with a filled-status dot; click jumps to the form.
 */
export function SectionRail() {
  const document = useDocumentStore((s) => s.document)
  const [active, setActive] = useState<SectionId | null>(null)

  if (!document) return null

  const hidden = new Set(document.meta.hiddenSections)
  const preset = getPreset(document.meta.presetId)
  const sections = document.meta.sectionOrder.filter(
    (sectionId) => sectionId === 'contact' || !hidden.has(sectionId),
  )
  const filled = filledSectionIds(document, sections)

  return (
    <nav
      aria-label="Document sections"
      className="hidden w-40 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-sidebar p-2 lg:flex"
    >
      {sections.map((sectionId) => {
        const label = getSectionLabel(sectionId, preset.labels)
        const isActive = active === sectionId
        return (
          <button
            key={sectionId}
            type="button"
            onClick={() => {
              setActive(sectionId)
              scrollToFormSection(sectionId)
            }}
            className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-medium transition-colors duration-[var(--duration-state)] ${
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                filled.has(sectionId) ? 'bg-status-success' : 'bg-foreground/20'
              }`}
            />
            <span className="truncate">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

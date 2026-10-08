import { ChevronDownIcon, ChevronUpIcon, CircleCheckIcon, CircleDashedIcon, GripVerticalIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { SectionId } from '@rb/core/types/document'
import { getPreset } from '@rb/presets/registry'
import { filledSectionIds } from './sectionStatus'
import { editorSections, mergeSectionOrder } from './editorSections'
import { scrollToFormSection } from '@/shared/lib/scrollToSection'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Sortable, SortableItem, SortableItemHandle } from '@/shared/ui/sortable'

/** One row of the section list: drag handle, jump link, visibility, and keyboard-accessible move buttons. */
function SectionRow({
  sectionId,
  index,
  total,
  filled,
  onMove,
  onNavigate,
}: {
  sectionId: SectionId
  /** Position among the listed sections. */
  index: number
  total: number
  filled: boolean
  onMove: (from: number, to: number) => void
  onNavigate?: () => void
}) {
  const document = useDocumentStore((s) => s.document)
  const hiddenSections = useDocumentStore((s) => s.document?.meta.hiddenSections ?? [])
  const toggleSection = useDocumentStore((s) => s.toggleSection)

  if (!document) return null

  const label = getSectionLabel(sectionId, getPreset(document.meta.presetId).labels)
  const isHidden = hiddenSections.includes(sectionId)
  const isContact = sectionId === 'contact'

  const move = (direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 1 || newIndex >= total) return
    onMove(index, newIndex)
  }

  return (
    <>
      {!isContact && (
        <SortableItemHandle asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="touch-none text-muted-foreground"
            aria-label={`Drag to reorder ${label}`}
            title="Drag to reorder"
          >
            <GripVerticalIcon aria-hidden />
          </Button>
        </SortableItemHandle>
      )}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-medium text-foreground outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={() => {
          scrollToFormSection(sectionId)
          onNavigate?.()
        }}
        title={`Jump to ${label}`}
      >
        {filled ? (
          <CircleCheckIcon className="size-3.5 shrink-0 text-success-foreground" aria-hidden />
        ) : (
          <CircleDashedIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="truncate">
          {label}
          <span className="sr-only">{filled ? ' (complete)' : ' (not started)'}</span>
        </span>
      </button>
      {!isContact && (
        <>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox
              checked={!isHidden}
              onCheckedChange={() => toggleSection(sectionId)}
              aria-label={`Show ${label} in preview and export`}
            />
            <span className="hidden sm:inline">Show</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => move(-1)}
            disabled={index <= 1}
            aria-label={`Move ${label} up`}
            title="Move up"
          >
            <ChevronUpIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => move(1)}
            disabled={index >= total - 1}
            aria-label={`Move ${label} down`}
            title="Move down"
          >
            <ChevronDownIcon aria-hidden />
          </Button>
        </>
      )}
    </>
  )
}

const ROW = 'flex items-center gap-1.5 rounded-lg bg-muted/50 px-1.5 py-1 ring-1 ring-foreground/10'

/**
 * Sections management, hosted in the editor panel's popover: click a row to jump, drag the handle (or use the
 * arrows, which work from the keyboard) to reorder, untick to hide. Contact stays first.
 */
export function SectionListContent({ onNavigate }: { onNavigate?: () => void }) {
  const document = useDocumentStore((s) => s.document)
  const reorderSections = useDocumentStore((s) => s.reorderSections)

  if (!document) return null

  const fullOrder = document.meta.sectionOrder
  const listed = editorSections(document)
  const contact = listed.filter((id) => id === 'contact')
  const reorderable = listed.filter((id) => id !== 'contact')
  const filled = filledSectionIds(document, listed)
  const total = listed.length

  const applyOrder = (nextListed: SectionId[]) => reorderSections(mergeSectionOrder(fullOrder, nextListed))
  const moveListed = (from: number, to: number) => {
    const next = [...listed]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    applyOrder(next)
  }

  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Sections</p>
      <p className="text-xs text-muted-foreground">Reorder and choose what shows in the PDF.</p>
      <div className="mt-3 space-y-2">
        {contact.map((sectionId) => (
          <div key={sectionId} className={ROW}>
            <SectionRow
              sectionId={sectionId}
              index={0}
              total={total}
              filled={filled.has(sectionId)}
              onMove={moveListed}
              onNavigate={onNavigate}
            />
          </div>
        ))}
        <Sortable
          value={reorderable}
          onValueChange={(next) => applyOrder([...contact, ...next])}
          getItemValue={(id) => id}
          className="space-y-2"
        >
          {reorderable.map((sectionId) => (
            <SortableItem key={sectionId} value={sectionId} className={ROW}>
              <SectionRow
                sectionId={sectionId}
                index={listed.indexOf(sectionId)}
                total={total}
                filled={filled.has(sectionId)}
                onMove={moveListed}
                onNavigate={onNavigate}
              />
            </SortableItem>
          ))}
        </Sortable>
      </div>
    </div>
  )
}

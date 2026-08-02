import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { SectionId } from '@rb/core/types/document'
import { getPreset } from '@rb/presets/registry'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { Button } from '@/components/ui/Button'

function SortableSectionRow({
  sectionId,
  index,
  total,
}: {
  sectionId: SectionId
  index: number
  total: number
}) {
  const document = useDocumentStore((s) => s.document)
  const hiddenSections = useDocumentStore((s) => s.document?.meta.hiddenSections ?? [])
  const reorderSections = useDocumentStore((s) => s.reorderSections)
  const toggleSection = useDocumentStore((s) => s.toggleSection)
  const sectionOrder = useDocumentStore((s) => s.document?.meta.sectionOrder ?? [])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sectionId, disabled: sectionId === 'contact' })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  if (!document) return null

  const label = getSectionLabel(sectionId, getPreset(document.meta.presetId).labels)
  const isHidden = hiddenSections.includes(sectionId)
  const isContact = sectionId === 'contact'

  const move = (direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= total) return
    const next = arrayMove(sectionOrder, index, newIndex)
    reorderSections(next)
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-sm border border-border bg-muted px-2 py-2 sm:px-3"
    >
      {!isContact && (
        <button
          type="button"
          className="cursor-grab touch-none px-1.5 py-2 text-muted-foreground hover:text-foreground"
          aria-label={`Drag to reorder ${label}`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
      )}
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:text-primary"
        onClick={() => scrollToFormSection(sectionId)}
        title={`Jump to ${label}`}
      >
        {label}
      </button>
      {!isContact && (
        <>
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={!isHidden}
              onChange={() => toggleSection(sectionId)}
              aria-label={`Show ${label} in preview and export`}
            />
            <span className="hidden sm:inline">Show</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => move(-1)}
            disabled={index <= 1}
            aria-label={`Move ${label} up`}
            title="Move up"
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => move(1)}
            disabled={index >= total - 1}
            aria-label={`Move ${label} down`}
            title="Move down"
          >
            ↓
          </Button>
        </>
      )}
    </li>
  )
}

export function SectionList() {
  const sectionOrder = useDocumentStore((s) => s.document?.meta.sectionOrder ?? [])
  const reorderSections = useDocumentStore((s) => s.reorderSections)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (active.id === 'contact' || over.id === 'contact') return
    const oldIndex = sectionOrder.indexOf(active.id as SectionId)
    const newIndex = sectionOrder.indexOf(over.id as SectionId)
    if (oldIndex < 0 || newIndex < 0) return
    reorderSections(arrayMove(sectionOrder, oldIndex, newIndex))
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Sections</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Click a name to jump · drag ⠿ to reorder · toggle Show to hide from export
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {sectionOrder.map((sectionId, index) => (
              <SortableSectionRow
                key={sectionId}
                sectionId={sectionId}
                index={index}
                total={sectionOrder.length}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

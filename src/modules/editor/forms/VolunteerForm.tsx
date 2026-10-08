import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyVolunteer } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { useConfirm } from '@/shared/ui/use-confirm'
import { ItemCard } from '@/shared/ui/item-card'
import { Checkbox } from '@/shared/ui/checkbox'
import { TextField } from '@/shared/ui/form-field'
import { CatalogPicker } from '@/modules/catalog'
import { MonthField } from '@/shared/ui/form-field'
import { BulletListEditor } from '@/shared/ui/bullet-list-editor'
import { EmptyHint } from '@/shared/ui/empty-hint'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

export function VolunteerForm() {
  const volunteer = useDocumentStore((s) => s.document?.volunteer ?? [])
  const updateVolunteer = useDocumentStore((s) => s.updateVolunteer)

  const updateItem = (id: string, patch: Partial<(typeof volunteer)[0]>) => {
    updateVolunteer(
      volunteer.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const { requestConfirm, confirmDialog } = useConfirm()

  const removeItem = (id: string) => {
    requestConfirm({
      title: 'Remove this entry?',
      description: 'It will no longer appear in your resume.',
      confirmLabel: 'Remove entry',
      destructive: true,
      onConfirm: () => updateVolunteer(volunteer.filter((item) => item.id !== id)),
    })
  }

  const addEntry = () => updateVolunteer([...volunteer, createEmptyVolunteer()])

  return (
    <div className="space-y-6">
      {confirmDialog}
      {volunteer.length === 0 ? (
        <EmptyHint
          title="No leadership or volunteer entries yet"
          description="Add student leadership, conference roles, or community work that shows initiative."
          action={
            <Button type="button" variant="outline" onClick={addEntry}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Add your first entry
            </Button>
          }
        />
      ) : (
        volunteer.map((item, index) => (
          <ItemCard
            key={item.id}
            title={
              <>
                Entry {index + 1}
                {item.title ? ` — ${item.title}` : ''}
              </>
            }
            removeLabel="Remove entry"
            removeAriaLabel={`Remove entry ${index + 1}`}
            onRemove={() => removeItem(item.id)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <CatalogPicker
                catalogType="occupation"
                label="Role or title"
                placeholder={FORM_PLACEHOLDERS.experience.title}
                value={item.title}
                onChange={(title) => updateItem(item.id, { title })}
              />
              <TextField
                label="Organisation"
                placeholder={FORM_PLACEHOLDERS.experience.company}
                value={item.company}
                onChange={(e) => updateItem(item.id, { company: e.target.value })}
              />
              <CatalogPicker
                catalogType="location"
                label="Location"
                placeholder={FORM_PLACEHOLDERS.experience.location}
                value={item.location ?? ''}
                onChange={(location) => updateItem(item.id, { location })}
              />
              <MonthField
                label="Start date"
                value={item.startDate}
                onChange={(e) => updateItem(item.id, { startDate: e.target.value })}
              />
              <MonthField
                label="End date"
                value={item.endDate ?? ''}
                disabled={item.present}
                onChange={(e) => updateItem(item.id, { endDate: e.target.value })}
              />
              <label className="flex min-h-8 items-center gap-2 self-end pb-1 text-sm text-foreground">
          <Checkbox
            checked={item.present}
            onCheckedChange={(checked) =>
              updateItem(item.id, {
                present: checked === true,
                endDate: checked === true ? '' : item.endDate,
              })
            }
          />
          I am still in this role
        </label>
            </div>
            <BulletListEditor
              label="Highlights"
              bullets={item.bullets}
              placeholder={FORM_PLACEHOLDERS.experience.bullet}
              onChange={(bullets) => updateItem(item.id, { bullets })}
            />
          </ItemCard>
        ))
      )}
      {volunteer.length > 0 && (
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addEntry}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add another entry
        </Button>
      )}
    </div>
  )
}

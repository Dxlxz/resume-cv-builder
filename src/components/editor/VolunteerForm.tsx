import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyVolunteer } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'
import { MonthField } from '@/components/ui/MonthField'
import { BulletListEditor } from '@/components/ui/BulletListEditor'
import { EmptyHint } from '@/components/ui/EmptyHint'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

export function VolunteerForm() {
  const volunteer = useDocumentStore((s) => s.document?.volunteer ?? [])
  const updateVolunteer = useDocumentStore((s) => s.updateVolunteer)

  const updateItem = (id: string, patch: Partial<(typeof volunteer)[0]>) => {
    updateVolunteer(
      volunteer.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    if (!confirm('Remove this entry from your resume?')) return
    updateVolunteer(volunteer.filter((item) => item.id !== id))
  }

  const addEntry = () => updateVolunteer([...volunteer, createEmptyVolunteer()])

  return (
    <div className="space-y-6">
      {volunteer.length === 0 ? (
        <EmptyHint
          title="No leadership or volunteer entries yet"
          description="Add student leadership, conference roles, or community work that shows initiative."
          action={
            <Button type="button" variant="secondary" onClick={addEntry}>
              + Add your first entry
            </Button>
          }
        />
      ) : (
        volunteer.map((item, index) => (
          <div
            key={item.id}
            className="space-y-4 rounded-md border border-border bg-muted/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium text-foreground">
                Entry {index + 1}
                {item.title ? ` — ${item.title}` : ''}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-status-danger hover:bg-badge-danger"
                onClick={() => removeItem(item.id)}
              >
                Remove entry
              </Button>
            </div>
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
              <label className="flex min-h-10 items-center gap-2 self-end pb-1 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={item.present}
                  onChange={(e) =>
                    updateItem(item.id, {
                      present: e.target.checked,
                      endDate: e.target.checked ? '' : item.endDate,
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
          </div>
        ))
      )}
      {volunteer.length > 0 && (
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={addEntry}>
          + Add another entry
        </Button>
      )}
    </div>
  )
}

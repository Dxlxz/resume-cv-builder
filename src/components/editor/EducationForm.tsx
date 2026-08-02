import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyEducation } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'
import { MonthField } from '@/components/ui/MonthField'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

export function EducationForm() {
  const education = useDocumentStore((s) => s.document?.education ?? [])
  const updateEducation = useDocumentStore((s) => s.updateEducation)

  const updateItem = (id: string, patch: Partial<(typeof education)[0]>) => {
    updateEducation(
      education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    updateEducation(education.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {education.map((item, index) => (
        <div
          key={item.id}
          className="space-y-4 rounded-md border border-dashed border-border p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Education {index + 1}</h4>
            <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CatalogPicker
              catalogType="institution"
              label="Institution"
              placeholder={FORM_PLACEHOLDERS.education.institution}
              value={item.institution}
              onChange={(institution) => updateItem(item.id, { institution })}
            />
            <CatalogPicker
              catalogType="degree-type"
              label="Degree"
              placeholder={FORM_PLACEHOLDERS.education.degree}
              value={item.degree}
              onChange={(degree) => updateItem(item.id, { degree })}
            />
            <TextField
              label="Field of study"
              placeholder={FORM_PLACEHOLDERS.education.field}
              value={item.field ?? ''}
              onChange={(e) => updateItem(item.id, { field: e.target.value })}
            />
            <TextField
              label="Honors"
              placeholder={FORM_PLACEHOLDERS.education.honors}
              value={item.honors ?? ''}
              onChange={(e) => updateItem(item.id, { honors: e.target.value })}
            />
            <MonthField
              label="Start date"
              value={item.startDate ?? ''}
              onChange={(e) => updateItem(item.id, { startDate: e.target.value })}
            />
            <MonthField
              label="End date"
              value={item.endDate ?? ''}
              onChange={(e) => updateItem(item.id, { endDate: e.target.value })}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => updateEducation([...education, createEmptyEducation()])}
      >
        + Add education
      </Button>
    </div>
  )
}

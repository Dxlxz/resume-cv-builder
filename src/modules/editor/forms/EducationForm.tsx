import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyEducation } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { ItemCard } from '@/shared/ui/item-card'
import { TextField } from '@/shared/ui/form-field'
import { CatalogPicker } from '@/modules/catalog'
import { MonthField } from '@/shared/ui/form-field'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

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
        <ItemCard key={item.id} title={<>Education {index + 1}</>} removeAriaLabel={`Remove education ${index + 1}`} onRemove={() => removeItem(item.id)}>
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
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => updateEducation([...education, createEmptyEducation()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        Add education
      </Button>
    </div>
  )
}

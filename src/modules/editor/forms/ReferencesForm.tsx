import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyReference } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { ItemCard } from '@/shared/ui/item-card'
import { TextField } from '@/shared/ui/form-field'

export function ReferencesForm() {
  const references = useDocumentStore((s) => s.document?.references ?? [])
  const updateReferences = useDocumentStore((s) => s.updateReferences)

  const updateItem = (id: string, patch: Partial<(typeof references)[0]>) => {
    updateReferences(
      references.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    updateReferences(references.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {references.map((item, index) => (
        <ItemCard key={item.id} title={<>Reference {index + 1}</>} removeAriaLabel={`Remove reference ${index + 1}`} onRemove={() => removeItem(item.id)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Name"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
            />
            <TextField
              label="Job title"
              value={item.title}
              onChange={(e) => updateItem(item.id, { title: e.target.value })}
            />
          </div>
          <TextField
            label="Company"
            value={item.company}
            onChange={(e) => updateItem(item.id, { company: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Phone"
              value={item.phone ?? ''}
              onChange={(e) => updateItem(item.id, { phone: e.target.value })}
            />
            <TextField
              label="Email"
              value={item.email ?? ''}
              onChange={(e) => updateItem(item.id, { email: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => updateReferences([...references, createEmptyReference()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        Add reference
      </Button>
    </div>
  )
}

import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyReference } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

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
        <div
          key={item.id}
          className="space-y-4 rounded-md border border-dashed border-border p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Reference {index + 1}</h4>
            <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </div>
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
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => updateReferences([...references, createEmptyReference()])}
      >
        + Add reference
      </Button>
    </div>
  )
}

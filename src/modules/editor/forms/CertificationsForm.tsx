import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyCertification } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { ItemCard } from '@/shared/ui/item-card'
import { TextField } from '@/shared/ui/form-field'

export function CertificationsForm() {
  const certifications = useDocumentStore((s) => s.document?.certifications ?? [])
  const updateCertifications = useDocumentStore((s) => s.updateCertifications)

  const updateItem = (id: string, patch: Partial<(typeof certifications)[0]>) => {
    updateCertifications(
      certifications.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    updateCertifications(certifications.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {certifications.map((item, index) => (
        <ItemCard key={item.id} title={<>Certification {index + 1}</>} removeAriaLabel={`Remove certification ${index + 1}`} onRemove={() => removeItem(item.id)}>
          <TextField
            label="Certification name"
            value={item.name}
            onChange={(e) => updateItem(item.id, { name: e.target.value })}
          />
          <TextField
            label="Issuer"
            value={item.issuer}
            onChange={(e) => updateItem(item.id, { issuer: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Completed"
              placeholder="e.g. Jan 2025"
              value={item.completed ?? ''}
              onChange={(e) => updateItem(item.id, { completed: e.target.value })}
            />
            <TextField
              label="Verify URL"
              placeholder="https://..."
              value={item.verifyUrl ?? ''}
              onChange={(e) => updateItem(item.id, { verifyUrl: e.target.value })}
            />
          </div>
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => updateCertifications([...certifications, createEmptyCertification()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        Add certification
      </Button>
    </div>
  )
}

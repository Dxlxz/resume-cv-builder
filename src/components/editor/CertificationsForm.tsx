import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyCertification } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

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
        <div
          key={item.id}
          className="space-y-4 rounded-md border border-dashed border-border p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Certification {index + 1}</h4>
            <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </div>
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
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => updateCertifications([...certifications, createEmptyCertification()])}
      >
        + Add certification
      </Button>
    </div>
  )
}

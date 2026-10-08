import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyProject } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { ItemCard } from '@/shared/ui/item-card'
import { TextField } from '@/shared/ui/form-field'
import { TextAreaField } from '@/shared/ui/form-field'
import { BulletListEditor } from '@/shared/ui/bullet-list-editor'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

export function ProjectsForm() {
  const projects = useDocumentStore((s) => s.document?.projects ?? [])
  const updateProjects = useDocumentStore((s) => s.updateProjects)

  const updateItem = (id: string, patch: Partial<(typeof projects)[0]>) => {
    updateProjects(
      projects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    updateProjects(projects.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      {projects.map((item, index) => (
        <ItemCard key={item.id} title={<>Project {index + 1}</>} removeAriaLabel={`Remove project ${index + 1}`} onRemove={() => removeItem(item.id)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Project name"
              placeholder={FORM_PLACEHOLDERS.projects.name}
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
            />
            <TextField
              label="URL"
              placeholder={FORM_PLACEHOLDERS.projects.url}
              value={item.url ?? ''}
              onChange={(e) => updateItem(item.id, { url: e.target.value })}
            />
          </div>
          <TextAreaField
            label="Description"
            placeholder={FORM_PLACEHOLDERS.projects.description}
            value={item.description ?? ''}
            onChange={(e) => updateItem(item.id, { description: e.target.value })}
          />
          <BulletListEditor
            label="Highlights"
            bullets={item.bullets}
            placeholder={FORM_PLACEHOLDERS.projects.bullet}
            onChange={(bullets) => updateItem(item.id, { bullets })}
          />
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => updateProjects([...projects, createEmptyProject()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        Add project
      </Button>
    </div>
  )
}

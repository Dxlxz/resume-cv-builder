import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyProject } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { TextArea } from '@/components/ui/TextArea'
import { BulletListEditor } from '@/components/ui/BulletListEditor'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

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
        <div
          key={item.id}
          className="space-y-4 rounded-md border border-dashed border-border p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Project {index + 1}</h4>
            <Button type="button" variant="ghost" onClick={() => removeItem(item.id)}>
              Remove
            </Button>
          </div>
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
          <TextArea
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
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => updateProjects([...projects, createEmptyProject()])}
      >
        + Add project
      </Button>
    </div>
  )
}

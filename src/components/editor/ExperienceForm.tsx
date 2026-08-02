import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptyExperience } from '@rb/core/schema'
import type { ResumeDocument } from '@rb/core/types/document'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'
import { MonthField } from '@/components/ui/MonthField'
import { BulletListEditor } from '@/components/ui/BulletListEditor'
import { EmptyHint } from '@/components/ui/EmptyHint'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

type ExperienceItem = ResumeDocument['experience'][number]

interface RoleCardProps {
  item: ExperienceItem
  index: number
  updateItem: (id: string, patch: Partial<ExperienceItem>) => void
  removeItem: (id: string) => void
}

function ExperienceRoleCard({ item, index, updateItem, removeItem }: RoleCardProps) {
  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-foreground">
          Role {index + 1}
          {item.title ? ` - ${item.title}` : ''}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-status-danger hover:bg-badge-danger"
          onClick={() => removeItem(item.id)}
        >
          Remove role
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CatalogPicker
          catalogType="occupation"
          label="Job title"
          placeholder={FORM_PLACEHOLDERS.experience.title}
          value={item.title}
          onChange={(title) => updateItem(item.id, { title })}
        />
        <TextField
          label="Company"
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
          I currently work here
        </label>
      </div>
      <BulletListEditor
        label="Achievements"
        bullets={item.bullets}
        placeholder={FORM_PLACEHOLDERS.experience.bullet}
        onChange={(bullets) => updateItem(item.id, { bullets })}
      />
    </div>
  )
}

export function ExperienceForm() {
  const experience = useDocumentStore((s) => s.document?.experience ?? [])
  const updateExperience = useDocumentStore((s) => s.updateExperience)

  const updateItem = (id: string, patch: Partial<ExperienceItem>) => {
    updateExperience(
      experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    if (!confirm('Remove this role from your resume?')) return
    updateExperience(experience.filter((item) => item.id !== id))
  }

  const addRole = () => updateExperience([...experience, createEmptyExperience()])

  return (
    <div className="space-y-6">
      {experience.length === 0 ? (
        <EmptyHint
          title="No work experience yet"
          description="Add your current or most recent role. Use bullet points with numbers or outcomes when you can."
          action={
            <Button type="button" variant="secondary" onClick={addRole}>
              + Add your first role
            </Button>
          }
        />
      ) : (
        experience.map((item, index) => (
          <ExperienceRoleCard
            key={item.id}
            item={item}
            index={index}
            updateItem={updateItem}
            removeItem={removeItem}
          />
        ))
      )}
      {experience.length > 0 && (
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={addRole}>
          + Add another role
        </Button>
      )}
    </div>
  )
}

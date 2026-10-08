import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptyExperience } from '@rb/core/schema'
import type { ResumeDocument } from '@rb/core/types/document'
import { Button } from '@/shared/ui/button'
import { useConfirm } from '@/shared/ui/use-confirm'
import { ItemCard } from '@/shared/ui/item-card'
import { Checkbox } from '@/shared/ui/checkbox'
import { TextField } from '@/shared/ui/form-field'
import { CatalogPicker } from '@/modules/catalog'
import { MonthField } from '@/shared/ui/form-field'
import { BulletListEditor } from '@/shared/ui/bullet-list-editor'
import { EmptyHint } from '@/shared/ui/empty-hint'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

type ExperienceItem = ResumeDocument['experience'][number]

interface RoleCardProps {
  item: ExperienceItem
  index: number
  updateItem: (id: string, patch: Partial<ExperienceItem>) => void
  removeItem: (id: string) => void
}

function ExperienceRoleCard({ item, index, updateItem, removeItem }: RoleCardProps) {
  return (
    <ItemCard
      title={
        <>
          Role {index + 1}
          {item.title ? ` - ${item.title}` : ''}
        </>
      }
      removeLabel="Remove role"
      removeAriaLabel={`Remove role ${index + 1}`}
      onRemove={() => removeItem(item.id)}
    >
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
        <label className="flex min-h-8 items-center gap-2 self-end pb-1 text-sm text-foreground">
          <Checkbox
            checked={item.present}
            onCheckedChange={(checked) =>
              updateItem(item.id, {
                present: checked === true,
                endDate: checked === true ? '' : item.endDate,
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
    </ItemCard>
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

  const { requestConfirm, confirmDialog } = useConfirm()

  const removeItem = (id: string) => {
    requestConfirm({
      title: 'Remove this role?',
      description: 'It will no longer appear in your resume.',
      confirmLabel: 'Remove role',
      destructive: true,
      onConfirm: () => updateExperience(experience.filter((item) => item.id !== id)),
    })
  }

  const addRole = () => updateExperience([...experience, createEmptyExperience()])

  return (
    <div className="space-y-6">
      {confirmDialog}
      {experience.length === 0 ? (
        <EmptyHint
          title="No work experience yet"
          description="Add your current or most recent role. Use bullet points with numbers or outcomes when you can."
          action={
            <Button type="button" variant="outline" onClick={addRole}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Add your first role
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
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addRole}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add another role
        </Button>
      )}
    </div>
  )
}

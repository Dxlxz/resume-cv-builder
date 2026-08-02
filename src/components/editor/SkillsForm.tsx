import { useDocumentStore } from '@/app/store/documentStore'
import { createEmptySkillGroup } from '@rb/core/schema'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CatalogMultiPicker } from '@/components/catalog/CatalogMultiPicker'
import { LanguageLevelPicker } from '@/components/catalog/LanguageLevelPicker'
import {
  categoryIdForSkillGroupName,
  isLanguagesSkillGroup,
} from '@rb/catalog/store/catalogStore'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

export function SkillsForm() {
  const skills = useDocumentStore((s) => s.document?.skills ?? [])
  const updateSkills = useDocumentStore((s) => s.updateSkills)

  const updateGroup = (id: string, patch: Partial<(typeof skills)[0]>) => {
    updateSkills(skills.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  const updateItem = (groupId: string, index: number, value: string) => {
    updateSkills(
      skills.map((g) => {
        if (g.id !== groupId) return g
        const items = [...g.items]
        items[index] = value
        return { ...g, items }
      }),
    )
  }

  const addItem = (groupId: string) => {
    updateSkills(
      skills.map((g) =>
        g.id === groupId ? { ...g, items: [...g.items, ''] } : g,
      ),
    )
  }

  const removeItem = (groupId: string, index: number) => {
    updateSkills(
      skills.map((g) => {
        if (g.id !== groupId) return g
        const items = g.items.filter((_, i) => i !== index)
        return { ...g, items: items.length ? items : [''] }
      }),
    )
  }

  const removeGroup = (id: string) => {
    updateSkills(skills.filter((g) => g.id !== id))
  }

  return (
    <div className="space-y-6">
      {skills.map((group, groupIndex) => (
        <div
          key={group.id}
          className="space-y-3 rounded-md border border-dashed border-border p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <TextField
              label={`Skill group ${groupIndex + 1}`}
              placeholder={FORM_PLACEHOLDERS.skills.groupName}
              value={group.name}
              onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            />
            <Button type="button" variant="ghost" onClick={() => removeGroup(group.id)}>
              Remove group
            </Button>
          </div>
          {isLanguagesSkillGroup(group.name) ? (
            <ul className="space-y-3">
              {group.items.map((item, index) => (
                <li key={index}>
                  <LanguageLevelPicker
                    value={item}
                    onChange={(value) => updateItem(group.id, index, value)}
                    onRemove={() => removeItem(group.id, index)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <CatalogMultiPicker
              catalogType="skill"
              values={group.items}
              onChange={(items) => updateGroup(group.id, { items: items.length ? items : [''] })}
              placeholder={FORM_PLACEHOLDERS.skills.item}
              searchOpts={{ categoryId: categoryIdForSkillGroupName(group.name) }}
              aria-label={`Skills in ${group.name || 'group'}`}
            />
          )}
          {isLanguagesSkillGroup(group.name) && (
            <Button type="button" variant="ghost" onClick={() => addItem(group.id)}>
              + Add language
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => updateSkills([...skills, createEmptySkillGroup()])}
      >
        + Add skill group
      </Button>
    </div>
  )
}

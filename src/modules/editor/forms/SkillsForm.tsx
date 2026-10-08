import { PlusIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { createEmptySkillGroup } from '@rb/core/schema'
import { Button } from '@/shared/ui/button'
import { ItemCard } from '@/shared/ui/item-card'
import { TextField } from '@/shared/ui/form-field'
import { CatalogMultiPicker } from '@/modules/catalog'
import { LanguageLevelPicker } from '@/modules/catalog'
import {
  categoryIdForSkillGroupName,
  isLanguagesSkillGroup,
} from '@rb/catalog/categories'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

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
        <ItemCard
          key={group.id}
          title={<>Skill group {groupIndex + 1}</>}
          removeLabel="Remove group"
          removeAriaLabel={`Remove skill group ${groupIndex + 1}`}
          onRemove={() => removeGroup(group.id)}
        >
          <TextField
            label="Group name"
            placeholder={FORM_PLACEHOLDERS.skills.groupName}
            value={group.name}
            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
          />
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
            <Button type="button" variant="outline" size="sm" onClick={() => addItem(group.id)}>
              <PlusIcon data-icon="inline-start" aria-hidden />
              Add language
            </Button>
          )}
        </ItemCard>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => updateSkills([...skills, createEmptySkillGroup()])}
      >
        <PlusIcon data-icon="inline-start" aria-hidden />
        Add skill group
      </Button>
    </div>
  )
}

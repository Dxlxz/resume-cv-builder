import { useId, useMemo } from 'react'
import { useCatalogBundle } from './useCatalogBundle'
import { XIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'

interface LanguageLevelPickerProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
}

function shortProficiency(label: string): string {
  return label
    .replace(/\s+proficiency$/i, '')
    .replace(/^Native or bilingual$/i, 'Native')
}

function formatLanguageEntry(language: string, proficiency: string): string {
  return `${language} — ${shortProficiency(proficiency)}`
}

function parseLanguageValue(
  value: string,
  languages: { id: string; label: string }[],
  proficiencies: { id: string; label: string }[],
): { language: string; proficiency: string } {
  const parts = value.split('—').map((p) => p.trim())
  if (parts.length >= 2) {
    const lang = languages.find((l) => l.label.toLowerCase() === parts[0].toLowerCase())
    const prof = proficiencies.find(
      (p) =>
        shortProficiency(p.label).toLowerCase() === parts[1].toLowerCase() ||
        p.label.toLowerCase().includes(parts[1].toLowerCase()),
    )
    return { language: lang?.label ?? parts[0], proficiency: prof?.label ?? parts[1] }
  }
  return { language: parts[0] ?? '', proficiency: proficiencies[0]?.label ?? '' }
}

export function LanguageLevelPicker({ value, onChange, onRemove }: LanguageLevelPickerProps) {
  const { getEntries } = useCatalogBundle()
  const languageId = useId()
  const levelId = useId()
  const languages = useMemo(() => getEntries('language'), [getEntries])
  const proficiencies = useMemo(() => getEntries('language-proficiency'), [getEntries])

  const { language, proficiency } = parseLanguageValue(value, languages, proficiencies)

  const update = (lang: string, prof: string) => {
    if (!lang) return
    onChange(formatLanguageEntry(lang, prof || proficiencies[0]?.label || ''))
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field className="min-w-[8rem] flex-1">
        <FieldLabel htmlFor={languageId} className="text-xs text-muted-foreground">Language</FieldLabel>
        <NativeSelect id={languageId} value={language} onChange={(e) => update(e.target.value, proficiency)}>
          <NativeSelectOption value="">Select…</NativeSelectOption>
          {languages.map((l) => (
            <NativeSelectOption key={l.id} value={l.label}>
              {l.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field className="min-w-[10rem] flex-[1.5]">
        <FieldLabel htmlFor={levelId} className="text-xs text-muted-foreground">Proficiency</FieldLabel>
        <NativeSelect id={levelId} value={proficiency} onChange={(e) => update(language, e.target.value)}>
          {proficiencies.map((p) => (
            <NativeSelectOption key={p.id} value={p.label}>
              {shortProficiency(p.label)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove language">
        <XIcon aria-hidden />
      </Button>
    </div>
  )
}

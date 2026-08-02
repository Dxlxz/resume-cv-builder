import { useMemo } from 'react'
import { useCatalogBundle } from '@/hooks/useCatalogBundle'
import { Button } from '@/components/ui/Button'

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
  const languages = useMemo(() => getEntries('language'), [getEntries])
  const proficiencies = useMemo(() => getEntries('language-proficiency'), [getEntries])

  const { language, proficiency } = parseLanguageValue(value, languages, proficiencies)

  const update = (lang: string, prof: string) => {
    if (!lang) return
    onChange(formatLanguageEntry(lang, prof || proficiencies[0]?.label || ''))
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-[8rem] flex-1 space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Language</span>
        <select
          aria-label="Language"
          value={language}
          onChange={(e) => update(e.target.value, proficiency)}
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        >
          <option value="">Select…</option>
          {languages.map((l) => (
            <option key={l.id} value={l.label}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-[10rem] flex-[1.5] space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Proficiency</span>
        <select
          aria-label="Proficiency level"
          value={proficiency}
          onChange={(e) => update(language, e.target.value)}
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        >
          {proficiencies.map((p) => (
            <option key={p.id} value={p.label}>
              {shortProficiency(p.label)}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" variant="ghost" onClick={onRemove} aria-label="Remove language">
        ×
      </Button>
    </div>
  )
}

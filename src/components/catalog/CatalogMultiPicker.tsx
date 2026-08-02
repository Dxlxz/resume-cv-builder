import { useId, useRef, useState } from 'react'
import { useCatalogBundle } from '@/hooks/useCatalogBundle'
import type { CatalogType, SearchOpts } from '@rb/catalog/types'
import { Button } from '@/components/ui/Button'

interface CatalogMultiPickerProps {
  catalogType: CatalogType
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchOpts?: SearchOpts
  'aria-label'?: string
}

export function CatalogMultiPicker({
  catalogType,
  values,
  onChange,
  placeholder = 'Search or type a skill…',
  searchOpts,
  'aria-label': ariaLabel = 'Skills',
}: CatalogMultiPickerProps) {
  const { search, resolveLabel } = useCatalogBundle()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const trimmed = values.map((v) => v.trim()).filter(Boolean)
  const results = search(catalogType, query, {
    ...searchOpts,
    limit: query.trim() ? 12 : 18,
  }).filter((e) => !trimmed.some((v) => v.toLowerCase() === e.label.toLowerCase()))

  const addMany = (rawValues: string[]) => {
    const next = [...trimmed]
    for (const raw of rawValues) {
      const text = raw.trim()
      if (!text) continue
      const resolved = resolveLabel(catalogType, text)
      const canonical = resolved?.label ?? text
      if (next.some((v) => v.toLowerCase() === canonical.toLowerCase())) continue
      next.push(canonical)
    }
    if (next.length === trimmed.length) return
    onChange(next.length ? next : [''])
    setQuery('')
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const addValue = (raw: string) => {
    if (/[,;]/.test(raw)) {
      addMany(raw.split(/[,;]/))
      return
    }
    addMany([raw])
  }

  const removeAt = (index: number) => {
    onChange(trimmed.filter((_, i) => i !== index))
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        addValue(results[activeIndex].label)
      } else {
        addValue(query)
      }
    } else if (e.key === 'Backspace' && !query && trimmed.length) {
      removeAt(trimmed.length - 1)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {trimmed.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm text-foreground"
          >
            {item}
            <button
              type="button"
              className="rounded-full px-1 text-muted-foreground hover:bg-muted-foreground/15 hover:text-foreground"
              aria-label={`Remove ${item}`}
              onClick={() => removeAt(index)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (/[,;]/.test(text)) {
              e.preventDefault()
              addMany(text.split(/[,;]/))
            }
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        />
        {open && results.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-overlay-surface py-1 shadow-[var(--shadow-menu)]"
          >
            {results.map((entry, index) => (
              <li
                key={entry.id}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  index === activeIndex ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-muted'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addValue(entry.label)}
              >
                {entry.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => addValue(query)} disabled={!query.trim()}>
          + Add skill
        </Button>
        <p className="text-xs text-muted-foreground">
          Enter to add · pick from list to keep adding · paste comma-separated skills
        </p>
      </div>
    </div>
  )
}

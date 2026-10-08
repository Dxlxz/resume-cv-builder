import { useId, useRef, useState } from 'react'
import { useCatalogBundle } from './useCatalogBundle'
import type { CatalogType, SearchOpts } from '@rb/catalog/types'
import { PlusIcon, XIcon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

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
          <Badge key={`${item}-${index}`} variant="secondary" size="xl" radius="full" className="gap-1 pr-1">
            {item}
            <button
              type="button"
              className="flex size-4 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Remove ${item}`}
              onClick={() => removeAt(index)}
            >
              <XIcon className="size-3" aria-hidden />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
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
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {results.map((entry, index) => (
              <li
                key={entry.id}
                role="option"
                aria-selected={index === activeIndex}
                className="cursor-pointer px-3 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-muted"
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
        <Button type="button" variant="outline" size="sm" onClick={() => addValue(query)} disabled={!query.trim()}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add skill
        </Button>
        <p className="text-xs text-muted-foreground">
          Enter to add · pick from list to keep adding · paste comma-separated skills
        </p>
      </div>
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import type { CatalogType, SearchOpts } from '@rb/catalog/types'

interface CatalogPickerProps {
  catalogType: CatalogType
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchOpts?: SearchOpts
  id?: string
}

export function CatalogPicker({
  catalogType,
  label,
  value,
  onChange,
  placeholder,
  searchOpts,
  id,
}: CatalogPickerProps) {
  const search = useCatalogStore((s) => s.search)
  const resolveLabel = useCatalogStore((s) => s.resolveLabel)
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  // Sync local query when the controlled value changes (render-time state
  // adjustment per react.dev — avoids a cascading effect render).
  const [prevValue, setPrevValue] = useState(value)
  if (prevValue !== value) {
    setPrevValue(value)
    setQuery(value)
  }

  const results = search(catalogType, query, { ...searchOpts, limit: 12 })

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const commit = (next: string) => {
    const resolved = resolveLabel(catalogType, next)
    const canonical = resolved?.label ?? next
    setQuery(canonical)
    onChange(canonical)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        commit(results[activeIndex].label)
      } else {
        commit(query)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (query.trim()) commit(query)
          }, 120)
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
      />
      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-overlay-surface py-1 shadow-[var(--shadow-menu)]"
        >
          {results.map((entry, index) => (
            <li
              key={entry.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(entry.label)}
            >
              {entry.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

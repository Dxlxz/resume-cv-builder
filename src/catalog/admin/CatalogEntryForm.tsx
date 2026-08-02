import { useState } from 'react'
import type { CatalogEntry, CatalogType } from '@rb/catalog/types'
import { CATALOG_TYPE_LABELS } from '@rb/catalog/types'
import { createCatalogEntry } from '@rb/catalog/store/catalogStore'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'

interface CatalogEntryFormProps {
  catalogType: CatalogType
  entry: CatalogEntry | null
  onSave: (entry: CatalogEntry) => void
  onCancel: () => void
}

export function CatalogEntryForm({ catalogType, entry, onSave, onCancel }: CatalogEntryFormProps) {
  const [label, setLabel] = useState(entry?.label ?? '')
  const [aliases, setAliases] = useState((entry?.aliases ?? []).join(', '))
  const [active, setActive] = useState(entry?.active ?? true)
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? '')
  const [sortOrder, setSortOrder] = useState(String(entry?.sortOrder ?? ''))
  // State seeds from `entry` on mount; the parent remounts this form with a
  // key per entry, so no reset effect is needed.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    const base = entry ?? createCatalogEntry(catalogType, trimmed)
    onSave({
      ...base,
      label: trimmed,
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      active,
      categoryId: categoryId.trim() || undefined,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--gray-1000)]/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-md bg-overlay-surface p-6 text-overlay-foreground shadow-[var(--shadow-modal)]"
      >
        <h3 className="text-lg font-semibold text-foreground">
          {entry ? 'Edit entry' : 'Add entry'} — {CATALOG_TYPE_LABELS[catalogType]}
        </h3>
        <TextField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <TextField
          label="Aliases (comma-separated)"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="e.g. JS, ECMAScript"
        />
        {catalogType === 'skill' && (
          <TextField
            label="Category ID"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="cat-tools"
          />
        )}
        <TextField
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  )
}

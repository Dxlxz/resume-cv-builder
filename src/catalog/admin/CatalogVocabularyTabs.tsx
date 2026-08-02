import { useMemo, useState } from 'react'
import {
  CATALOG_TYPES,
  CATALOG_TYPE_LABELS,
  type CatalogEntry,
  type CatalogType,
} from '@rb/catalog/types'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogEntryForm } from '@/catalog/admin/CatalogEntryForm'
import { Button } from '@/components/ui/Button'

const ADMIN_TYPES = CATALOG_TYPES.filter((t) => t !== 'skill-category')

export function CatalogVocabularyTabs() {
  const getEntries = useCatalogStore((s) => s.getEntries)
  const upsertEntry = useCatalogStore((s) => s.upsertEntry)
  const deleteEntry = useCatalogStore((s) => s.deleteEntry)
  const resetVocabulary = useCatalogStore((s) => s.resetVocabulary)
  const [activeType, setActiveType] = useState<CatalogType>('skill')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CatalogEntry | null>(null)
  const [adding, setAdding] = useState(false)

  const entries = useMemo(() => {
    const list = getEntries(activeType)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        (e.aliases ?? []).some((a) => a.toLowerCase().includes(q)),
    )
  }, [getEntries, activeType, query])

  const handleDelete = (entry: CatalogEntry) => {
    if (confirm(`Delete "${entry.label}" from your catalog?`)) {
      deleteEntry(entry.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {ADMIN_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setActiveType(type)
              setQuery('')
            }}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors duration-[var(--duration-state)] ${
              activeType === type
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {CATALOG_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder={`Search ${CATALOG_TYPE_LABELS[activeType].toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[12rem] flex-1 rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        />
        <Button type="button" size="sm" onClick={() => setAdding(true)}>
          + Add entry
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              confirm(
                `Reset all custom changes for ${CATALOG_TYPE_LABELS[activeType]}? Bundled defaults return.`,
              )
            ) {
              resetVocabulary(activeType)
            }
          }}
        >
          Reset vocabulary
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Label</th>
              <th className="px-4 py-2">Aliases</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium text-foreground">{entry.label}</td>
                <td className="px-4 py-2 text-muted-foreground">{(entry.aliases ?? []).join(', ') || '—'}</td>
                <td className="px-4 py-2 text-muted-foreground">{entry.categoryId ?? '—'}</td>
                <td className="px-4 py-2">{entry.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(entry)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-status-danger"
                    onClick={() => handleDelete(entry)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No entries match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(editing || adding) && (
        <CatalogEntryForm
          key={editing?.id ?? 'new'}
          catalogType={activeType}
          entry={editing}
          onSave={(entry) => {
            upsertEntry(entry)
            setEditing(null)
            setAdding(false)
          }}
          onCancel={() => {
            setEditing(null)
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

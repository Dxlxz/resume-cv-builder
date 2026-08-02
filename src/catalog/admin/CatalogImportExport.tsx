import { useRef } from 'react'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { catalogExportPackSchema } from '@rb/catalog/schema'
import { Button } from '@/components/ui/Button'

export function CatalogImportExport() {
  const exportPack = useCatalogStore((s) => s.exportPack)
  const importPack = useCatalogStore((s) => s.importPack)
  const activeBundleId = useCatalogStore((s) => s.activeBundleId)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const pack = exportPack()
    if (!pack) return
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `catalog-${activeBundleId}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const result = catalogExportPackSchema.safeParse(JSON.parse(text))
      if (!result.success) {
        alert('Invalid catalog pack format.')
        return
      }
      const mode = confirm('Merge with existing catalog? Cancel to replace entirely.') ? 'merge' : 'replace'
      importPack(result.data, mode)
    } catch {
      alert('Could not read catalog file.')
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
        Export catalog JSON
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
        Import catalog JSON
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImport(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

import { getBundledCatalog, BUNDLE_LIST } from '@rb/catalog/bundles'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogImportExport } from '@/catalog/admin/CatalogImportExport'
import { CatalogVocabularyTabs } from '@/catalog/admin/CatalogVocabularyTabs'
import { navigateToBuilder } from '@/hooks/useAppRoute'
import { Button } from '@/components/ui/Button'

export function CatalogAdminPage() {
  const activeBundleId = useCatalogStore((s) => s.activeBundleId)
  const setActiveBundle = useCatalogStore((s) => s.setActiveBundle)
  const resetAll = useCatalogStore((s) => s.resetAll)
  const bundle = getBundledCatalog(activeBundleId)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-header px-4 py-4 shadow-[var(--shadow-raised)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4">
          <Button type="button" variant="secondary" onClick={navigateToBuilder}>
            ← Back to builder
          </Button>
          <div className="mr-auto">
            <h1 className="text-xl font-bold text-foreground">Manage catalogs</h1>
            <p className="text-sm text-muted-foreground">
              {bundle?.manifest.name ?? activeBundleId} · v{bundle?.manifest.version ?? '?'}
            </p>
          </div>
          <label className="text-sm text-muted-foreground">
            Bundle
            <select
              className="ml-2 rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
              value={activeBundleId}
              onChange={(e) => setActiveBundle(e.target.value)}
            >
              {BUNDLE_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <CatalogImportExport />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Reset all catalog customizations to bundled defaults?')) resetAll()
            }}
          >
            Reset all
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Customize skills, occupations, institutions, and other pick lists used in the resume builder.
          Changes are saved locally in your browser.
        </p>
        <CatalogVocabularyTabs />
      </main>
    </div>
  )
}

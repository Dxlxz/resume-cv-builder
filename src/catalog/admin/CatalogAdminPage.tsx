import { getBundledCatalog, BUNDLE_LIST } from '@rb/catalog/bundles'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogImportExport } from '@/catalog/admin/CatalogImportExport'
import { CatalogVocabularyTabs } from '@/catalog/admin/CatalogVocabularyTabs'
import { navigateToBuilder } from '@/hooks/useAppRoute'
import { AppShell } from '@/app/AppShell'
import { Button } from '@/components/ui/Button'

export function CatalogAdminPage() {
  const activeBundleId = useCatalogStore((s) => s.activeBundleId)
  const setActiveBundle = useCatalogStore((s) => s.setActiveBundle)
  const resetAll = useCatalogStore((s) => s.resetAll)
  const bundle = getBundledCatalog(activeBundleId)

  return (
    <AppShell
      backLabel="Builder"
      onBack={navigateToBuilder}
      rightSlot={
        <>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Bundle
            <select
              className="rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
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
        </>
      }
    >
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manage catalogs
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {bundle?.manifest.name ?? activeBundleId} · v{bundle?.manifest.version ?? '?'}
          </span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize skills, occupations, institutions, and other pick lists used in the resume builder.
          Changes are saved locally in your browser.
        </p>
        <div className="mt-6">
          <CatalogVocabularyTabs />
        </div>
      </div>
    </AppShell>
  )
}

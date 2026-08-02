import { useEffect } from 'react'
import { bundleIdForPreset } from '@rb/catalog/bundleForPreset'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogAdminPage } from '@/catalog/admin/CatalogAdminPage'
import { useDocumentStore } from '@/app/store/documentStore'
import { usePersistence } from '@/hooks/usePersistence'
import { navigateTo, useAppRoute } from '@/hooks/useAppRoute'
import { BrowserGuard } from '@/app/BrowserGuard'
import { LandingPage } from '@/app/LandingPage'
import { DocTypeSelector } from '@/app/DocTypeSelector'
import { BuilderLayout } from '@/app/BuilderLayout'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Rizzume - ATS-ready resumes, built locally',
  '/builder': 'Rizzume - Build your resume',
  '/admin': 'Rizzume - Manage catalogs',
}

export default function App() {
  const route = useAppRoute()
  const hasStarted = useDocumentStore((s) => s.hasStarted)
  const presetId = useDocumentStore((s) => s.document?.meta.presetId)
  const init = useDocumentStore((s) => s.init)
  const initCatalog = useCatalogStore((s) => s.init)
  const syncBundleForPreset = useCatalogStore((s) => s.syncBundleForPreset)
  const loadPersonalProfile = useDocumentStore((s) => s.loadPersonalProfile)
  const personalProfileAvailable = useDocumentStore((s) => s.personalProfileAvailable)

  useEffect(() => {
    init()
    const doc = useDocumentStore.getState().document
    initCatalog(doc ? bundleIdForPreset(doc.meta.presetId) : undefined)
  }, [init, initCatalog])

  useEffect(() => {
    if (presetId) syncBundleForPreset(presetId)
  }, [presetId, syncBundleForPreset])

  useEffect(() => {
    window.document.title = ROUTE_TITLES[window.location.pathname] ?? ROUTE_TITLES['/']
  }, [route])

  usePersistence()

  const startFromLanding = () => navigateTo('builder')

  const loadProfile = () => {
    loadPersonalProfile()
    navigateTo('builder')
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {route === 'admin' && (
        <BrowserGuard>
          <CatalogAdminPage />
        </BrowserGuard>
      )}

      {route === 'builder' && (
        <BrowserGuard>
          {hasStarted ? (
            <BuilderLayout onHome={() => navigateTo('landing')} />
          ) : (
            <DocTypeSelector onBack={() => navigateTo('landing')} />
          )}
        </BrowserGuard>
      )}

      {route === 'landing' && (
        <BrowserGuard>
          <LandingPage
            onStart={startFromLanding}
            onLoadProfile={loadProfile}
            personalProfileAvailable={personalProfileAvailable}
          />
        </BrowserGuard>
      )}
    </>
  )
}

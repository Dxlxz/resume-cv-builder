import { useEffect, useState } from 'react'
import { bundleIdForPreset } from '@rb/catalog/bundleForPreset'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogAdminPage } from '@/catalog/admin/CatalogAdminPage'
import { useDocumentStore } from '@/app/store/documentStore'
import { usePersistence } from '@/hooks/usePersistence'
import { useAppRoute } from '@/hooks/useAppRoute'
import { BrowserGuard } from '@/app/BrowserGuard'
import { LandingPage } from '@/app/LandingPage'
import { DocTypeSelector } from '@/app/DocTypeSelector'
import { BuilderLayout } from '@/app/BuilderLayout'

export default function App() {
  const route = useAppRoute()
  const hasStarted = useDocumentStore((s) => s.hasStarted)
  const presetId = useDocumentStore((s) => s.document?.meta.presetId)
  const init = useDocumentStore((s) => s.init)
  const initCatalog = useCatalogStore((s) => s.init)
  const syncBundleForPreset = useCatalogStore((s) => s.syncBundleForPreset)
  const loadPersonalProfile = useDocumentStore((s) => s.loadPersonalProfile)
  const personalProfileAvailable = useDocumentStore((s) => s.personalProfileAvailable)
  // View state for the pre-builder flow (landing → chooser) plus a mid-session
  // "home" override so a started user can always get back to the landing page.
  const [view, setView] = useState<'landing' | 'choose'>('landing')
  const [homeVisible, setHomeVisible] = useState(false)

  // Entering admin resets any mid-session home view, so its "Back to builder"
  // returns to the builder (or the landing for first-time users). Adjusted in
  // render (previous-route comparison) — no effect needed for state sync.
  const [prevRoute, setPrevRoute] = useState(route)
  if (route !== prevRoute) {
    setPrevRoute(route)
    if (route === 'admin') setHomeVisible(false)
  }

  useEffect(() => {
    init()
    const doc = useDocumentStore.getState().document
    initCatalog(doc ? bundleIdForPreset(doc.meta.presetId) : undefined)
  }, [init, initCatalog])

  useEffect(() => {
    if (presetId) syncBundleForPreset(presetId)
  }, [presetId, syncBundleForPreset])

  usePersistence()

  if (route === 'admin') {
    return (
      <BrowserGuard>
        <CatalogAdminPage />
      </BrowserGuard>
    )
  }

  if (homeVisible) {
    return (
      <BrowserGuard>
        <LandingPage
          onStart={() => {
            setHomeVisible(false)
            if (!hasStarted) setView('choose')
          }}
          onLoadProfile={() => loadPersonalProfile()}
          personalProfileAvailable={personalProfileAvailable}
        />
      </BrowserGuard>
    )
  }

  if (hasStarted) {
    return (
      <BrowserGuard>
        <BuilderLayout onHome={() => setHomeVisible(true)} />
      </BrowserGuard>
    )
  }

  if (view === 'choose') {
    return (
      <BrowserGuard>
        <DocTypeSelector onBack={() => setView('landing')} />
      </BrowserGuard>
    )
  }

  return (
    <BrowserGuard>
      <LandingPage
        onStart={() => setView('choose')}
        onLoadProfile={() => loadPersonalProfile()}
        personalProfileAvailable={personalProfileAvailable}
      />
    </BrowserGuard>
  )
}

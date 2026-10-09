import { lazy, Suspense, useEffect } from 'react'
import { Loader2Icon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { usePersistence } from '@/modules/document'
import { navigateTo, useAppRoute } from '@/shared/hooks/useAppRoute'
import { BrowserGuard } from '@/app/BrowserGuard'
import { RouteErrorBoundary } from '@/app/RouteErrorBoundary'
import { LandingPage } from '@/modules/landing'

// The builder, the chooser and the ATS checker are loaded on demand: the landing page does not need them.
const DocTypeSelector = lazy(() => import('@/app/DocTypeSelector').then((m) => ({ default: m.DocTypeSelector })))
const BuilderLayout = lazy(() => import('@/app/BuilderLayout').then((m) => ({ default: m.BuilderLayout })))
const AtsCheckerPage = lazy(() => import('@/modules/ats-check').then((m) => ({ default: m.AtsCheckerPage })))

function RouteFallback() {
  return (
    <div id="main-content" className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground" role="status">
      <Loader2Icon className="size-6 animate-spin" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  )
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Rizzume - ATS-ready resumes, built locally',
  '/builder': 'Rizzume - Build your resume',
  '/ats-check': 'Rizzume - ATS check',
}

export default function App() {
  const route = useAppRoute()
  const hasStarted = useDocumentStore((s) => s.hasStarted)
  const init = useDocumentStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    window.document.title = ROUTE_TITLES[window.location.pathname] ?? ROUTE_TITLES['/']
  }, [route])

  // A lazy chunk that 404s after a new deploy: reload once to pick up the new build; a second failure shows the boundary.
  useEffect(() => {
    const onPreloadError = (event: Event) => {
      event.preventDefault()
      try {
        if (window.sessionStorage.getItem('rizzume:chunk-reload')) return
        window.sessionStorage.setItem('rizzume:chunk-reload', '1')
      } catch {
        return
      }
      window.location.reload()
    }
    window.addEventListener('vite:preloadError', onPreloadError)
    return () => window.removeEventListener('vite:preloadError', onPreloadError)
  }, [])

  usePersistence()

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {route === 'builder' && (
        <BrowserGuard>
          <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
            {hasStarted ? (
              <BuilderLayout onHome={() => navigateTo('landing')} />
            ) : (
              <DocTypeSelector onBack={() => navigateTo('landing')} />
            )}
            </Suspense>
          </RouteErrorBoundary>
        </BrowserGuard>
      )}

      {route === 'ats-check' && (
        <BrowserGuard>
          <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
            <AtsCheckerPage onHome={() => navigateTo('landing')} />
            </Suspense>
          </RouteErrorBoundary>
        </BrowserGuard>
      )}

      {route === 'landing' && (
        <BrowserGuard>
          <LandingPage onStart={() => navigateTo('builder')} />
        </BrowserGuard>
      )}
    </>
  )
}

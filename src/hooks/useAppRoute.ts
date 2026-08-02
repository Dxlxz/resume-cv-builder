import { useEffect, useState } from 'react'

/**
 * Minimal path router for the app's routes. Uses the History API and
 * popstate (no dependency, no hash). Routes:
 *   /         landing (marketing)
 *   /builder  the builder (onboarding wizard when no draft yet)
 */

export type AppRoute = 'landing' | 'builder'

export const ROUTE_PATHS: Record<AppRoute, string> = {
  landing: '/',
  builder: '/builder',
}

export function routeFromPath(path: string): AppRoute {
  if (path === ROUTE_PATHS.builder) return 'builder'
  return 'landing'
}

/** Programmatic navigation; dispatches popstate so listeners stay in sync. */
export function navigateTo(route: AppRoute): void {
  const path = ROUTE_PATHS[route]
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname))

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return route
}

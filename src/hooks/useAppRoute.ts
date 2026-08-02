import { useEffect, useState } from 'react'

export type AppRoute = 'builder' | 'admin'

export function useAppRoute(): AppRoute {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return hash === '#/admin' ? 'admin' : 'builder'
}

export function navigateToAdmin(): void {
  window.location.hash = '#/admin'
}

export function navigateToBuilder(): void {
  window.location.hash = ''
}

import type { ReactNode } from 'react'
import { isBrowserSupported } from '@/lib/utils'

export function BrowserGuard({ children }: { children: ReactNode }) {
  if (!isBrowserSupported()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-background">
        <div className="max-w-md rounded-lg border border-status-danger/40 bg-badge-danger p-8 text-center">
          <h1 className="text-xl font-bold text-status-danger-foreground">
            Browser not supported
          </h1>
          <p className="mt-3 text-sm text-status-danger-foreground">
            This app needs local storage and file download support. Please use a recent
            version of Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

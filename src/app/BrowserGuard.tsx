import type { ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { isBrowserSupported } from '@/shared/lib/utils'

export function BrowserGuard({ children }: { children: ReactNode }) {
  if (!isBrowserSupported()) {
    return (
      <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-6">
        <Alert variant="destructive" className="max-w-md">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>Browser not supported</AlertTitle>
          <AlertDescription>
            This app needs local storage and file download support. Please use a recent version of Chrome, Firefox,
            Safari or Edge.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return <>{children}</>
}

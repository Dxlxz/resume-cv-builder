import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/**
 * Catches a failed route, most often a lazy chunk that did not load (offline, or a new deploy replaced it while the
 * tab was open), and offers a reload instead of leaving a blank page. Drafts are in localStorage, so a reload is safe.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main id="main-content" className="flex min-h-dvh items-center justify-center bg-background px-6">
        <Alert variant="destructive" className="max-w-md" role="alert">
          <TriangleAlertIcon aria-hidden />
          <AlertTitle>This page could not load</AlertTitle>
          <AlertDescription>Check your connection and reload. Your draft is saved in this browser.</AlertDescription>
          <AlertAction>
            <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </AlertAction>
        </Alert>
      </main>
    )
  }
}

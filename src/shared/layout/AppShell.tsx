import type { ReactNode } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { Brand } from '@/shared/ui/brand'
import { Button } from '@/shared/ui/button'
import { navigateTo } from '@/shared/hooks/useAppRoute'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'

/**
 * App shell: the persistent chrome for the non-builder flows (chooser, ATS checker). A quiet top bar —
 * back control, brand, page actions, theme — over the page content. The builder has its own toolbar.
 */

interface AppShellProps {
  children: ReactNode
  /** Leading back control in the header. Omit to hide. */
  backLabel?: string
  onBack?: () => void
  /** Optional trailing actions. */
  rightSlot?: ReactNode
}

export function AppShell({ children, backLabel = 'Home', onBack, rightSlot }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-2 px-4 py-2 sm:px-6">
          {onBack && (
            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2">
              <ArrowLeftIcon aria-hidden />
              {backLabel}
            </Button>
          )}
          <Brand onClick={() => navigateTo('landing')} />
          <div className="ml-auto flex items-center gap-2">
            {rightSlot}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
    </div>
  )
}

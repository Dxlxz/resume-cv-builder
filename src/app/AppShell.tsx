import type { ReactNode } from 'react'
import { Brand } from '@/components/ui/Brand'

/**
 * App shell — the persistent chrome for non-builder flows (onboarding).
 * Header hosts the leading back control (top-left), brand, and trailing
 * actions; content sits on the UDS canvas below. Matches the builder's
 * Toolbar chrome (bg-header, border-border, shadow-raised).
 */

interface AppShellProps {
  children: ReactNode
  /** Leading back control in the header (top-left). Omit to hide. */
  backLabel?: string
  onBack?: () => void
  /** Optional trailing actions (e.g. catalog link). */
  rightSlot?: ReactNode
}

export function AppShell({ children, backLabel = 'Home', onBack, rightSlot }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-header shadow-[var(--shadow-raised)]">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-2 px-5 py-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              {backLabel}
            </button>
          )}
          <span className="pl-2">
            <Brand />
          </span>
          {rightSlot && <div className="ml-auto flex flex-wrap items-center gap-2">{rightSlot}</div>}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

import type { ReactNode } from 'react'

/**
 * App shell - the persistent chrome for non-builder flows (onboarding).
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

function BrandMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
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
        <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </svg>
    </span>
  )
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
          <span className="flex items-center gap-2.5 pl-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Resume &amp; CV Builder
            </span>
          </span>
          {rightSlot && <div className="ml-auto flex flex-wrap items-center gap-2">{rightSlot}</div>}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}

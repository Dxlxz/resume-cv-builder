import { useState, type ReactNode } from 'react'
import type { SectionId } from '@rb/core/types/document'

interface FormSectionProps {
  sectionId: SectionId
  title: string
  children: ReactNode
  defaultOpen?: boolean
  hint?: string
  /** Trailing control shown next to the header (e.g. the Idrizz icon). */
  action?: ReactNode
}

export function FormSection({
  sectionId,
  title,
  children,
  defaultOpen = true,
  hint,
  action,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `form-section-panel-${sectionId}`

  return (
    <section
      id={`form-section-${sectionId}`}
      className="scroll-mt-4 rounded-md border border-border bg-card shadow-[var(--shadow-raised)] transition-shadow duration-[var(--duration-state)]"
    >
      <div className="flex items-center justify-between gap-1 pr-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md px-4 py-3.5 text-left hover:bg-muted/50"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="min-w-0">
            <span className="font-semibold text-foreground">{title}</span>
            {hint && !open && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
            )}
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-muted text-sm font-medium text-muted-foreground"
            aria-hidden="true"
          >
            {open ? '−' : '+'}
          </span>
        </button>
        {action}
      </div>
      {open && (
        <div id={panelId} className="space-y-4 border-t border-border px-4 py-4">
          {children}
        </div>
      )}
    </section>
  )
}

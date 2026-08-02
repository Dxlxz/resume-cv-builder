import { useState, type ReactNode } from 'react'
import type { SectionId } from '@rb/core/types/document'
import { IdrizzIconButton } from '@/components/ai/IdrizzIconButton'

interface FormSectionProps {
  sectionId: SectionId
  title: string
  children: ReactNode
  defaultOpen?: boolean
  hint?: string
  /** Section has content: shows a status dot in the header. */
  filled?: boolean
  /** AI guide text for this section (from meta.sectionGuides). */
  guide?: string
  /** Called with the new guide text; empty clears the guide. */
  onGuideChange?: (text: string) => void
}

export function FormSection({
  sectionId,
  title,
  children,
  defaultOpen = true,
  hint,
  filled,
  guide,
  onGuideChange,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [guideOpen, setGuideOpen] = useState(false)
  const panelId = `form-section-panel-${sectionId}`
  const guideId = `form-section-guide-${sectionId}`

  return (
    <section
      id={`form-section-${sectionId}`}
      className="scroll-mt-12 rounded-md border border-border bg-card shadow-[var(--shadow-raised)] transition-shadow duration-[var(--duration-state)]"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-md px-4 py-3.5 text-left hover:bg-muted/50"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            {filled !== undefined && (
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  filled ? 'bg-status-success' : 'bg-foreground/20'
                }`}
              />
            )}
            {title}
          </span>
          {hint && !open && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <span
          aria-hidden
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-transform duration-[var(--duration-state)] ${
            open ? 'rotate-180' : ''
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      {open && (
        <div id={panelId} className="space-y-4 border-t border-border px-4 py-4">
          {children}
          {onGuideChange && (
            <div className="border-t border-border pt-3">
              {!guideOpen ? (
                <div className="flex items-center gap-2">
                  <IdrizzIconButton
                    label={guide ? 'Edit Idrizz guide' : 'Set how Idrizz writes this section'}
                    onClick={() => setGuideOpen(true)}
                  />
                  {guide && (
                    <button
                      type="button"
                      onClick={() => setGuideOpen(true)}
                      className="min-w-0 flex-1 truncate text-left text-xs leading-relaxed text-muted-foreground transition-colors duration-[var(--duration-state)] hover:text-foreground"
                    >
                      {guide}
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-slide-up space-y-1.5 rounded-md border border-border bg-muted/50 p-3">
                  <label htmlFor={guideId} className="text-xs font-medium text-foreground">
                    How should Idrizz write this section?
                  </label>
                  <textarea
                    id={guideId}
                    rows={2}
                    value={guide ?? ''}
                    onChange={(e) => onGuideChange(e.target.value)}
                    placeholder="e.g. British English, 2-4 sentences, lead with impact."
                    className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Saved in your document. Empty means Idrizz uses its default style.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

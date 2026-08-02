import { Button } from '@/components/ui/Button'

interface AiReviewProps {
  /** Label for the section being improved, e.g. "Summary". */
  label: string
  busy: boolean
  error: string | null
  result: string | null
  consentOpen: boolean
  onAcceptConsent: () => void
  onDeclineConsent: () => void
  onApply: () => void
  onRegenerate: () => void
  onDiscard: () => void
}

/**
 * Review panel for AI suggestions. Never applies anything itself: it shows
 * the result and lets the user apply, regenerate, or discard it.
 */
export function AiReview({
  label,
  busy,
  error,
  result,
  consentOpen,
  onAcceptConsent,
  onDeclineConsent,
  onApply,
  onRegenerate,
  onDiscard,
}: AiReviewProps) {
  if (consentOpen) {
    return (
      <div className="rounded-md border border-border bg-card p-4 text-sm shadow-[var(--shadow-raised)]">
        <p className="font-semibold text-foreground">AI assistance</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          This sends the text of this section to an external AI service (OpenCode Go, running
          DeepSeek). Nothing is stored or used for training, and your draft stays in this browser
          unless you ask for help.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={onAcceptConsent}>
            I understand, continue
          </Button>
          <Button type="button" variant="ghost" onClick={onDeclineConsent}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (busy) {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        Improving {label.toLowerCase()}...
      </p>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-status-danger/30 bg-badge-danger px-3 py-2 text-sm text-status-danger-foreground">
        {error}{' '}
        <button type="button" className="underline" onClick={onRegenerate}>
          Try again
        </button>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Suggested {label.toLowerCase()}
        </p>
        <p className="text-xs text-muted-foreground">AI generated, review before applying</p>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onApply}>
          Apply
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onRegenerate}>
          Regenerate
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}

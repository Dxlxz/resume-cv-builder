import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { Button } from '@/components/ui/Button'
import { AiReview } from '@/components/ai/AiReview'
import { useAi } from '@/hooks/useAi'
import { parseTailorResult } from '@/lib/ai/prompts'

interface TailorToJobProps {
  onClose: () => void
}

/**
 * Paste a job description to tailor the document: a rewritten summary,
 * missing keywords, and bullet suggestions. Suggestions are advisory;
 * only the summary can be applied in one click.
 */
export function TailorToJob({ onClose }: TailorToJobProps) {
  const document = useDocumentStore((s) => s.document)
  const updateSummary = useDocumentStore((s) => s.updateSummary)
  const [jobDescription, setJobDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const lastPayloadRef = useRef<unknown>(null)
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent, discard } =
    useAi('tailor-to-job')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!document) return null

  const buildPayload = () => ({
    jobDescription,
    summary: document.summary,
    skills: document.skills.flatMap((group) => group.items),
    experience: document.experience.map((e) => ({
      title: e.title,
      company: e.company,
      bullets: e.bullets,
    })),
    documentType: document.meta.documentType,
  })

  const runTailor = () => {
    const payload = buildPayload()
    lastPayloadRef.current = payload
    run(payload)
  }

  const parsed = result ? parseTailorResult(result) : null

  const copyKeywords = async () => {
    if (!parsed) return
    try {
      await navigator.clipboard.writeText(parsed.missingKeywords.join(', '))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable: user can select the text manually
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-modal)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Tailor to a job
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste the job description. You get a summary rewrite, keywords to
              add, and bullet suggestions. Nothing changes until you apply it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm px-2 py-1 text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="tailor-job-description" className="block text-sm font-medium text-foreground">
            Job description
          </label>
          <textarea
            id="tailor-job-description"
            className="min-h-40 w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
            placeholder="Paste the job posting here, including requirements and responsibilities."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Button type="button" onClick={runTailor} disabled={busy || !jobDescription.trim()}>
            Tailor my document
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          <AiReview
            label="Tailoring"
            busy={busy}
            error={error}
            result={null}
            consentOpen={consentOpen}
            onAcceptConsent={acceptConsent}
            onDeclineConsent={declineConsent}
            onApply={() => {}}
            onRegenerate={() => {
              if (lastPayloadRef.current !== null) run(lastPayloadRef.current)
            }}
            onDiscard={discard}
          />

          {parsed && !consentOpen && !busy && !error && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tailored summary
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      updateSummary(parsed.tailoredSummary)
                      discard()
                      onClose()
                    }}
                  >
                    Apply summary
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {parsed.tailoredSummary}
                </p>
              </div>

              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Keywords to add
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void copyKeywords()}
                    disabled={parsed.missingKeywords.length === 0}
                  >
                    {copied ? 'Copied' : 'Copy list'}
                  </Button>
                </div>
                {parsed.missingKeywords.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsed.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No missing keywords found.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Add the ones you can honestly claim to your skills section.
                </p>
              </div>

              {parsed.bulletSuggestions && (
                <div className="rounded-md border border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Bullet suggestions
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {parsed.bulletSuggestions}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Advisory: apply these by editing the roles, or run Improve
                    bullets on a role with these in mind.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

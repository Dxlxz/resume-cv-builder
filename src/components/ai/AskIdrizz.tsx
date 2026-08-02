import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { useAi } from '@/hooks/useAi'
import { buildDocumentContext, parseAiEditPlan } from '@/lib/ai/edits'
import { IdrizzIconButton } from '@/components/ai/IdrizzIconButton'
import { AiEditReview } from '@/components/ai/AiEditReview'
import { Button } from '@/components/ui/Button'

/**
 * Ask Idrizz: free-text instruction or a preset chip. Idrizz replies with
 * a typed JSON edit plan, reviewed section by section before applying.
 */

const PRESETS: { label: string; instruction: string }[] = [
  {
    label: 'Rewrite my summary',
    instruction: 'Rewrite my professional summary to be tighter and more persuasive.',
  },
  {
    label: 'Improve my bullets',
    instruction:
      'Improve the bullet points across my experience: stronger verbs, measurable outcomes, no invented facts.',
  },
  {
    label: 'Tailor to a job',
    instruction: 'Tailor my document to this job description:\n\n',
  },
]

interface AskIdrizzProps {
  /** Prefilled instruction (e.g. from a section's Idrizz icon). */
  initialInstruction?: string
}

export function AskIdrizz({ initialInstruction = '' }: AskIdrizzProps) {
  const document = useDocumentStore((s) => s.document)
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent, discard } =
    useAi('ai-edit')
  const [instruction, setInstruction] = useState(initialInstruction)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialInstruction) inputRef.current?.focus()
  }, [initialInstruction])

  if (!document) return null

  const plan = result ? parseAiEditPlan(result) : null
  const parseFailed = result !== null && plan === null

  const send = () => {
    const text = instruction.trim()
    if (!text || busy) return
    run({ instruction: text, context: buildDocumentContext(document) })
  }

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-2.5">
        <IdrizzIconButton size="md" onClick={() => inputRef.current?.focus()} />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ask Idrizz</h3>
          <p className="text-xs text-muted-foreground">
            Edits, adds, and removes sections. Review before applying.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors duration-[var(--duration-state)] hover:text-foreground"
            onClick={() => {
              setInstruction(preset.instruction)
              inputRef.current?.focus()
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <textarea
          ref={inputRef}
          rows={2}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="Tell Idrizz what to do, e.g. add a projects section, trim my bullets, or tailor to a job description..."
          className="min-h-14 w-full flex-1 rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        />
        <Button type="button" onClick={send} disabled={busy || !instruction.trim()}>
          {busy ? 'Working...' : 'Send'}
        </Button>
      </div>

      {busy && (
        <p className="mt-3 text-xs text-muted-foreground" role="status">
          Idrizz is working...
        </p>
      )}

      {consentOpen && (
        <div className="mt-3 rounded-md border border-border bg-muted p-4 text-sm">
          <p className="font-semibold text-foreground">Idrizz needs your OK</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            This sends your instruction and document text to an external AI service (OpenCode Go,
            running DeepSeek). Nothing is stored or used for training, and nothing changes until
            you apply it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={acceptConsent}>
              I understand, continue
            </Button>
            <Button type="button" variant="ghost" onClick={declineConsent}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md border border-status-danger/30 bg-badge-danger px-3 py-2 text-sm text-status-danger-foreground">
          {error}{' '}
          <button type="button" className="underline" onClick={send}>
            Try again
          </button>
        </div>
      )}

      {parseFailed && (
        <div className="mt-3 rounded-md border border-status-warning/30 bg-badge-warning px-3 py-2 text-sm text-status-warning-foreground">
          Idrizz could not turn that into edits. Try a different instruction.
        </div>
      )}

      {plan && (
        <div className="mt-4">
          <AiEditReview plan={plan} onDiscard={discard} onApplied={discard} />
        </div>
      )}
    </div>
  )
}

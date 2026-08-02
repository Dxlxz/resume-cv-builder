import { useDocumentStore } from '@/app/store/documentStore'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { AiReview } from '@/components/ai/AiReview'
import { useAi } from '@/hooks/useAi'
import { getPreset } from '@rb/presets/registry'
import { FORM_PLACEHOLDERS } from '@/lib/formPlaceholders'

export function SummaryForm() {
  const document = useDocumentStore((s) => s.document)
  const updateSummary = useDocumentStore((s) => s.updateSummary)
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent, discard } =
    useAi('improve-summary')

  if (!document) return null

  const runImprove = () =>
    run({
      summary: document.summary,
      experience: document.experience.map((e) => ({
        title: e.title,
        company: e.company,
        bullets: e.bullets,
      })),
      documentType: document.meta.documentType,
      presetName: getPreset(document.meta.presetId).name,
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <TextArea
            label="Professional summary"
            value={document.summary}
            onChange={(e) => updateSummary(e.target.value)}
            placeholder={FORM_PLACEHOLDERS.summary}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={runImprove}
          disabled={busy}
        >
          Improve with AI
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Tip: 2-4 sentences on your focus, stack, and the kind of roles you want.
      </p>
      <AiReview
        label="Summary"
        busy={busy}
        error={error}
        result={result}
        consentOpen={consentOpen}
        onAcceptConsent={acceptConsent}
        onDeclineConsent={declineConsent}
        onApply={() => {
          if (result) updateSummary(result)
          discard()
        }}
        onRegenerate={runImprove}
        onDiscard={discard}
      />
    </div>
  )
}

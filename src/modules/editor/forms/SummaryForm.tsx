import { useDocumentStore } from '@/modules/document'
import { TextAreaField } from '@/shared/ui/form-field'
import { FORM_PLACEHOLDERS } from '../formPlaceholders'

export function SummaryForm() {
  const summary = useDocumentStore((s) => s.document?.summary ?? '')
  const updateSummary = useDocumentStore((s) => s.updateSummary)

  return (
    <div className="space-y-2">
      <TextAreaField
        label="Professional summary"
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        placeholder={FORM_PLACEHOLDERS.summary}
      />
      <p className="text-xs text-muted-foreground">
        Tip: 2-4 sentences on your focus, stack, and the kind of roles you want.
      </p>
    </div>
  )
}

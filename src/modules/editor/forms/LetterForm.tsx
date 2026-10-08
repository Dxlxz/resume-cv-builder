import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { TextField } from '@/shared/ui/form-field'
import { TextAreaField } from '@/shared/ui/form-field'
import { Button } from '@/shared/ui/button'

/**
 * Cover-letter body. The sender's own details come from the Contact section,
 * which the letter shares with the resume — only the parts a resume has no
 * equivalent for live here.
 */
export function LetterForm() {
  const letter = useDocumentStore((s) => s.document?.letter)
  const updateLetter = useDocumentStore((s) => s.updateLetter)

  const paragraphs = letter?.paragraphs ?? []

  const setParagraph = (index: number, text: string) => {
    const next = [...paragraphs]
    next[index] = text
    updateLetter({ paragraphs: next })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Date"
          value={letter?.date ?? ''}
          onChange={(e) => updateLetter({ date: e.target.value })}
          placeholder="12 August 2026"
        />
        <TextField
          label="Company"
          value={letter?.company ?? ''}
          onChange={(e) => updateLetter({ company: e.target.value })}
          placeholder="Shell Malaysia"
        />
        <TextField
          label="Recipient name"
          value={letter?.recipientName ?? ''}
          onChange={(e) => updateLetter({ recipientName: e.target.value })}
          placeholder="Ms Nurul Rahman"
        />
        <TextField
          label="Recipient title"
          value={letter?.recipientTitle ?? ''}
          onChange={(e) => updateLetter({ recipientTitle: e.target.value })}
          placeholder="Hiring Manager"
        />
      </div>

      <TextField
        label="Company address"
        value={letter?.companyAddress ?? ''}
        onChange={(e) => updateLetter({ companyAddress: e.target.value })}
        placeholder="Kuala Lumpur, Malaysia"
      />

      <TextField
        label="Salutation"
        value={letter?.salutation ?? ''}
        onChange={(e) => updateLetter({ salutation: e.target.value })}
        placeholder="Dear Ms Rahman,"
      />

      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => (
          <TextAreaField
            key={index}
            label={`Paragraph ${index + 1}`}
            value={paragraph}
            onChange={(e) => setParagraph(index, e.target.value)}
            placeholder={
              index === 0
                ? 'Why you are writing, and the role you want.'
                : 'What you have done that proves you can do it.'
            }
          />
        ))}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateLetter({ paragraphs: [...paragraphs, ''] })}
          >
            <PlusIcon data-icon="inline-start" aria-hidden />
            Add paragraph
          </Button>
          {paragraphs.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateLetter({ paragraphs: paragraphs.slice(0, -1) })}
            >
              <Trash2Icon data-icon="inline-start" aria-hidden />
              Remove last
            </Button>
          )}
        </div>
      </div>

      <TextField
        label="Closing"
        value={letter?.closing ?? ''}
        onChange={(e) => updateLetter({ closing: e.target.value })}
        placeholder="Yours sincerely,"
      />
      <p className="text-xs text-muted-foreground">
        Your name is printed under the closing, from the Contact section.
      </p>
    </div>
  )
}

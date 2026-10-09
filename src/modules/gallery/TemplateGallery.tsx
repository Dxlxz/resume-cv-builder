import { useMemo, useRef } from 'react'
import { CheckIcon, Loader2Icon } from 'lucide-react'
import { TEMPLATE_LIST } from '@rb/templates/registry'
import type { TemplateId } from '@rb/core/types/document'
import { useDocumentStore } from '@/modules/document'
import { PdfPageViewer } from '@/modules/pdf'
import { Badge } from '@/shared/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { useTemplateThumbnails, type ThumbnailState } from './useTemplateThumbnails'

interface TemplateGalleryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Where keyboard focus goes when the dialog closes (the control that opened it). */
  returnFocusTo?: React.RefObject<HTMLElement | null>
}

/**
 * Pick a template by looking at it: each card is the user's own page 1 in that template. Cards form one radio group,
 * so the arrow keys move between them and Enter or Space chooses.
 */
export function TemplateGallery({ open, onOpenChange, returnFocusTo }: TemplateGalleryProps) {
  const document = useDocumentStore((s) => s.document)
  const setTemplate = useDocumentStore((s) => s.setTemplate)
  const ids = useMemo(() => TEMPLATE_LIST.map((t) => t.id), [])
  const thumbnails = useTemplateThumbnails(document, ids, open)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  if (!document) return null
  const current = document.meta.templateId

  const choose = (id: TemplateId) => {
    if (id !== current) setTemplate(id)
    onOpenChange(false)
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = TEMPLATE_LIST[(index + step + TEMPLATE_LIST.length) % TEMPLATE_LIST.length]
    refs.current[next.id]?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92dvh] gap-3 overflow-y-auto sm:max-w-5xl"
        // No DialogTrigger here, so Radix cannot find where to return focus; hand it back to the opener ourselves.
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusTo?.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>
            Each preview is your own page 1. Your content stays the same when you switch.
          </DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATE_LIST.map((template, index) => {
            const selected = template.id === current
            return (
              <button
                key={template.id}
                ref={(el) => {
                  refs.current[template.id] = el
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => choose(template.id)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`flex min-w-0 flex-col gap-2 rounded-xl bg-card p-2 text-left outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  selected ? 'ring-2 ring-primary' : 'ring-1 ring-foreground/10 hover:ring-foreground/30'
                }`}
              >
                <Thumbnail state={thumbnails[template.id]} name={template.name} />
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {template.name}
                  {selected && <CheckIcon className="size-4 text-primary" aria-hidden />}
                  {selected && <span className="sr-only">(current)</span>}
                </span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
                <span className="flex flex-wrap gap-1">
                  <Badge variant="outline">
                    {template.columns === 1 ? 'One column' : 'Two columns'}
                  </Badge>
                  {template.id === 'ats-strict' ? (
                    <Badge variant="success-light">
                      Portal-safe
                    </Badge>
                  ) : (
                    template.atsOptimized && (
                      <Badge variant="success-light">
                        ATS-friendly
                      </Badge>
                    )
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Thumbnail({ state, name }: { state: ThumbnailState; name: string }) {
  return (
    <span
      className="relative block aspect-[1/1.414] w-full overflow-hidden rounded-md bg-paper text-paper-foreground ring-1 ring-foreground/10"
      data-testid="template-thumbnail"
    >
      {state.status === 'ready' && (
        <PdfPageViewer blob={state.blob} maxPages={1} className="pointer-events-none h-full w-full bg-paper text-paper-foreground p-0" />
      )}
      {state.status === 'loading' && (
        <span className="absolute inset-0 flex items-center justify-center text-paper-foreground/70" role="status">
          <Loader2Icon className="size-5 animate-spin" aria-hidden />
          <span className="sr-only">Preparing {name} preview</span>
        </span>
      )}
      {state.status === 'error' && (
        <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-paper-foreground/70">
          Preview unavailable
        </span>
      )}
    </span>
  )
}

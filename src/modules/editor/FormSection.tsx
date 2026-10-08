import type { ReactNode } from 'react'
import { CircleCheckIcon, CircleDashedIcon } from 'lucide-react'
import type { SectionId } from '@rb/core/types/document'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion'

interface FormSectionProps {
  sectionId: SectionId
  title: string
  children: ReactNode
  hint?: string
  /** Section has content: shows a completed marker in the header. */
  filled?: boolean
}

/**
 * One editor section: an accordion item whose header carries the section's status as an icon plus
 * text for assistive technology (status is never colour alone). Open state is owned by the editor panel.
 */
export function FormSection({ sectionId, title, children, hint, filled }: FormSectionProps) {
  return (
    <AccordionItem
      value={sectionId}
      id={`form-section-${sectionId}`}
      className="scroll-mt-14 rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow not-last:border-b-0"
    >
      <AccordionTrigger className="min-w-0 items-center gap-2 px-4 py-3 hover:no-underline">
        <span className="flex min-w-0 items-center gap-3">
          {filled !== undefined &&
            (filled ? (
              <CircleCheckIcon className="size-4 shrink-0 text-success-foreground" aria-hidden />
            ) : (
              <CircleDashedIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            ))}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">
              {title}
              {filled !== undefined && <span className="sr-only">{filled ? ' (complete)' : ' (not started)'}</span>}
            </span>
            {hint && <span className="block truncate text-xs font-normal text-muted-foreground">{hint}</span>}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 border-t border-border px-4 pt-4 pb-4">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

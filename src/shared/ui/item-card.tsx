import type { ReactNode } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from 'cn'

/*
 * Application pattern (origin: internal): one repeated entry in a list form (a role, a degree, a
 * certification). A quiet panel with a title and a remove action; the form fields are its children.
 */

interface ItemCardProps {
  title: ReactNode
  onRemove: () => void
  /** Visible label for the remove action, for example "Remove role". */
  removeLabel?: string
  /** Full accessible name when several cards share one visible label, for example "Remove education 2". */
  removeAriaLabel?: string
  className?: string
  children: ReactNode
}

export function ItemCard({ title, onRemove, removeLabel = 'Remove', removeAriaLabel, className, children }: ItemCardProps) {
  return (
    <section className={cn('space-y-4 rounded-lg border border-border bg-muted/30 p-4', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive-foreground hover:bg-destructive/10 hover:text-destructive-foreground"
          onClick={onRemove}
          aria-label={removeAriaLabel}
        >
          <Trash2Icon data-icon="inline-start" aria-hidden />
          {removeLabel}
        </Button>
      </header>
      {children}
    </section>
  )
}

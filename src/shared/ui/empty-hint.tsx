import type { ReactNode } from 'react'

interface EmptyHintProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyHint({ title, description, action }: EmptyHintProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/60 px-4 py-6 text-center">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

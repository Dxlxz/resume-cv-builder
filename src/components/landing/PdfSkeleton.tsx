/** Abstract page skeleton, shown while a real PDF renders. */
export function PdfSkeleton() {
  const bar = (w: string, tone: 'fg' | 'muted' | 'faint') =>
    `h-2 rounded-full ${w} ${
      tone === 'fg'
        ? 'bg-foreground/70'
        : tone === 'muted'
          ? 'bg-foreground/40'
          : 'bg-foreground/20'
    }`
  return (
    <div className="w-full p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20" />
        <div className="flex-1 space-y-1.5">
          <div className={bar('w-2/3', 'fg')} />
          <div className={bar('w-2/5', 'muted')} />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-11/12', 'muted')} />
        <div className={bar('w-4/5', 'faint')} />
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-3/4', 'faint')} />
        <div className={bar('w-10/12', 'muted')} />
        <div className={bar('w-2/3', 'faint')} />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-status-success" />
        <div className={bar('w-1/3', 'muted')} />
      </div>
    </div>
  )
}

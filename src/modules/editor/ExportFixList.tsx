import { useEffect } from 'react'
import { CircleAlertIcon, CircleCheckIcon, XIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { jumpToIssue } from '@/shared/lib/scrollToSection'
import { useTrackedIssues } from '@/shared/hooks/useTrackedIssues'
import { Button } from '@/shared/ui/button'

/** After this long with everything fixed, the list closes itself. */
const AUTO_CLOSE_MS = 4000

/**
 * What blocks export, in the editor next to the fields it is about. It replaces the modal that used to cover the form:
 * each item jumps to its field, fixed items stay with a tick, and the list closes when everything is fixed.
 */
export function ExportFixList() {
  const show = useDocumentStore((s) => s.showFixList)
  // The tracking record lives in the inner component, so each opening starts with a clean slate.
  return show ? <OpenFixList /> : null
}

function OpenFixList() {
  const setShow = useDocumentStore((s) => s.setShowFixList)
  const lintIssues = useDocumentStore((s) => s.lintIssues)

  const blocking = lintIssues.filter((issue) => issue.level === 'error')
  const items = useTrackedIssues(blocking)
  const open = items.filter((item) => !item.resolved).length
  const allFixed = items.length > 0 && open === 0

  useEffect(() => {
    if (!allFixed) return
    const timer = window.setTimeout(() => setShow(false), AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [allFixed, setShow])

  if (items.length === 0) return null

  return (
    <section
      aria-label="What to fix before exporting"
      className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          {allFixed ? 'Ready to export. Press Export PDF.' : `Fix ${open} ${open === 1 ? 'thing' : 'things'} before exporting`}
        </h3>
        <p role="status" className="sr-only">
          {allFixed ? 'Everything is fixed. Press Export PDF.' : ''}
        </p>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Close the fix list" onClick={() => setShow(false)}>
          <XIcon aria-hidden />
        </Button>
      </div>
      <ul className="mt-2 space-y-1">
        {items.map(({ issue, resolved }) => (
          <li key={`${issue.code}|${issue.field ?? ''}|${issue.message}`}>
            <button
              type="button"
              onClick={() => jumpToIssue(issue)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {resolved ? (
                <CircleCheckIcon className="size-4 shrink-0 text-success-foreground" aria-hidden />
              ) : (
                <CircleAlertIcon className="size-4 shrink-0 text-destructive-foreground" aria-hidden />
              )}
              <span className={resolved ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {issue.message}
                <span className="sr-only">{resolved ? ' (fixed)' : ' (needs fixing)'}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

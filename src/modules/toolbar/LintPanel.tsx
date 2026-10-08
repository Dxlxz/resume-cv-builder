import { useRef, useState } from 'react'
import { ChevronDownIcon, CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react'
import type { LintIssue } from '@rb/validators/types'
import type { SectionId } from '@rb/core/types/document'
import { useDocumentStore } from '@/modules/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { summarizeChecks } from '@rb/validators/score'
import { jumpToIssue } from '@/shared/lib/scrollToSection'
import { useTrackedIssues } from '@/shared/hooks/useTrackedIssues'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

const LEVEL_ICON = {
  error: { Icon: CircleAlertIcon, className: 'text-destructive-foreground', label: 'Error' },
  warning: { Icon: TriangleAlertIcon, className: 'text-warning-foreground', label: 'Warning' },
  info: { Icon: InfoIcon, className: 'text-info-foreground', label: 'Suggestion' },
} as const

const GROUP_TITLES: Record<LintIssue['level'], string> = {
  error: 'Must fix before export',
  warning: 'ATS risks',
  info: 'Polish tips (optional)',
}

const STATUS_BADGE = {
  ready: 'success-light',
  risks: 'warning-light',
  blocked: 'destructive-light',
} as const

interface LintPanelProps {
  onClose: () => void
  onProceed?: () => void
  showProceed?: boolean
}

export function LintPanel({ onClose, onProceed, showProceed }: LintPanelProps) {
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const lintIssues = useDocumentStore((s) => s.lintIssues)
  const proofStatus = useDocumentStore((s) => s.atsProofStatus)
  const pageSize = useDocumentStore((s) => s.document?.meta.pageSize)

  const [filter, setFilter] = useState<SectionId | 'all'>('all')

  const tracked = useTrackedIssues(lintIssues)
  const fixed = tracked.filter((item) => item.resolved)
  const summary = summarizeChecks(lintIssues)

  const errors = lintIssues.filter((i) => i.level === 'error')
  const warnings = lintIssues.filter((i) => i.level === 'warning')
  const infos = lintIssues.filter((i) => i.level === 'info')

  const filterableSections = Array.from(
    new Set(lintIssues.map((i) => i.section).filter((s): s is SectionId => s !== undefined)),
  )
  const applyFilter = (issues: LintIssue[]) => (filter === 'all' ? issues : issues.filter((i) => i.section === filter))

  // The dialog is modal, so a jump closes it first; the editor then scrolls to the section or field.
  const jumped = useRef(false)
  const jumpTo = (issue: LintIssue) => {
    jumped.current = true
    onClose()
    jumpToIssue(issue)
  }

  const renderGroup = (level: LintIssue['level'], items: LintIssue[]) => {
    if (!items.length) return null
    const { Icon, className, label } = LEVEL_ICON[level]
    return (
      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="group w-full justify-start px-1 font-semibold">
            {GROUP_TITLES[level]}
            <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
            <ChevronDownIcon
              data-icon="inline-end"
              className="ml-auto transition-transform group-data-[state=closed]:-rotate-90"
              aria-hidden
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="space-y-2">
            {items.map((issue, idx) => (
              <li key={`${issue.code}-${idx}`} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-sm">
                <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} aria-hidden />
                <span className="sr-only">{label}: </span>
                <button
                  type="button"
                  onClick={() => jumpTo(issue)}
                  className="min-w-0 flex-1 rounded-sm text-left outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {issue.message}
                </button>
                {issue.section && (
                  <Badge variant="outline" size="lg" className="shrink-0" aria-hidden>
                    {getSectionLabel(issue.section, {})}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  let pageInfo = [
    pageSize === 'letter' ? 'US Letter' : 'A4',
    previewPageCount > 0 ? `${previewPageCount} page${previewPageCount === 1 ? '' : 's'}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const lastFill = layoutPlan?.plan.fillRatio[layoutPlan.plan.pageCount - 1]
  if (lastFill !== undefined) {
    pageInfo = pageInfo
      ? `${pageInfo} · last page ${Math.round(lastFill * 100)}% full`
      : `Last page ${Math.round(lastFill * 100)}% full`
  }

  const tipsNote = summary.tips > 0 ? ` ${summary.tips} optional polish tip${summary.tips === 1 ? '' : 's'} below.` : ''
  const verdict =
    errors.length > 0
      ? {
          variant: 'destructive' as const,
          Icon: CircleAlertIcon,
          text: `Fix ${errors.length} item${errors.length === 1 ? '' : 's'} before exporting.`,
        }
      : warnings.length > 0
        ? {
            variant: 'warning' as const,
            Icon: TriangleAlertIcon,
            text: `${warnings.length} ATS risk${warnings.length === 1 ? '' : 's'}: something a parser or a recruiter's search could miss.${tipsNote}`,
          }
        : {
            variant: 'success' as const,
            Icon: CircleCheckIcon,
            text:
              proofStatus === 'done'
                ? `ATS ready: the exported PDF reads back in full and in order.${tipsNote}`
                : `No ATS risks in your content. The PDF read-back check ${proofStatus === 'pending' ? 'runs when the preview updates' : 'could not run in this browser'}.${tipsNote}`,
          }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[90dvh] gap-4 overflow-y-auto sm:max-w-2xl"
        // A jump to a field moves focus there; do not hand it back to the ATS Check button.
        onCloseAutoFocus={(event) => {
          if (jumped.current) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>ATS Check Results</DialogTitle>
          <DialogDescription>{pageInfo}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STATUS_BADGE[summary.status]} size="lg" radius="full">
            {summary.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {summary.errors} to fix · {summary.risks} ATS risk{summary.risks === 1 ? '' : 's'} · {summary.tips} tip
            {summary.tips === 1 ? '' : 's'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          ATS systems do not reject resumes for style. Risks are what stops a parser reading your PDF; tips are optional.
        </p>

        <Alert variant={verdict.variant} role="status">
          <verdict.Icon aria-hidden />
          <AlertDescription>{verdict.text}</AlertDescription>
        </Alert>

        {lintIssues.length === 0 && (
          <p className="text-sm text-muted-foreground">Your document passes ATS checks for the current preset.</p>
        )}

        {filterableSections.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by section">
            <Button
              type="button"
              size="xs"
              variant={filter === 'all' ? 'secondary' : 'outline'}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            {filterableSections.map((section) => (
              <Button
                key={section}
                type="button"
                size="xs"
                variant={filter === section ? 'secondary' : 'outline'}
                aria-pressed={filter === section}
                onClick={() => setFilter(section)}
              >
                {getSectionLabel(section, {})}
              </Button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {renderGroup('error', applyFilter(errors))}
          {renderGroup('warning', applyFilter(warnings))}
          {renderGroup('info', applyFilter(infos))}
          {fixed.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-sm font-semibold text-foreground">
                Fixed <span className="text-xs font-normal text-muted-foreground">{fixed.length}</span>
              </p>
              <ul className="space-y-2">
                {fixed.map(({ issue }) => (
                  <li key={`fixed-${issue.code}|${issue.field ?? ''}|${issue.message}`} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 text-sm text-muted-foreground">
                    <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-success-foreground" aria-hidden />
                    <span className="sr-only">Fixed: </span>
                    <span className="line-through">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showProceed && onProceed && errors.length === 0 && <Button onClick={onProceed}>Export PDF anyway</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

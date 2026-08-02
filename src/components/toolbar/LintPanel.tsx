import type { LintIssue } from '@rb/validators/types'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { scoreDocument } from '@rb/validators/score'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'

const LEVEL_STYLES: Record<LintIssue['level'], string> = {
  error: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
  warning: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
  info: 'border-status-info/30 bg-badge-info text-status-info-foreground',
}

const BAND_TONES: Record<'excellent' | 'good' | 'fair' | 'poor', { stroke: string; chip: string }> = {
  excellent: {
    stroke: 'var(--color-status-success)',
    chip: 'border-status-success/30 bg-badge-success text-status-success-foreground',
  },
  good: {
    stroke: 'var(--color-status-warning)',
    chip: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
  },
  fair: {
    stroke: 'var(--color-status-warning)',
    chip: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
  },
  poor: {
    stroke: 'var(--color-status-danger)',
    chip: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
  },
}

const GROUP_TITLES: Record<LintIssue['level'], string> = {
  error: 'Errors (must fix)',
  warning: 'Warnings',
  info: 'Suggestions',
}

interface LintPanelProps {
  issues: LintIssue[]
  onClose: () => void
  onProceed?: () => void
  showProceed?: boolean
}

export function LintPanel({ issues, onClose, onProceed, showProceed }: LintPanelProps) {
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)

  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const infos = issues.filter((i) => i.level === 'info')
  const score = scoreDocument(issues)
  const tone = BAND_TONES[score.band]

  const RADIUS = 34
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dash = (score.score / 100) * CIRCUMFERENCE

  const pageSize = useDocumentStore((s) => s.document?.meta.pageSize)
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

  const jumpTo = (issue: LintIssue) => {
    if (issue.field === 'fullName') {
      window.document.getElementById('contact-full-name')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (issue.field === 'email' || issue.field === 'location') {
      window.document
        .getElementById(`contact-${issue.field}`)
        ?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (issue.section) {
      scrollToFormSection(issue.section)
    }
  }

  const renderGroup = (level: LintIssue['level'], items: LintIssue[]) => {
    if (!items.length) return null
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          {GROUP_TITLES[level]}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{items.length}</span>
        </h3>
        <ul className="space-y-2">
          {items.map((issue, idx) => (
            <li key={`${issue.code}-${idx}`}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 rounded-sm border px-3 py-2 text-left text-sm ${LEVEL_STYLES[issue.level]}`}
                onClick={() => jumpTo(issue)}
              >
                <span className="min-w-0 flex-1">{issue.message}</span>
                {issue.section && (
                  <span
                    className="mt-0.5 shrink-0 rounded-full bg-card/60 px-2 py-0.5 text-[10px] font-medium"
                    aria-hidden
                  >
                    {getSectionLabel(issue.section, {})}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const verdict =
    errors.length > 0
      ? {
          tone: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
          text: `Score ${score.score} - fix ${errors.length} error${errors.length === 1 ? '' : 's'} before exporting.`,
        }
      : warnings.length > 0
        ? {
            tone: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
            text: `Score ${score.score} - ${warnings.length} warning${warnings.length === 1 ? '' : 's'} to review.`,
          }
        : {
            tone: 'border-status-success/30 bg-badge-success text-status-success-foreground',
            text: `Score ${score.score} - ready to export.`,
          }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6">
        <DialogTitle className="text-lg font-bold text-foreground">ATS Check Results</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {pageInfo}
        </DialogDescription>

        <div className="mt-4 flex items-center gap-4">
          <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" aria-hidden>
            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              stroke={tone.stroke}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-3xl font-bold leading-none text-foreground" aria-label={`ATS score ${score.score} out of 100`}>
              {score.score}
              <span className="text-base font-medium text-muted-foreground">/100</span>
            </p>
            <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${tone.chip}`}>
              {score.bandLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <p className={`rounded-md border px-3 py-2 text-sm ${verdict.tone}`} aria-live="polite">
            {verdict.text}
          </p>

          {issues.length === 0 && (
            <p className="rounded-md border border-status-success/30 bg-badge-success px-3 py-2 text-sm text-status-success-foreground">
              Your document passes ATS checks for the current preset.
            </p>
          )}
          {renderGroup('error', errors)}
          {renderGroup('warning', warnings)}
          {renderGroup('info', infos)}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {showProceed && onProceed && errors.length === 0 && (
            <Button onClick={onProceed}>Export PDF anyway</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

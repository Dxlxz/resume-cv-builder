import { useEffect, useState } from 'react'
import type { LintIssue } from '@rb/validators/types'
import type { SectionId } from '@rb/core/types/document'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { scoreDocument } from '@rb/validators/score'
import { runValidation } from '@rb/validators/ats-lint'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'

const LEVEL_STYLES: Record<LintIssue['level'], string> = {
  error: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
  warning: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
  info: 'border-status-info/30 bg-badge-info text-status-info-foreground',
}

const GROUP_TITLES: Record<LintIssue['level'], string> = {
  error: 'Errors (must fix)',
  warning: 'Warnings',
  info: 'Suggestions',
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

interface LintPanelProps {
  onClose: () => void
  onProceed?: () => void
  showProceed?: boolean
}

export function LintPanel({ onClose, onProceed, showProceed }: LintPanelProps) {
  const document = useDocumentStore((s) => s.document)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const lintIssues = useDocumentStore((s) => s.lintIssues)
  const setLintIssues = useDocumentStore((s) => s.setLintIssues)
  const setFocusedSection = useDocumentStore((s) => s.setFocusedSection)
  const setShowLayoutBoxes = useDocumentStore((s) => s.setShowLayoutBoxes)
  const setShowLintPanel = useDocumentStore((s) => s.setShowLintPanel)

  const [filter, setFilter] = useState<SectionId | 'all'>('all')
  const [collapsed, setCollapsed] = useState<Record<LintIssue['level'], boolean>>({
    error: false,
    warning: false,
    info: false,
  })
  const [ringAnimated, setRingAnimated] = useState(false)

  // Live re-check: while the panel is open, validation re-runs (debounced)
  // as the document changes, so the score and rows stay current.
  useEffect(() => {
    if (!document) return
    const timer = setTimeout(() => {
      setLintIssues(runValidation(document, layoutPlan, previewPageCount))
    }, 400)
    return () => clearTimeout(timer)
  }, [document, layoutPlan, previewPageCount, setLintIssues])

  // The score ring draws in on open, then transitions to new values.
  useEffect(() => {
    const timer = setTimeout(() => setRingAnimated(true), 60)
    return () => clearTimeout(timer)
  }, [])

  const score = scoreDocument(lintIssues)
  const tone = BAND_TONES[score.band]

  const errors = lintIssues.filter((i) => i.level === 'error')
  const warnings = lintIssues.filter((i) => i.level === 'warning')
  const infos = lintIssues.filter((i) => i.level === 'info')

  const filterableSections = Array.from(
    new Set(lintIssues.map((i) => i.section).filter((s): s is SectionId => s !== undefined)),
  )
  const applyFilter = (issues: LintIssue[]) =>
    filter === 'all' ? issues : issues.filter((i) => i.section === filter)
  const visibleErrors = applyFilter(errors)
  const visibleWarnings = applyFilter(warnings)
  const visibleInfos = applyFilter(infos)

  const RADIUS = 34
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dash = (ringAnimated ? score.score : 0) * (CIRCUMFERENCE / 100)

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

  const viewOnLayout = (section: SectionId) => {
    setShowLintPanel(false)
    setShowLayoutBoxes(true)
    setFocusedSection(section)
  }

  const renderGroup = (level: LintIssue['level'], items: LintIssue[]) => {
    if (!items.length) return null
    const isCollapsed = collapsed[level]
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => ({ ...prev, [level]: !prev[level] }))}
          aria-expanded={!isCollapsed}
          className="flex w-full items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-sm font-semibold text-foreground"
        >
          {GROUP_TITLES[level]}
          <span className="text-xs font-normal text-muted-foreground">{items.length}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`ml-auto transition-transform duration-[var(--duration-state)] ${
              isCollapsed ? '-rotate-90' : 'rotate-0'
            }`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {!isCollapsed && (
          <ul className="space-y-2">
            {items.map((issue, idx) => (
              <li key={`${issue.code}-${idx}`}>
                <div
                  className={`flex w-full items-start gap-2 rounded-sm border px-3 py-2 text-left text-sm animate-slide-up ${LEVEL_STYLES[issue.level]}`}
                  style={{ animationDelay: `${Math.min(idx, 9) * 35}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => jumpTo(issue)}
                    className="min-w-0 flex-1 text-left"
                  >
                    {issue.message}
                  </button>
                  {issue.section && (
                    <span
                      className="mt-0.5 shrink-0 rounded-full bg-card/60 px-2 py-0.5 text-[10px] font-medium"
                      aria-hidden
                    >
                      {getSectionLabel(issue.section, {})}
                    </span>
                  )}
                  {issue.section && (
                    <button
                      type="button"
                      onClick={() => viewOnLayout(issue.section!)}
                      title={`Show ${getSectionLabel(issue.section, {})} on the layout`}
                      aria-label={`Show ${getSectionLabel(issue.section, {})} on the layout`}
                      className="mt-0.5 shrink-0 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground transition-colors duration-[var(--duration-state)] hover:bg-card/60"
                    >
                      View on layout
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

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
              style={{ transition: 'stroke-dasharray 500ms var(--ease-emphasis)' }}
            />
          </svg>
          <div className="min-w-0">
            <p
              className="text-3xl font-bold leading-none text-foreground"
              aria-label={`ATS score ${score.score} out of 100`}
            >
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

          {lintIssues.length === 0 && (
            <p className="rounded-md border border-status-success/30 bg-badge-success px-3 py-2 text-sm text-status-success-foreground">
              Your document passes ATS checks for the current preset.
            </p>
          )}

          {filterableSections.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                  filter === 'all'
                    ? 'border-border bg-card text-foreground'
                    : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {filterableSections.map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setFilter(section)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                    filter === section
                      ? 'border-border bg-card text-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getSectionLabel(section, {})}
                </button>
              ))}
            </div>
          )}

          {renderGroup('error', visibleErrors)}
          {renderGroup('warning', visibleWarnings)}
          {renderGroup('info', visibleInfos)}
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

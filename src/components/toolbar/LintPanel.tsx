import { useEffect } from 'react'
import type { LintIssue } from '@rb/validators/types'
import { Button } from '@/components/ui/Button'

const LEVEL_STYLES: Record<LintIssue['level'], string> = {
  error: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
  warning: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
  info: 'border-status-info/30 bg-badge-info text-status-info-foreground',
}

interface LintPanelProps {
  issues: LintIssue[]
  onClose: () => void
  onProceed?: () => void
  showProceed?: boolean
}

export function LintPanel({ issues, onClose, onProceed, showProceed }: LintPanelProps) {
  // Esc closes the panel (consistent with the PDF preview modal).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const infos = issues.filter((i) => i.level === 'info')

  const scrollToField = (issue: LintIssue) => {
    if (issue.field === 'fullName') {
      window.document.getElementById('contact-full-name')?.scrollIntoView({ behavior: 'smooth' })
    } else if (issue.field === 'email' || issue.field === 'location') {
      window.document.getElementById(`contact-${issue.field}`)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const renderGroup = (title: string, items: LintIssue[]) => {
    if (!items.length) return null
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ul className="space-y-2">
          {items.map((issue, idx) => (
            <li key={`${issue.code}-${idx}`}>
              <button
                type="button"
                className={`w-full rounded-sm border px-3 py-2 text-left text-sm ${LEVEL_STYLES[issue.level]}`}
                onClick={() => scrollToField(issue)}
              >
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      role="dialog"
      aria-labelledby="lint-panel-title"
      aria-modal="true"
    >
      <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-md bg-overlay-surface p-6 text-overlay-foreground shadow-[var(--shadow-modal)]">
        <h2 id="lint-panel-title" className="text-lg font-bold text-foreground">
          ATS Check Results
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {issues.length === 0
            ? 'No issues found. Ready to export.'
            : `${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} note(s)`}
        </p>

        <div className="mt-4 space-y-4">
          {issues.length === 0 && (
            <p className="rounded-md border border-status-success/30 bg-badge-success px-3 py-2 text-sm text-status-success-foreground">
              Your document passes ATS checks for the current preset.
            </p>
          )}
          {renderGroup('Errors (must fix)', errors)}
          {renderGroup('Warnings', warnings)}
          {renderGroup('Suggestions', infos)}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {showProceed && onProceed && errors.length === 0 && (
            <Button onClick={onProceed}>Export PDF anyway</Button>
          )}
        </div>
      </div>
    </div>
  )
}

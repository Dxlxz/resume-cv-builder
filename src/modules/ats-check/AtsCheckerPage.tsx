import { useState } from 'react'
import { CircleAlertIcon, CircleCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { AppShell } from '@/shared/layout/AppShell'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ReadPdfIllustration } from './ReadPdfIllustration'
import { checkAnyPdf, type AtsReport } from '@rb/validators/ats-proof/checkAnyPdf'

/**
 * Public ATS checker: drop in any PDF and see what a parser actually reads.
 *
 * The file never leaves the browser — the same posture as the rest of the app.
 * Everything here runs on pdf.js locally.
 */

const SEVERITY = {
  critical: { Icon: CircleAlertIcon, className: 'text-destructive-foreground', label: 'Critical' },
  warning: { Icon: TriangleAlertIcon, className: 'text-warning-foreground', label: 'Review' },
  ok: { Icon: CircleCheckIcon, className: 'text-success-foreground', label: 'Pass' },
} as const

export function AtsCheckerPage({ onHome }: { onHome: () => void }) {
  const [report, setReport] = useState<AtsReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [showText, setShowText] = useState(false)

  const run = async (file: File) => {
    setBusy(true)
    setError(null)
    setReport(null)
    setFileName(file.name)
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      setReport(await checkAnyPdf(bytes))
    } catch {
      setError('That file could not be read as a PDF. If it opens in a viewer, try exporting it again.')
    } finally {
      setBusy(false)
    }
  }

  const criticals = report?.checks.filter((c) => c.severity === 'critical').length ?? 0
  const warnings = report?.checks.filter((c) => c.severity === 'warning').length ?? 0

  return (
    <AppShell onBack={onHome} backLabel="Home">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight">ATS check</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          See what an applicant tracking system reads in your PDF. Your file stays in your browser — nothing is
          uploaded.
        </p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-input bg-card px-6 py-10 text-center transition-colors hover:bg-muted/50 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
          <ReadPdfIllustration />
          <span className="text-sm font-medium text-foreground">{busy ? 'Reading…' : 'Choose a PDF'}</span>
          <span className="text-xs text-muted-foreground">
            {fileName ?? 'Any resume PDF, from this app or anywhere else'}
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void run(file)
              e.target.value = ''
            }}
          />
        </label>

        {error && (
          <Alert variant="destructive" className="mt-4" role="alert">
            <CircleAlertIcon aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {report && (
          <section className="mt-8" aria-label="Results">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Badge
                variant={criticals > 0 ? 'destructive-light' : warnings > 0 ? 'warning-light' : 'success-light'}
                size="xl"
                radius="full"
              >
                {criticals === 0 && warnings === 0 ? 'No problems found' : `${criticals} critical, ${warnings} to review`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {report.pageCount} page(s) · {report.wordCount} words read
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {report.checks.map((check) => {
                const { Icon, className, label } = SEVERITY[check.severity === 'critical' ? 'critical' : check.severity === 'warning' ? 'warning' : 'ok']
                return (
                  <li key={check.id} className="flex gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {check.label}
                        <span className="sr-only"> — {label}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{check.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowText((v) => !v)}>
                {showText ? 'Hide extracted text' : 'Show extracted text'}
              </Button>
              {showText && (
                <pre className="mt-3 max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-foreground">
                  {report.extractedText}
                </pre>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

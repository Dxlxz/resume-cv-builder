import { useState } from 'react'
import { AppShell } from '@/app/AppShell'
import { Button } from '@/components/ui/Button'
import { checkAnyPdf, type AtsReport } from '@rb/validators/ats-proof/checkAnyPdf'

/**
 * Public ATS checker: drop in any PDF and see what a parser actually reads.
 *
 * The file never leaves the browser — the same posture as the rest of the app.
 * Everything here runs on pdf.js locally.
 */
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
      setError(
        'That file could not be read as a PDF. If it opens in a viewer, try exporting it again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const criticals = report?.checks.filter((c) => c.severity === 'critical').length ?? 0
  const warnings = report?.checks.filter((c) => c.severity === 'warning').length ?? 0

  return (
    <AppShell onBack={onHome} backLabel="Home">
      <main id="main-content" className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-foreground">ATS check</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          See what an applicant tracking system reads in your PDF. Your file stays in your
          browser — nothing is uploaded.
        </p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-[var(--ring)]">
          <span className="text-sm font-medium text-foreground">
            {busy ? 'Reading…' : 'Choose a PDF'}
          </span>
          <span className="text-xs text-muted-foreground">
            {fileName ?? 'Any resume PDF, from this app or anywhere else'}
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void run(file)
              e.target.value = ''
            }}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-sm bg-badge-danger px-3 py-2 text-sm text-status-danger-foreground">
            {error}
          </p>
        )}

        {report && (
          <section className="mt-8" aria-label="Results">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-foreground">
                {criticals === 0 && warnings === 0
                  ? 'No problems found'
                  : `${criticals} critical, ${warnings} to review`}
              </span>
              <span className="text-muted-foreground">
                {report.pageCount} page(s) · {report.wordCount} words read
              </span>
            </div>

            <ul className="mt-4 space-y-2">
              {report.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex gap-3 rounded-sm border border-border bg-card px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      check.severity === 'critical'
                        ? 'bg-status-danger'
                        : check.severity === 'warning'
                          ? 'bg-status-warning'
                          : 'bg-status-success'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {check.label}
                      <span className="sr-only"> — {check.severity}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowText((v) => !v)}>
                {showText ? 'Hide extracted text' : 'Show extracted text'}
              </Button>
              {showText && (
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-muted/40 p-3 text-xs text-foreground">
                  {report.extractedText}
                </pre>
              )}
            </div>
          </section>
        )}
      </main>
    </AppShell>
  )
}

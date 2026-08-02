import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { getPreset } from '@rb/presets/registry'
import { generatePdf, downloadPdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { exportDocumentJson, importDocumentJson } from '@/lib/importExport'
import { runValidation, hasBlockingErrors } from '@rb/validators/ats-lint'
import { paginateDriftIssue } from '@rb/validators/paginate-lint'
import { scoreDocument } from '@rb/validators/score'
import { LintPanel } from '@/components/toolbar/LintPanel'
import { PdfPreviewModal } from '@/components/toolbar/PdfPreviewModal'
import { Button } from '@/components/ui/Button'
import { Brand } from '@/components/ui/Brand'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

interface ToolbarProps {
  onHome: () => void
  /** Preview pane is currently visible (desktop). */
  previewVisible: boolean
  onTogglePreview: () => void
}

export function Toolbar({ onHome, previewVisible, onTogglePreview }: ToolbarProps) {
  const document = useDocumentStore((s) => s.document)
  const saveStatus = useDocumentStore((s) => s.saveStatus)
  const saveError = useDocumentStore((s) => s.saveError)
  const pdfError = useDocumentStore((s) => s.pdfError)
  const lintIssues = useDocumentStore((s) => s.lintIssues)
  const showLintPanel = useDocumentStore((s) => s.showLintPanel)
  const setDocument = useDocumentStore((s) => s.setDocument)
  const setExportFieldErrors = useDocumentStore((s) => s.setExportFieldErrors)
  const setPdfError = useDocumentStore((s) => s.setPdfError)
  const setLintIssues = useDocumentStore((s) => s.setLintIssues)
  const setShowLintPanel = useDocumentStore((s) => s.setShowLintPanel)
  const reset = useDocumentStore((s) => s.reset)
  const loadPersonalProfile = useDocumentStore((s) => s.loadPersonalProfile)
  const personalProfileAvailable = useDocumentStore((s) => s.personalProfileAvailable)
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const previewPdfBlob = useDocumentStore((s) => s.previewPdfBlob)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [pendingExport, setPendingExport] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{
    url: string
    pageCount: number
    blob: Blob
  } | null>(null)

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url)
    }
  }, [pdfPreview?.url])

  if (!document) return null

  const preset = getPreset(document.meta.presetId)

  const runAtsCheck = () => {
    const issues = runValidation(document, layoutPlan, previewPageCount)
    setLintIssues(issues)
    setShowLintPanel(true)
    return issues
  }

  const doExportPdf = async () => {
    setExporting(true)
    setPdfError(null)
    setExportNotice(null)
    try {
      const blob = await generatePdf(document, preset.labels)
      const pdfPages = await countPdfPages(blob)
      const drift = paginateDriftIssue(previewPageCount, pdfPages)
      downloadPdf(blob, document)
      setExportNotice(
        drift
          ? `Exported ${pdfPages}-page PDF (preview shows ${previewPageCount} pages)`
          : `Exported ${pdfPages}-page PDF`,
      )
      setShowLintPanel(false)
      setPendingExport(false)
    } catch {
      setPdfError('PDF generation failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handlePreviewPdf = async () => {
    setPreviewing(true)
    setPdfError(null)
    try {
      const blob = previewPdfBlob ?? (await generatePdf(document, preset.labels))
      const pageCount = await countPdfPages(blob)
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url)
      setPdfPreview({
        url: URL.createObjectURL(blob),
        pageCount,
        blob,
      })
    } catch {
      setPdfError('PDF preview failed. Please try again.')
    } finally {
      setPreviewing(false)
    }
  }

  const handleExportPdf = () => {
    const issues = runValidation(document, layoutPlan, previewPageCount)
    setLintIssues(issues)

    if (hasBlockingErrors(issues)) {
      setExportFieldErrors(
        Object.fromEntries(
          issues
            .filter((i) => i.level === 'error' && i.field)
            .map((i) => [i.field!, i.message]),
        ),
      )
      setShowLintPanel(true)
      setPendingExport(false)
      window.document.getElementById('contact-full-name')?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    const hasWarnings = issues.some((i) => i.level === 'warning')
    if (hasWarnings) {
      setPendingExport(true)
      setShowLintPanel(true)
      return
    }

    void doExportPdf()
  }

  const handleImport = async (file: File) => {
    const result = await importDocumentJson(file)
    if (!result.success) {
      alert(result.message)
      return
    }
    if (confirm('Replace your current draft with the imported file?')) {
      setDocument(result.document)
    }
  }

  const handleStartFresh = () => {
    if (confirm('Clear your draft and start over? This cannot be undone.')) {
      reset()
    }
  }

  const saveStatusBadge =
    saveStatus === 'error'
      ? {
          label: saveError ?? 'Save failed',
          tone: 'border-status-danger/30 bg-badge-danger text-status-danger-foreground',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        }
      : saveStatus === 'saving'
        ? {
            label: 'Saving…',
            tone: 'border-status-warning/30 bg-badge-warning text-status-warning-foreground',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            ),
          }
        : {
            label: 'Saved locally',
            tone: 'border-status-success/30 bg-badge-success text-status-success-foreground',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ),
          }

  const atsScore = lintIssues.length > 0 ? scoreDocument(lintIssues) : null
  const atsChipTone = atsScore
    ? atsScore.band === 'excellent'
      ? 'border-status-success/30 bg-badge-success text-status-success-foreground'
      : atsScore.band === 'poor'
        ? 'border-status-danger/30 bg-badge-danger text-status-danger-foreground'
        : 'border-status-warning/30 bg-badge-warning text-status-warning-foreground'
    : ''

  return (
    <>
      <header className="border-b border-border bg-header px-4 py-2 shadow-[var(--shadow-raised)]">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-wrap items-center gap-2">
            <Brand onClick={onHome} />
            <span aria-hidden className="h-6 w-px bg-border" />
            <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
              {document.meta.documentType === 'cv' ? 'CV' : 'Resume'}
              <span className="font-normal text-muted-foreground"> · {preset.name}</span>
            </h1>
            <span
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${saveStatusBadge.tone}`}
              aria-live="polite"
              title={saveStatus === 'error' && saveError ? saveError : undefined}
            >
              {saveStatusBadge.icon}
              {saveStatusBadge.label}
            </span>
            <Button variant="secondary" size="sm" onClick={runAtsCheck} className="shrink-0 gap-1.5">
              ATS Check
              {atsScore && (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] font-semibold ${atsChipTone}`}
                  aria-label={`ATS score ${atsScore.score} out of 100`}
                >
                  {atsScore.score}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              className="shrink-0 font-semibold"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  More
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => void handlePreviewPdf()} disabled={previewing || exporting}>
                  Open fullscreen PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onTogglePreview}>
                  {previewVisible ? 'Hide preview' : 'Show preview'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportDocumentJson(document)}>
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                  Import JSON
                </DropdownMenuItem>
                {personalProfileAvailable && (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (
                        confirm(
                          'Replace your current draft with your personal profile? Your current edits will be replaced.',
                        )
                      ) {
                        loadPersonalProfile()
                      }
                    }}
                  >
                    Load my profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1 h-px bg-border" />
                <DropdownMenuItem danger onSelect={handleStartFresh}>
                  Start fresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
              e.target.value = ''
            }}
          />
        </div>

        {exportNotice && (
          <p className="mx-auto max-w-[1600px] text-xs text-status-success" role="status">
            {exportNotice}
          </p>
        )}

        {pdfError && (
          <div
            className="mx-auto mt-2 max-w-[1600px] rounded-md border border-status-danger/30 bg-badge-danger px-3 py-2 text-sm text-status-danger-foreground"
            role="alert"
          >
            {pdfError}{' '}
            <button type="button" className="underline" onClick={() => void doExportPdf()}>
              Retry
            </button>
          </div>
        )}
      </header>

      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          pageCount={pdfPreview.pageCount}
          onClose={() => {
            URL.revokeObjectURL(pdfPreview.url)
            setPdfPreview(null)
          }}
          onDownload={() => {
            downloadPdf(pdfPreview.blob, document)
            setExportNotice(`Exported ${pdfPreview.pageCount}-page PDF`)
            URL.revokeObjectURL(pdfPreview.url)
            setPdfPreview(null)
          }}
        />
      )}

      {showLintPanel && (
        <LintPanel
          onClose={() => {
            setShowLintPanel(false)
            setPendingExport(false)
          }}
          showProceed={pendingExport}
          onProceed={() => void doExportPdf()}
        />
      )}
    </>
  )
}

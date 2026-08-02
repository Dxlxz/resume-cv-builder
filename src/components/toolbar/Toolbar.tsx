import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { getPreset } from '@rb/presets/registry'
import { generatePdf, downloadPdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { exportDocumentJson, importDocumentJson } from '@/lib/importExport'
import { runValidation, hasBlockingErrors } from '@rb/validators/ats-lint'
import { paginateDriftIssue } from '@rb/validators/paginate-lint'
import { LintPanel } from '@/components/toolbar/LintPanel'
import { PdfPreviewModal } from '@/components/toolbar/PdfPreviewModal'
import { Button } from '@/components/ui/Button'
import { Brand } from '@/components/ui/Brand'
import { navigateTo } from '@/hooks/useAppRoute'

interface ToolbarProps {
  onHome: () => void
}

export function Toolbar({ onHome }: ToolbarProps) {
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
  const layoutDebug = useDocumentStore((s) => s.layoutDebug)
  const setLayoutDebug = useDocumentStore((s) => s.setLayoutDebug)

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

  // "More" menu: close on outside click or Escape.
  const menuRef = useRef<HTMLDetailsElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.document.addEventListener('mousedown', onDocClick)
    window.document.addEventListener('keydown', onKey)
    return () => {
      window.document.removeEventListener('mousedown', onDocClick)
      window.document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

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

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'error'
        ? saveError ?? 'Save failed'
        : 'Saved locally'

  const saveTone =
    saveStatus === 'error'
      ? 'text-status-danger'
      : saveStatus === 'saving'
        ? 'text-status-warning'
        : 'text-status-success'

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
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs ${saveTone}`}
              aria-live="polite"
              title={saveStatus === 'error' && saveError ? saveError : undefined}
            >
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${saveTone}`} />
              {saveLabel}
            </span>
            <Button variant="secondary" size="sm" onClick={runAtsCheck} className="shrink-0">
              ATS Check
            </Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              className="shrink-0 font-semibold"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>

            <details
              ref={menuRef}
              className="relative"
              open={menuOpen}
              onToggle={(e) => setMenuOpen(e.currentTarget.open)}
            >
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted [&::-webkit-details-marker]:hidden">
                More
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-md border border-border bg-card p-1.5 shadow-[var(--shadow-menu)]">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false)
                    void handlePreviewPdf()
                  }}
                  disabled={previewing || exporting}
                >
                  Open fullscreen PDF
                </button>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors duration-[var(--duration-state)] hover:bg-muted ${
                    layoutDebug ? 'text-primary' : 'text-foreground'
                  }`}
                  onClick={() => {
                    setMenuOpen(false)
                    setLayoutDebug(!layoutDebug)
                  }}
                >
                  Layout debug
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false)
                    exportDocumentJson(document)
                  }}
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false)
                    fileInputRef.current?.click()
                  }}
                >
                  Import JSON
                </button>
                {personalProfileAvailable && (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false)
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
                  </button>
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false)
                    navigateTo('admin')
                  }}
                >
                  Manage catalogs
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-status-danger transition-colors duration-[var(--duration-state)] hover:bg-badge-danger"
                  onClick={() => {
                    setMenuOpen(false)
                    handleStartFresh()
                  }}
                >
                  Start fresh
                </button>
              </div>
            </details>
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
          issues={lintIssues}
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

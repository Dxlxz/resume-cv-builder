import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { TEMPLATE_LIST } from '@rb/templates/registry'
import { PRESET_LIST, getPreset } from '@rb/presets/registry'
import { THEME_LIST } from '@rb/themes/registry'
import { generatePdf, downloadPdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { exportDocumentJson, importDocumentJson } from '@/lib/importExport'
import { runValidation, hasBlockingErrors } from '@rb/validators/ats-lint'
import { paginateDriftIssue } from '@rb/validators/paginate-lint'
import { LintPanel } from '@/components/toolbar/LintPanel'
import { PdfPreviewModal } from '@/components/toolbar/PdfPreviewModal'
import { Button } from '@/components/ui/Button'
import { navigateToAdmin } from '@/hooks/useAppRoute'
import type { DocumentType, ExportProfile, PresetId } from '@rb/core/types/document'

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
  const setTemplate = useDocumentStore((s) => s.setTemplate)
  const setTheme = useDocumentStore((s) => s.setTheme)
  const setExportProfile = useDocumentStore((s) => s.setExportProfile)
  const setDocumentType = useDocumentStore((s) => s.setDocumentType)
  const applyPreset = useDocumentStore((s) => s.applyPreset)
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

  const handleTypeSwitch = (type: DocumentType) => {
    if (type === document.meta.documentType) return
    if (
      confirm(
        `Switch to ${type.toUpperCase()}? Your content will be preserved; template may update.`,
      )
    ) {
      setDocumentType(type)
    }
  }

  const handlePresetSwitch = (presetId: PresetId) => {
    if (presetId === document.meta.presetId) return
    const next = getPreset(presetId)
    if (
      confirm(
        `Switch to ${next.name}? Template, theme, and export settings will update. Content is preserved.`,
      )
    ) {
      applyPreset(presetId)
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
        ? saveError ?? 'Save error'
        : 'Saved locally'

  const saveTone =
    saveStatus === 'error'
      ? 'text-status-danger'
      : saveStatus === 'saving'
        ? 'text-status-warning'
        : 'text-status-success'

  return (
    <>
      <header className="border-b border-border bg-header px-4 py-3 shadow-[var(--shadow-raised)]">
        <div className="mx-auto max-w-[1600px] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHome}
              aria-label="Back to home page"
              title="Back to home page"
              className="shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
              </svg>
              Home
            </Button>
            <div className="mr-auto min-w-0">
              <h1 className="text-lg font-bold text-foreground">Resume & CV Builder</h1>
              <p className={`text-xs ${saveTone}`} aria-live="polite">
                {saveLabel} · {preset.name}
              </p>
            </div>
            <Button
              onClick={handleExportPdf}
              disabled={exporting}
              className="shrink-0 font-semibold"
            >
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handlePreviewPdf()}
              disabled={previewing || exporting}
              className="shrink-0"
            >
              {previewing ? 'Opening…' : 'Fullscreen PDF'}
            </Button>
            <Button variant="secondary" onClick={runAtsCheck} className="shrink-0">
              ATS Check
            </Button>
            <Button
              variant={layoutDebug ? 'primary' : 'secondary'}
              onClick={() => setLayoutDebug(!layoutDebug)}
              className="shrink-0 text-left"
              title="Show measured block boxes and page break lines on preview"
            >
              Layout debug
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-t border-border pt-3">
            <p className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-auto sm:pr-2">
              Layout
            </p>
            <label className="text-sm text-muted-foreground">
              Preset
              <select
                className="ml-2 max-w-[10rem] rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                value={document.meta.presetId}
                onChange={(e) => handlePresetSwitch(e.target.value as PresetId)}
              >
                {PRESET_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-muted-foreground">
              Type
              <select
                className="ml-2 rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                value={document.meta.documentType}
                onChange={(e) => handleTypeSwitch(e.target.value as DocumentType)}
              >
                <option value="resume">Resume</option>
                <option value="cv">CV</option>
              </select>
            </label>

            <label className="text-sm text-muted-foreground">
              Template
              <select
                className="ml-2 rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                value={document.meta.templateId}
                onChange={(e) =>
                  setTemplate(e.target.value as typeof document.meta.templateId)
                }
              >
                {TEMPLATE_LIST.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-muted-foreground">
              Theme
              <select
                className="ml-2 rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                value={document.meta.themeId}
                onChange={(e) =>
                  setTheme(e.target.value as typeof document.meta.themeId)
                }
              >
                {THEME_LIST.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-muted-foreground">
              Export
              <select
                className="ml-2 rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground"
                value={document.meta.exportProfile}
                onChange={(e) =>
                  setExportProfile(e.target.value as ExportProfile)
                }
              >
                <option value="standard">Standard</option>
                <option value="portal-safe">Portal-safe</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <p className="mr-1 w-full text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-auto">
              Data
            </p>
            <Button variant="secondary" size="sm" onClick={() => exportDocumentJson(document)}>
              Export JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Import JSON
            </Button>
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
            {personalProfileAvailable && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
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
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleStartFresh}>
              Start fresh
            </Button>
            <Button variant="ghost" size="sm" onClick={navigateToAdmin}>
              Manage catalogs
            </Button>
          </div>
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

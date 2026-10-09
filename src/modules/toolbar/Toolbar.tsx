import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckIcon,
  ClockIcon,
  EllipsisIcon,
  EyeIcon,
  EyeOffIcon,
  FileDownIcon,
  FileJsonIcon,
  FileUpIcon,
  Maximize2Icon,
  RotateCcwIcon,
  ScanSearchIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { getPreset } from '@rb/presets/registry'
import { generatePdf, downloadPdf, countPdfPages } from '@/modules/pdf'
import { exportDocumentJson, exportJsonResume, importDocumentJson, importResumePdf } from '@/modules/document'
import type { LintIssue } from '@rb/validators/types'
import { runValidation, hasBlockingErrors } from '@rb/validators/ats-lint'
import { paginateDriftIssue } from '@rb/validators/paginate-lint'
import { summarizeChecks } from '@rb/validators/score'
import { LintPanel } from './LintPanel'
import { PdfPreviewModal } from './PdfPreviewModal'
import { Alert, AlertAction, AlertDescription } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Brand } from '@/shared/ui/brand'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog, type ConfirmRequest } from '@/shared/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Separator } from '@/shared/ui/separator'
import { toast } from '@/shared/ui/sonner'
import { jumpToIssue } from '@/shared/lib/scrollToSection'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'

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
  const showLintPanel = useDocumentStore((s) => s.showLintPanel)
  const setDocument = useDocumentStore((s) => s.setDocument)
  const setExportFieldErrors = useDocumentStore((s) => s.setExportFieldErrors)
  const setPdfError = useDocumentStore((s) => s.setPdfError)
  const setLintIssues = useDocumentStore((s) => s.setLintIssues)
  const setShowLintPanel = useDocumentStore((s) => s.setShowLintPanel)
  const setShowFixList = useDocumentStore((s) => s.setShowFixList)
  const reset = useDocumentStore((s) => s.reset)
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const previewPdfBlob = useDocumentStore((s) => s.previewPdfBlob)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [pendingExport, setPendingExport] = useState(false)
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [pdfPreview, setPdfPreview] = useState<{
    url: string
    pageCount: number
    blob: Blob
  } | null>(null)

  // The readability proof (F-007): extract the preview PDF the way a parser would and check that every visible field
  // of the document it was rendered from survived. It runs per preview PDF, not per keystroke.
  // A proof counts only for the document it was made from: after an edit, or while the preview is hidden, it is
  // pending rather than stale.
  const previewPdfSource = useDocumentStore((s) => s.previewPdfSource)
  const setAtsProofStatus = useDocumentStore((s) => s.setAtsProofStatus)
  const [proof, setProof] = useState<{ source: typeof previewPdfSource; issues: LintIssue[]; ran: boolean } | null>(null)
  useEffect(() => {
    if (!previewPdfBlob || !previewPdfSource) return
    let cancelled = false
    void import('@rb/validators/ats-proof/proveReadable')
      .then(({ proveReadable }) => proveReadable(previewPdfBlob, previewPdfSource))
      .then((issues) => {
        if (!cancelled) setProof({ source: previewPdfSource, issues, ran: true })
      })
      .catch(() => {
        // A proof that cannot run says nothing about the PDF; the rule-based checks still stand.
        if (!cancelled) setProof({ source: previewPdfSource, issues: [], ran: false })
      })
    return () => {
      cancelled = true
    }
  }, [previewPdfBlob, previewPdfSource])
  const proofIsCurrent = proof !== null && proof.source === document
  const proofIssues = useMemo(() => (proofIsCurrent && proof ? proof.issues : []), [proofIsCurrent, proof])
  const proofStatus = !proofIsCurrent ? 'pending' : proof?.ran ? 'done' : 'unavailable'
  useEffect(() => {
    setAtsProofStatus(proofStatus)
  }, [proofStatus, setAtsProofStatus])

  // The ATS check is live: it re-runs shortly after every edit, so the status and the fix list never go stale.
  const [liveIssues, setLiveIssues] = useState<LintIssue[] | null>(null)
  useEffect(() => {
    if (!document) return
    const timer = window.setTimeout(() => {
      const issues = [...runValidation(document, layoutPlan, previewPageCount), ...proofIssues]
      setLiveIssues(issues)
      setLintIssues(issues)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [document, layoutPlan, previewPageCount, proofIssues, setLintIssues])

  useEffect(() => {
    return () => {
      if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url)
    }
  }, [pdfPreview?.url])

  if (!document) return null

  const preset = getPreset(document.meta.presetId)

  const runAtsCheck = () => {
    const issues = [...runValidation(document, layoutPlan, previewPageCount), ...proofIssues]
    setLintIssues(issues)
    setShowLintPanel(true)
    return issues
  }

  const doExportPdf = async () => {
    setExporting(true)
    setPdfError(null)
    try {
      const blob = await generatePdf(document, preset.labels)
      const pdfPages = await countPdfPages(blob)
      const drift = paginateDriftIssue(previewPageCount, pdfPages)
      downloadPdf(blob, document)
      if (drift) {
        toast.warning(`Exported ${pdfPages}-page PDF`, {
          description: `The preview showed ${previewPageCount} pages, so check the exported file.`,
        })
      } else {
        toast.success(`Exported ${pdfPages}-page PDF`)
      }
      setShowLintPanel(false)
      setShowFixList(false)
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
    const issues = [...runValidation(document, layoutPlan, previewPageCount), ...proofIssues]
    setLintIssues(issues)

    if (hasBlockingErrors(issues)) {
      // No modal: show what blocks export next to the fields, and put the cursor on the first one.
      setExportFieldErrors(
        Object.fromEntries(
          issues
            .filter((i) => i.level === 'error' && i.field)
            .map((i) => [i.field!, i.message]),
        ),
      )
      setShowFixList(true)
      setPendingExport(false)
      const first = issues.find((i) => i.level === 'error')
      if (first) jumpToIssue(first)
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
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    const result = isPdf ? await importResumePdf(file) : await importDocumentJson(file)
    if (!result.success) {
      toast.error('Could not import that file', { description: result.message, duration: Infinity, closeButton: true })
      return
    }
    let description = 'Your current draft will be replaced with the imported file.'
    if (result.parsed) {
      // Reading a PDF is guesswork; say what came back before replacing a draft.
      const found = result.parsed.foundSections.length
        ? `Found: ${[...new Set(result.parsed.foundSections)].join(', ')}.`
        : 'No standard section headings were recognised.'
      const missed = result.parsed.unplacedLines.length
        ? ` ${result.parsed.unplacedLines.length} line(s) could not be placed.`
        : ''
      description = `${found}${missed}\n\nYour current draft will be replaced with this.`
    }
    setConfirmRequest({
      title: 'Replace your draft with this file?',
      description,
      confirmLabel: 'Replace draft',
      onConfirm: () => {
        setDocument(result.document)
        if (result.dropped && result.dropped.length > 0) {
          // Say what was lost rather than dropping it silently.
          toast.warning('Imported, but some fields were not kept', {
            description: `These fields have no place in this builder: ${result.dropped.join(', ')}`,
            duration: Infinity,
            closeButton: true,
          })
        } else {
          toast.success('Imported')
        }
      },
    })
  }

  const handleStartFresh = () => {
    setConfirmRequest({
      title: 'Clear your draft and start over?',
      description: 'This removes everything you have written in this browser. It cannot be undone.',
      confirmLabel: 'Start fresh',
      destructive: true,
      onConfirm: reset,
    })
  }

  const saveBadge =
    saveStatus === 'error'
      ? { label: saveError ?? 'Save failed', variant: 'destructive-light' as const, Icon: TriangleAlertIcon }
      : saveStatus === 'saving'
        ? { label: 'Saving…', variant: 'warning-light' as const, Icon: ClockIcon }
        : { label: 'Saved locally', variant: 'success-light' as const, Icon: CheckIcon }

  const atsSummary = liveIssues ? summarizeChecks(liveIssues) : null
  const atsBadge = atsSummary
    ? atsSummary.status === 'ready'
      ? { variant: 'success-light' as const, text: 'ATS ready' }
      : atsSummary.status === 'blocked'
        ? { variant: 'destructive-light' as const, text: `${atsSummary.errors} to fix` }
        : { variant: 'warning-light' as const, text: `${atsSummary.risks} ATS risk${atsSummary.risks === 1 ? '' : 's'}` }
    : null

  return (
    <>
      <header className="border-b border-border bg-background px-3 py-2 sm:px-4">
        <div className="mx-auto flex max-w-[var(--layout-max-content)] flex-wrap items-center gap-x-2 gap-y-2">
          <Brand onClick={onHome} />
          <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
          <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
            {document.meta.documentType === 'cv' ? 'CV' : 'Resume'}
            <span className="font-normal text-muted-foreground"> · {preset.name}</span>
          </h1>

          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            {/* Always present so screen readers hear a failed save on any screen size; routine saves are not announced. */}
            <span className="sr-only" role="status">
              {saveStatus === 'error' ? saveBadge.label : ''}
            </span>
            <Badge
              variant={saveBadge.variant}
              size="xl"
              radius="full"
              aria-hidden
              className={saveStatus === 'error' ? 'inline-flex h-auto min-h-6 max-w-full whitespace-normal' : 'hidden sm:inline-flex'}
              title={saveStatus === 'error' && saveError ? saveError : undefined}
            >
              <saveBadge.Icon aria-hidden />
              {saveBadge.label}
            </Badge>

            <Button variant="outline" size="sm" onClick={runAtsCheck}>
              <ScanSearchIcon data-icon="inline-start" aria-hidden />
              ATS Check
              {atsSummary && atsBadge && (
                <Badge variant={atsBadge.variant}>
                  {atsBadge.text}
                  {atsSummary.tips > 0 && (
                    <span className="font-normal">
                      {' '}
                      · {atsSummary.tips} tip{atsSummary.tips === 1 ? '' : 's'}
                    </span>
                  )}
                </Badge>
              )}
            </Button>

            <Button size="sm" onClick={handleExportPdf} disabled={exporting}>
              <FileDownIcon data-icon="inline-start" aria-hidden />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </Button>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="More actions">
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-60">
                <DropdownMenuItem onSelect={() => void handlePreviewPdf()} disabled={previewing || exporting}>
                  <Maximize2Icon />
                  Open fullscreen PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onTogglePreview}>
                  {previewVisible ? <EyeOffIcon /> : <EyeIcon />}
                  {previewVisible ? 'Hide preview' : 'Show preview'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => exportDocumentJson(document)}>
                  <FileJsonIcon />
                  Export JSON backup
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportJsonResume(document)}>
                  <FileJsonIcon />
                  Export JSON Resume
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                  <FileUpIcon />
                  Import JSON or PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleStartFresh}>
                  <RotateCcwIcon />
                  Start fresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json,application/pdf,.pdf"
          className="hidden"
          aria-label="Import a JSON or PDF file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
            e.target.value = ''
          }}
        />

        {pdfError && (
          <Alert variant="destructive" className="mx-auto mt-2 max-w-[var(--layout-max-content)]" role="alert">
            <TriangleAlertIcon aria-hidden />
            <AlertDescription>{pdfError}</AlertDescription>
            <AlertAction>
              <Button type="button" size="sm" variant="outline" onClick={() => void doExportPdf()}>
                Retry
              </Button>
            </AlertAction>
          </Alert>
        )}
      </header>

      {pdfPreview && (
        <PdfPreviewModal
          url={pdfPreview.url}
          blob={pdfPreview.blob}
          pageCount={pdfPreview.pageCount}
          onClose={() => {
            URL.revokeObjectURL(pdfPreview.url)
            setPdfPreview(null)
          }}
          onDownload={() => {
            downloadPdf(pdfPreview.blob, document)
            toast.success(`Exported ${pdfPreview.pageCount}-page PDF`)
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

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />
    </>
  )
}

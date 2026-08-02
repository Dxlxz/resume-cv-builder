import { useEffect } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { useDocumentStore } from '@/app/store/documentStore'
import { LayoutDebugInspector } from '@rb/layout/debug/LayoutDebugInspector'
import { PdfSelectablePage } from '@/components/preview/PdfSelectablePage'

interface PdfJsPreviewProps {
  document: ResumeDocument
  contentKey: string
  containerWidth: number
}

/**
 * Live preview rendered with pdf.js at a scale that fits the panel width,
 * so the page follows the screen size. Pages keep a text layer for
 * selection and copy. Layout debug overlays the planned block rhythm.
 */
export function PdfJsPreview({ document, contentKey, containerWidth }: PdfJsPreviewProps) {
  const setPreviewPageCount = useDocumentStore((s) => s.setPreviewPageCount)
  const setPreviewPdfBlob = useDocumentStore((s) => s.setPreviewPdfBlob)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const layoutDebug = useDocumentStore((s) => s.layoutDebug)

  const { loading, refreshing, error, pages, pageCount, scale, pdf, blob, revision } =
    usePdfPreview(document, contentKey, { containerWidth, zoomMode: 'fit' })

  useEffect(() => {
    if (pageCount > 0 && useDocumentStore.getState().previewPageCount !== pageCount) {
      setPreviewPageCount(pageCount)
    }
  }, [pageCount, setPreviewPageCount])

  useEffect(() => {
    if (blob && useDocumentStore.getState().previewPdfBlob !== blob) {
      setPreviewPdfBlob(blob)
    }
  }, [blob, setPreviewPdfBlob])

  const showInitialSpinner = loading && !blob

  if (showInitialSpinner) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Rendering PDF preview…</p>
      </div>
    )
  }

  if (error && !blob) {
    return (
      <p className="py-8 text-center text-sm text-status-danger" role="alert">
        {error}
      </p>
    )
  }

  if (!pdf || pages.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Scaling preview…</p>
      </div>
    )
  }

  return (
    <div className={`flex h-full min-h-[20rem] ${layoutDebug ? 'min-w-0' : 'w-full'}`}>
      <div className="relative min-h-[20rem] min-w-0 flex-1 overflow-y-auto bg-muted p-4">
        {refreshing && (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-foreground/20 pt-6"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-full bg-overlay-surface/95 px-3 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-menu)]">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
              Updating preview…
            </div>
          </div>
        )}

        <div key={revision} className="mx-auto flex w-fit flex-col gap-4">
          {pages.map((page) => (
            <PdfSelectablePage
              key={page.pageNumber}
              pdf={pdf}
              pageNumber={page.pageNumber}
              scale={scale}
              width={page.width}
              height={page.height}
              className="rounded-sm shadow-[var(--shadow-raised)]"
            />
          ))}
        </div>
      </div>

      {layoutDebug && layoutPlan && <LayoutDebugInspector planResult={layoutPlan} />}
    </div>
  )
}

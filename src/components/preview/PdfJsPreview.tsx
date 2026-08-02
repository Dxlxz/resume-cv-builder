import { useEffect, useMemo } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { useDocumentStore } from '@/app/store/documentStore'
import { LayoutDebugInspector } from '@rb/layout/debug/LayoutDebugInspector'

interface PdfJsPreviewProps {
  document: ResumeDocument
  contentKey: string
  containerWidth: number
}

export function PdfJsPreview({ document, contentKey, containerWidth }: PdfJsPreviewProps) {
  const setPreviewPageCount = useDocumentStore((s) => s.setPreviewPageCount)
  const setPreviewPdfBlob = useDocumentStore((s) => s.setPreviewPdfBlob)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const layoutDebug = useDocumentStore((s) => s.layoutDebug)

  const { loading, refreshing, error, pageCount, blob, revision } = usePdfPreview(
    document,
    contentKey,
    { layoutDebug, containerWidth, zoomMode: 'fit' },
  )

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

  const blobUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

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

  if (!blobUrl) return null

  return (
    <div className={`flex h-full min-h-[20rem] ${layoutDebug ? 'min-w-0' : 'w-full'}`}>
      <div className="relative min-h-[20rem] min-w-0 flex-1">
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

        <iframe
          key={revision}
          src={blobUrl}
          title="Resume PDF live preview"
          className="h-full min-h-[20rem] w-full border-0 bg-muted"
        />
      </div>

      {layoutDebug && layoutPlan && <LayoutDebugInspector planResult={layoutPlan} />}
    </div>
  )
}

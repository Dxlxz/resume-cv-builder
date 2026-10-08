import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLinkIcon, Loader2Icon, TriangleAlertIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import type { ResumeDocument } from '@rb/core/types/document'
import { usePdfPreview } from './usePdfPreview'
import { useDocumentStore } from '@/modules/document'
import { PdfPageViewer, preferCanvasPdf } from '@/modules/pdf'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/** Zoom steps, as multiples of fit-to-width. */
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

interface PdfJsPreviewProps {
  document: ResumeDocument
  contentKey: string
}

/**
 * Live preview: the exported PDF drawn page by page on canvases (pdf.js), with our own zoom and page controls, so it
 * looks the same in every browser and is exactly the file that is exported. `?pdf=native` shows the browser's own
 * viewer instead; the Open button gives that viewer's search and print in a new tab.
 */
export function PdfJsPreview({ document, contentKey }: PdfJsPreviewProps) {
  const setPreviewPageCount = useDocumentStore((s) => s.setPreviewPageCount)
  const setPreviewPdfBlob = useDocumentStore((s) => s.setPreviewPdfBlob)

  const { loading, refreshing, error, pageCount, blob, source, revision } = usePdfPreview(
    document,
    contentKey,
  )

  useEffect(() => {
    if (pageCount > 0 && useDocumentStore.getState().previewPageCount !== pageCount) {
      setPreviewPageCount(pageCount)
    }
  }, [pageCount, setPreviewPageCount])

  useEffect(() => {
    if (blob && useDocumentStore.getState().previewPdfBlob !== blob) {
      setPreviewPdfBlob(blob, source)
    }
  }, [blob, source, setPreviewPdfBlob])

  const useCanvas = useMemo(() => preferCanvasPdf(), [])
  const [zoomIndex, setZoomIndex] = useState<number>(ZOOM_STEPS.indexOf(1))
  const [currentPage, setCurrentPage] = useState(1)
  const onPageChange = useCallback((page: number) => setCurrentPage(page), [])
  const zoom = ZOOM_STEPS[zoomIndex]
  const blobUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const showInitialSpinner = loading && !blob

  if (showInitialSpinner) {
    return (
      <div
        className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 text-muted-foreground"
        role="status"
      >
        <Loader2Icon className="size-6 animate-spin" aria-hidden />
        <p className="text-sm">Rendering PDF preview…</p>
      </div>
    )
  }

  if (error && !blob) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <TriangleAlertIcon aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!blobUrl) return null

  return (
    <div className="relative h-full min-h-[20rem] min-w-0 flex-1">
      {refreshing && (
        <div
          className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-full bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            Updating preview…
          </div>
        </div>
      )}

      {useCanvas && blob ? (
        <div className="flex h-full min-h-[20rem] flex-col">
          <div
            role="toolbar"
            aria-label="Preview controls"
            className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-2 py-1"
          >
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom out"
                title="Zoom out"
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              >
                <ZoomOutIcon aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-14 tabular-nums"
                aria-label={`Zoom ${zoom === 1 ? 'fit to width' : `${Math.round(zoom * 100)} percent`}. Reset to fit width`}
                title="Fit to width"
                onClick={() => setZoomIndex(ZOOM_STEPS.indexOf(1))}
              >
                {zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom in"
                title="Zoom in"
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              >
                <ZoomInIcon aria-hidden />
              </Button>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
              Page {Math.min(currentPage, Math.max(1, pageCount))} of {Math.max(1, pageCount)}
            </span>
            <Button type="button" variant="ghost" size="sm" asChild>
              <a href={blobUrl} target="_blank" rel="noopener" title="Open in the browser's PDF viewer (search, print)">
                <ExternalLinkIcon data-icon="inline-start" aria-hidden />
                Open
              </a>
            </Button>
          </div>
          <PdfPageViewer
            blob={blob}
            fallbackHref={blobUrl}
            zoom={zoom}
            onPageChange={onPageChange}
            className="desk-grain min-h-0 w-full flex-1 overflow-auto bg-muted p-2"
          />
        </div>
      ) : (
        <iframe
          key={revision}
          src={blobUrl}
          title="Resume PDF live preview"
          className="h-full min-h-[20rem] w-full border-0 bg-muted"
        />
      )}
    </div>
  )
}

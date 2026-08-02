import { useEffect, useState } from 'react'
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getSectionColor } from '@/lib/sectionColors'
import { pageBoxesForPlan } from '@/lib/boxGeometry'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { PdfCanvasPages } from '@/components/preview/PdfCanvasPages'
import { BoxesOverlay } from '@/components/preview/BoxesOverlay'

interface PdfCanvasPreviewProps {
  document: ResumeDocument
  contentKey: string
}

/**
 * Builder preview pane: the custom canvas PDF renderer with the optional
 * section-boxes overlay (legend, per-page fill captions, page-break
 * markers) and the "Updating preview…" shimmer.
 */
export function PdfCanvasPreview({ document, contentKey }: PdfCanvasPreviewProps) {
  const setPreviewPageCount = useDocumentStore((s) => s.setPreviewPageCount)
  const setPreviewPdfBlob = useDocumentStore((s) => s.setPreviewPdfBlob)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const showLayoutBoxes = useDocumentStore((s) => s.showLayoutBoxes)

  const { loading, refreshing, error, pageCount, blob, revision } = usePdfPreview(
    document,
    contentKey,
  )
  const [hoveredSection, setHoveredSection] = useState<SectionId | null>(null)

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

  if (loading && !blob) {
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

  if (!blob) return null

  return (
    <div className="relative h-full min-h-[20rem] min-w-0 flex-1">
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

      <PdfCanvasPages
        key={revision}
        blob={blob}
        zoomMode="fit"
        overlay={
          showLayoutBoxes && layoutPlan
            ? (pageIndex, scale) => (
                <BoxesOverlay
                  plan={layoutPlan}
                  pageIndex={pageIndex}
                  scale={scale}
                  hoveredSection={hoveredSection}
                  onHoverSection={setHoveredSection}
                />
              )
            : undefined
        }
        footer={
          showLayoutBoxes && layoutPlan
            ? (pageIndex, total) => {
                const geometry = pageBoxesForPlan(layoutPlan, pageIndex, 1)
                return (
                  <div className="flex items-baseline justify-between px-0.5 pb-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Page {pageIndex + 1} of {total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(geometry.fillRatio * 100)}% full
                    </p>
                  </div>
                )
              }
            : undefined
        }
      />

      {showLayoutBoxes && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border bg-muted/50 px-3 py-2">
          {document.meta.sectionOrder.map((sectionId) => (
            <button
              key={sectionId}
              type="button"
              title={`Jump to ${getSectionLabel(sectionId, {})} in the form`}
              onMouseEnter={() => setHoveredSection(sectionId)}
              onMouseLeave={() => setHoveredSection(null)}
              onClick={() => scrollToFormSection(sectionId)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                hoveredSection === sectionId
                  ? 'border-border bg-card text-foreground'
                  : 'border-border bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getSectionColor(sectionId).text }}
              />
              {getSectionLabel(sectionId, {})}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

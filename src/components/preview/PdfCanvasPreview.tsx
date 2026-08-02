import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { useDocumentStore } from '@/app/store/documentStore'
import { destroyPdfDocument, loadPdfPreviewLayout } from '@/renderers/pdf/renderPdfWithPdfJs'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getSectionColor } from '@/lib/sectionColors'
import { pageBoxesForPlan } from '@/lib/boxGeometry'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { BoxesOverlay } from '@/components/preview/BoxesOverlay'

interface PdfCanvasPreviewProps {
  document: ResumeDocument
  contentKey: string
}

interface PageSize {
  width: number
  height: number
}

/**
 * Live preview: the exported PDF rendered page-by-page to canvases with
 * pdf.js, so layout boxes can be overlaid directly on the real pages
 * (PDF units are points - the same unit as the layout plan).
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

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const proxyRef = useRef<Awaited<ReturnType<typeof loadPdfPreviewLayout>> | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(1)
  const [pageSizes, setPageSizes] = useState<PageSize[]>([])
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

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const measure = () => setContainerWidth(container.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Load the PDF and measure pages (fit-width scale).
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!blob || containerWidth <= 0) return
      try {
        const layout = await loadPdfPreviewLayout(blob, {
          zoomMode: 'fit',
          containerWidth,
        })
        if (cancelled) return
        proxyRef.current = layout
        setScale(layout.scale)
        setPageSizes(layout.pages.map((p) => ({ width: p.width, height: p.height })))
      } catch {
        if (!cancelled) {
          proxyRef.current = null
          setPageSizes([])
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      if (proxyRef.current) {
        void destroyPdfDocument(proxyRef.current.pdf)
        proxyRef.current = null
      }
    }
  }, [blob, containerWidth, revision])

  // Render every page to its canvas once sizes are known (refs are set by then).
  useEffect(() => {
    let cancelled = false
    if (!proxyRef.current || pageSizes.length === 0) return

    const run = async () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const pdf = proxyRef.current!.pdf
      for (let i = 0; i < pageSizes.length; i++) {
        if (cancelled) return
        const canvas = canvasRefs.current[i]
        if (!canvas) continue
        const page = await pdf.getPage(i + 1)
        if (cancelled) return
        const viewport = page.getViewport({ scale: dpr })
        canvas.width = Math.floor(pageSizes[i].width * dpr)
        canvas.height = Math.floor(pageSizes[i].height * dpr)
        canvas.style.width = `${pageSizes[i].width}px`
        canvas.style.height = `${pageSizes[i].height}px`
        const context = canvas.getContext('2d')
        if (!context) continue
        await page.render({ canvasContext: context, viewport, canvas }).promise
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [pageSizes, revision])

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

  if (!blob || pageSizes.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Rendering PDF preview…</p>
      </div>
    )
  }

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

      <div
        ref={containerRef}
        className="flex h-full min-h-0 flex-col items-center gap-4 overflow-y-auto p-3"
      >
        {showLayoutBoxes && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
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

        {pageSizes.map((size, index) => {
          const geometry = layoutPlan ? pageBoxesForPlan(layoutPlan, index, scale) : null
          return (
            <div key={`${revision}-${index}`} className="relative w-full">
              {showLayoutBoxes && geometry && (
                <div className="flex items-baseline justify-between px-0.5 pb-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Page {index + 1} of {pageSizes.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(geometry.fillRatio * 100)}% full
                  </p>
                </div>
              )}
              <canvas
                ref={(el) => {
                  canvasRefs.current[index] = el
                }}
                className="block w-full rounded-sm bg-card shadow-[var(--shadow-raised)]"
                style={{ aspectRatio: `${size.width} / ${size.height}` }}
                aria-label={`PDF page ${index + 1}`}
              />
              {showLayoutBoxes && layoutPlan && (
                <BoxesOverlay
                  plan={layoutPlan}
                  pageIndex={index}
                  scale={scale}
                  hoveredSection={hoveredSection}
                  onHoverSection={setHoveredSection}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

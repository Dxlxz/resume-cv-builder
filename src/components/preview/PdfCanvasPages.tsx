import { useEffect, useRef, useState, type ReactNode } from 'react'
import { destroyPdfDocument, loadPdfPreviewLayout } from '@/renderers/pdf/renderPdfWithPdfJs'

interface PageSize {
  width: number
  height: number
}

interface PdfCanvasPagesProps {
  blob: Blob
  zoomMode: 'fit' | '100'
  /** Per-page overlay rendered above the canvas (e.g. layout boxes). */
  overlay?: (pageIndex: number, scale: number) => ReactNode
  /** Per-page caption rendered above the canvas. */
  footer?: (pageIndex: number, total: number) => ReactNode
}

/**
 * Page-by-page canvas renderer for a PDF blob (pdf.js). Shared by the
 * builder preview pane and the fullscreen modal. PDF units are points,
 * so overlays drawn at `pt x scale` align exactly with the rendered
 * pages. The pdf proxy is destroyed whenever the blob changes.
 */
export function PdfCanvasPages({ blob, zoomMode, overlay, footer }: PdfCanvasPagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const proxyRef = useRef<Awaited<ReturnType<typeof loadPdfPreviewLayout>> | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scale, setScale] = useState(1)
  const [pageSizes, setPageSizes] = useState<PageSize[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const measure = () => setContainerWidth(container.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (containerWidth <= 0) return
      try {
        const layout = await loadPdfPreviewLayout(blob, {
          zoomMode,
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
  }, [blob, containerWidth, zoomMode])

  useEffect(() => {
    let cancelled = false
    if (!proxyRef.current || pageSizes.length === 0) return

    const run = async () => {
      try {
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
      } catch {
        // The proxy can be torn down between loads - the next run redraws.
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [pageSizes, zoomMode])

  if (pageSizes.length === 0) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Rendering PDF preview…</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col items-center gap-4 overflow-y-auto p-3"
    >
      {pageSizes.map((size, index) => (
        <div key={`${index}-${pageSizes.length}`} className="relative w-full">
          {footer?.(index, pageSizes.length)}
          <canvas
            ref={(el) => {
              canvasRefs.current[index] = el
            }}
            className="block w-full rounded-sm bg-card shadow-[var(--shadow-raised)]"
            style={{ aspectRatio: `${size.width} / ${size.height}` }}
            aria-label={`PDF page ${index + 1}`}
          />
          {overlay?.(index, scale)}
        </div>
      ))}
    </div>
  )
}

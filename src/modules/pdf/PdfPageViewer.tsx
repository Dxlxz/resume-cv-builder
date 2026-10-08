import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { destroyPdfDocument } from './renderPdfWithPdfJs'
import { loadPdfDocument } from './pdfjsClient'
import { pickLivePages } from './pickLivePages'

/** Phones run out of canvas memory first, so the render resolution and the number of live canvases are capped. */
export const MAX_PIXEL_RATIO = 2
export const MAX_LIVE_PAGES = 3

type Zone = 'screen' | 'near'

interface PageBox {
  pageNumber: number
  /** Width and height at scale 1 (PDF points). */
  width: number
  height: number
}

interface PdfPageViewerProps {
  blob: Blob
  /** Where the user can open or save the file if drawing fails. */
  fallbackHref?: string
  className?: string
  /** Draw only the first pages, for a thumbnail. */
  maxPages?: number
  /** Multiplies the fit-to-width scale: 1 fits the page to the viewer's width. */
  zoom?: number
  /** Called with the first page on screen whenever it changes. */
  onPageChange?: (pageNumber: number) => void
}

/**
 * Draws a PDF page by page on canvases, for browsers whose built-in viewer is unreliable (phones). Only the pages near
 * the viewport hold a canvas, at most {@link MAX_LIVE_PAGES}; the rest keep their height and are released.
 */
export function PdfPageViewer({ blob, fallbackHref, className, maxPages, zoom = 1, onPageChange }: PdfPageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [boxes, setBoxes] = useState<PageBox[]>([])
  const [width, setWidth] = useState(0)
  const [failedBlob, setFailedBlob] = useState<Blob | null>(null)
  const failed = failedBlob === blob
  const [onScreen, setOnScreen] = useState<ReadonlySet<number>>(() => new Set([1]))
  const [near, setNear] = useState<ReadonlySet<number>>(() => new Set([1]))

  // Load only once the viewer has a width, so a hidden tab (display: none) does not decode every new preview.
  const ready = width > 0

  // A new PDF replaces the shown one only once it has loaded, so an update never blanks the viewer; the previous
  // document is destroyed after the swap.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    void (async () => {
      let loaded: PDFDocumentProxy | null = null
      try {
        loaded = await loadPdfDocument(await blob.arrayBuffer())
        const next: PageBox[] = []
        for (let pageNumber = 1; pageNumber <= Math.min(loaded.numPages, maxPages ?? Infinity); pageNumber++) {
          const viewport = (await loaded.getPage(pageNumber)).getViewport({ scale: 1 })
          next.push({ pageNumber, width: viewport.width, height: viewport.height })
        }
        if (cancelled) {
          void destroyPdfDocument(loaded)
          return
        }
        setPdf(loaded)
        setBoxes(next)
      } catch {
        if (loaded) void destroyPdfDocument(loaded)
        if (!cancelled) setFailedBlob(blob)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [blob, ready, maxPages])

  const shownPdf = useRef<PDFDocumentProxy | null>(null)
  useEffect(() => {
    const previous = shownPdf.current
    shownPdf.current = pdf
    if (previous && previous !== pdf) void destroyPdfDocument(previous)
  }, [pdf])
  useEffect(
    () => () => {
      if (shownPdf.current) void destroyPdfDocument(shownPdf.current)
    },
    [],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setWidth(Math.floor(entries[0]?.contentRect.width ?? 0)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const live = pickLivePages(onScreen, near, MAX_LIVE_PAGES)
  // The current page is the one under the middle of the viewer, not merely the first visible: the foot of page 1 can
  // still show while page 2 fills the view.
  const [currentPage, setCurrentPage] = useState(1)
  const updateCurrentPage = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const viewTop = el.getBoundingClientRect().top
    const middle = el.clientHeight / 2
    let page = 1
    el.querySelectorAll<HTMLElement>('[data-page]').forEach((node) => {
      if (node.getBoundingClientRect().top - viewTop <= middle) page = Number(node.dataset.page)
    })
    setCurrentPage(page)
  }, [])

  useEffect(() => {
    updateCurrentPage()
  }, [updateCurrentPage, onScreen, zoom, width])

  useEffect(() => {
    onPageChange?.(currentPage)
  }, [currentPage, onPageChange])

  const setPageVisible = useCallback((pageNumber: number, zone: Zone, isVisible: boolean) => {
    const update = (prev: ReadonlySet<number>) => {
      if (prev.has(pageNumber) === isVisible) return prev
      const next = new Set(prev)
      if (isVisible) next.add(pageNumber)
      else next.delete(pageNumber)
      return next
    }
    if (zone === 'screen') setOnScreen(update)
    else setNear(update)
  }, [])

  if (failed) {
    return (
      <div role="alert" className="flex flex-col items-center gap-2 p-6 text-center text-sm text-foreground">
        <TriangleAlertIcon className="size-5 text-destructive-foreground" aria-hidden />
        <p>This device could not show the preview.</p>
        {fallbackHref && (
          <a href={fallbackHref} download="resume.pdf" className="font-medium text-primary underline underline-offset-4">
            Download the PDF instead
          </a>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} onScroll={updateCurrentPage} className={className ?? 'h-full w-full overflow-y-auto bg-muted p-2'}>
      {!pdf && (
        <div role="status" className="mx-auto mt-6 flex w-fit items-center justify-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm ring-1 ring-foreground/10">
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          Rendering PDF preview…
        </div>
      )}
      {pdf &&
        width > 0 &&
        boxes.slice(0, maxPages ?? boxes.length).map((box) => {
          const scale = Math.max(0.1, ((width - 16) / box.width) * zoom)
          return (
            <PdfCanvasPage
              key={box.pageNumber}
              pdf={pdf}
              box={box}
              cssWidth={box.width * scale}
              cssHeight={box.height * scale}
              active={live.includes(box.pageNumber)}
              scrollRoot={containerRef}
              onVisible={setPageVisible}
            />
          )
        })}
    </div>
  )
}

interface PdfCanvasPageProps {
  pdf: PDFDocumentProxy
  box: PageBox
  cssWidth: number
  cssHeight: number
  active: boolean
  /** The scrolling container, so pages are drawn a little before they scroll into view. */
  scrollRoot: React.RefObject<HTMLElement | null>
  onVisible: (pageNumber: number, zone: Zone, visible: boolean) => void
}

function PdfCanvasPage({ pdf, box, cssWidth, cssHeight, active, scrollRoot, onVisible }: PdfCanvasPageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const watch = (zone: Zone, rootMargin: string) => {
      const observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => onVisible(box.pageNumber, zone, entry.isIntersecting)),
        { root: scrollRoot.current, rootMargin },
      )
      observer.observe(el)
      return observer
    }
    const observers = [watch('screen', '0px'), watch('near', '100% 0px')]
    return () => observers.forEach((o) => o.disconnect())
  }, [box.pageNumber, onVisible, scrollRoot])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const release = () => {
      canvas.width = 0
      canvas.height = 0
    }
    if (!active) {
      release()
      return
    }
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null
    let cancelled = false
    void (async () => {
      try {
        const page = await pdf.getPage(box.pageNumber)
        if (cancelled) return
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
        const viewport = page.getViewport({ scale: (cssWidth / box.width) * ratio })
        // Draw off screen, then copy: the page being replaced stays visible until its successor is ready.
        const offscreen = window.document.createElement('canvas')
        offscreen.width = Math.floor(viewport.width)
        offscreen.height = Math.floor(viewport.height)
        const context = offscreen.getContext('2d')
        if (!context) return
        task = page.render({ canvasContext: context, viewport, canvas: offscreen })
        await task.promise
        if (cancelled) return
        canvas.width = offscreen.width
        canvas.height = offscreen.height
        canvas.getContext('2d')?.drawImage(offscreen, 0, 0)
      } catch {
        // A cancelled render rejects; a real failure leaves the page blank rather than breaking the others.
      }
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [active, pdf, box.pageNumber, box.width, cssWidth])

  return (
    <div
      ref={wrapRef}
      data-page={box.pageNumber}
      className="mx-auto mb-2 bg-paper shadow-sm ring-1 ring-foreground/10"
      style={{ width: cssWidth, height: cssHeight }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Page ${box.pageNumber}`}
        style={{ width: cssWidth, height: cssHeight }}
        className="block"
      />
    </div>
  )
}

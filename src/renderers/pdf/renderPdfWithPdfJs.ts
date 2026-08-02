import type { PDFDocumentProxy } from 'pdfjs-dist'
import { loadPdfDocument } from '@/renderers/pdf/pdfjsClient'

export interface PdfPageLayout {
  pageNumber: number
  width: number
  height: number
}

export interface RenderedPdfPage extends PdfPageLayout {
  /** @deprecated PNG snapshot — prefer canvas + text layer in preview */
  dataUrl?: string
}

export interface RenderPdfPreviewOptions {
  zoomMode: 'fit' | '100'
  containerWidth: number
}

export interface PdfPreviewLayout {
  pages: PdfPageLayout[]
  pageCount: number
  scale: number
  pdf: PDFDocumentProxy
}

/** CSS-pixel scale for roughly true print size (96dpi screen, 72pt PDF). */
export const PDF_NATURAL_SCREEN_SCALE = 96 / 72

export async function loadPdfPreviewLayout(
  blob: Blob,
  options: RenderPdfPreviewOptions,
): Promise<PdfPreviewLayout> {
  const buffer = await blob.arrayBuffer()
  const pdf = await loadPdfDocument(buffer)
  const firstPage = await pdf.getPage(1)
  const baseViewport = firstPage.getViewport({ scale: 1 })
  const scale =
    options.zoomMode === '100'
      ? PDF_NATURAL_SCREEN_SCALE
      : Math.max(0.5, Math.min(2, (options.containerWidth - 8) / baseViewport.width))

  const pages: PdfPageLayout[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return { pages, pageCount: pages.length, scale, pdf }
}

export async function destroyPdfDocument(pdf: PDFDocumentProxy): Promise<void> {
  // pdfjs-dist v6 types no longer declare destroy() on the proxy, but the
  // runtime method still exists and releases the worker.
  const destroyable = pdf as PDFDocumentProxy & { destroy?: () => Promise<void> }
  if (typeof destroyable.destroy === 'function') {
    await destroyable.destroy()
  }
}

/** Legacy raster path — kept for tests or fallback. */
export async function renderPdfBlobToPages(
  blob: Blob,
  options: RenderPdfPreviewOptions,
): Promise<{ pages: RenderedPdfPage[]; pageCount: number }> {
  const { pages, pageCount, scale, pdf } = await loadPdfPreviewLayout(blob, options)
  const rendered: RenderedPdfPage[] = []

  for (const meta of pages) {
    const page = await pdf.getPage(meta.pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context unavailable')

    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport, canvas }).promise

    rendered.push({
      ...meta,
      dataUrl: canvas.toDataURL('image/png'),
    })
  }

  await destroyPdfDocument(pdf)
  return { pages: rendered, pageCount }
}

import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import '@/components/preview/pdf-text-layer.css'

interface PdfSelectablePageProps {
  pdf: PDFDocumentProxy
  pageNumber: number
  scale: number
  width: number
  height: number
  className?: string
}

export function PdfSelectablePage({
  pdf,
  pageNumber,
  scale,
  width,
  height,
  className = '',
}: PdfSelectablePageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let textLayer: { cancel: () => void; render: () => Promise<void> } | null = null

    const render = async () => {
      const canvas = canvasRef.current
      const textContainer = textLayerRef.current
      if (!canvas || !textContainer) return

      const page = await pdf.getPage(pageNumber)
      if (cancelled) return

      const viewport = page.getViewport({ scale })
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context, viewport, canvas }).promise
      if (cancelled) return

      textContainer.replaceChildren()
      textContainer.style.width = `${viewport.width}px`
      textContainer.style.height = `${viewport.height}px`

      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      textLayer = new pdfjs.TextLayer({
        textContentSource: await page.getTextContent(),
        container: textContainer,
        viewport,
      })
      await textLayer.render()
    }

    void render()

    return () => {
      cancelled = true
      textLayer?.cancel()
    }
  }, [pdf, pageNumber, scale])

  return (
    <div
      className={`pdf-page-layer ${className}`}
      style={{ width, height }}
      data-page={pageNumber}
    >
      <canvas ref={canvasRef} width={width} height={height} aria-hidden />
      <div ref={textLayerRef} className="textLayer" aria-hidden={false} />
    </div>
  )
}

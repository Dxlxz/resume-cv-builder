import { useEffect, useState } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { generatePdf } from '@/lib/pdf'
import { renderPdfBlobToPages } from '@/renderers/pdf/renderPdfWithPdfJs'
import { getPreset } from '@rb/presets/registry'

/**
 * Renders the first page of a document through the same pipeline as the
 * builder (generatePdf -> pdfjs raster). Used by the landing page to show
 * real exported PDFs from fictional sample data. `enabled` defers the
 * render until the consumer is on screen.
 */

export interface SamplePdfState {
  dataUrl: string | null
  pageCount: number
  failed: boolean
}

const RENDER_WIDTH = 420

export function useSamplePdfPreview(
  document: ResumeDocument,
  enabled = true,
): SamplePdfState {
  const [state, setState] = useState<SamplePdfState>({
    dataUrl: null,
    pageCount: 0,
    failed: false,
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const run = async () => {
      try {
        const preset = getPreset(document.meta.presetId)
        const blob = await generatePdf(document, preset.labels)
        if (cancelled) return
        const { pages, pageCount } = await renderPdfBlobToPages(blob, {
          zoomMode: 'fit',
          containerWidth: RENDER_WIDTH,
        })
        if (cancelled) return
        setState({ dataUrl: pages[0]?.dataUrl ?? null, pageCount, failed: false })
      } catch {
        if (!cancelled) setState({ dataUrl: null, pageCount: 0, failed: true })
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [document, enabled])

  return state
}

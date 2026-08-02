import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { ResumeDocument } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { generatePdfWithPlan } from '@/renderers/pdf/generatePdf'
import { useDocumentStore } from '@/app/store/documentStore'
import { getPreset } from '@rb/presets/registry'
import {
  destroyPdfDocument,
  loadPdfPreviewLayout,
  type PdfPageLayout,
} from '@/renderers/pdf/renderPdfWithPdfJs'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'

const DEBOUNCE_MS = 400

export interface PdfPreviewOptions {
  layoutDebug?: boolean
  containerWidth?: number
  zoomMode?: 'fit' | '100'
}

export interface PdfPreviewState {
  loading: boolean
  refreshing: boolean
  error: string | null
  pages: PdfPageLayout[]
  pageCount: number
  blob: Blob | null
  scale: number
  pdf: PDFDocumentProxy | null
  revision: number
}

export function usePdfPreview(
  document: ResumeDocument,
  contentKey: string,
  options: PdfPreviewOptions = {},
): PdfPreviewState {
  const { layoutDebug = false, containerWidth = 0, zoomMode = 'fit' } = options

  const [state, setState] = useState<PdfPreviewState>({
    loading: true,
    refreshing: false,
    error: null,
    pages: [],
    pageCount: 0,
    blob: null,
    scale: 1,
    pdf: null,
    revision: 0,
  })
  const requestId = useRef(0)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const documentRef = useRef(document)

  useEffect(() => {
    documentRef.current = document
  }, [document])

  useEffect(() => {
    const currentRequest = ++requestId.current
    let cancelled = false

    const run = async () => {
      setState((prev) => ({
        ...prev,
        loading: prev.blob === null,
        refreshing: prev.blob !== null,
        error: null,
      }))

      try {
        const presetLabels = getPreset(documentRef.current.meta.presetId).labels
        const plan = await computeLayoutPlan(documentRef.current, presetLabels)
        if (cancelled || currentRequest !== requestId.current) return
        const blob = await generatePdfWithPlan(documentRef.current, plan)
        if (cancelled || currentRequest !== requestId.current) return

        let pages: PdfPageLayout[] = []
        let scale = 1
        let pdf: PDFDocumentProxy | null = null

        if (layoutDebug && containerWidth > 0) {
          const layout = await loadPdfPreviewLayout(blob, { zoomMode, containerWidth })
          if (cancelled || currentRequest !== requestId.current) return

          if (pdfRef.current) {
            await destroyPdfDocument(pdfRef.current)
          }
          pdfRef.current = layout.pdf
          pages = layout.pages
          scale = layout.scale
          pdf = layout.pdf
        }

        const pdfPageCount = await countPdfPages(blob)
        if (cancelled || currentRequest !== requestId.current) return

        useDocumentStore.getState().setLayoutPlan(plan)
        setState({
          loading: false,
          refreshing: false,
          error: null,
          pages,
          pageCount: pdfPageCount,
          blob,
          scale,
          pdf,
          revision: currentRequest,
        })
      } catch (err) {
        console.error('PDF preview failed:', err)
        if (cancelled || currentRequest !== requestId.current) return
        setState((prev) => ({
          loading: false,
          refreshing: false,
          error: 'Could not render PDF preview.',
          pages: prev.pages,
          pageCount: prev.pageCount,
          blob: prev.blob,
          scale: prev.scale,
          pdf: prev.pdf,
          revision: currentRequest,
        }))
      }
    }

    const timer = setTimeout(() => {
      void run()
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [contentKey, layoutDebug, containerWidth, zoomMode])

  useEffect(() => {
    return () => {
      if (pdfRef.current) {
        void destroyPdfDocument(pdfRef.current)
        pdfRef.current = null
      }
    }
  }, [])

  return state
}

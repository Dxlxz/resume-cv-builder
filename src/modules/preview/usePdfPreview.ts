import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/pipeline/computeLayoutPlan'
import { generatePdf, generatePdfWithPlan, pdfEngine } from '@/modules/pdf'
import { useDocumentStore } from '@/modules/document'
import { getPreset } from '@rb/presets/registry'
import { countPdfPages } from '@/modules/pdf'

/** Wait after the last edit. Typst compiles in ~10 ms, so it can follow typing closely; react-pdf needs longer. */
const DEBOUNCE_MS = { typst: 150, 'react-pdf': 400 } as const

export interface PdfPreviewState {
  loading: boolean
  refreshing: boolean
  error: string | null
  pageCount: number
  blob: Blob | null
  /** The document `blob` was rendered from. */
  source: ResumeDocument | null
  revision: number
}

/**
 * Live PDF preview state: generates the exported blob for the content
 * revision (debounced) and commits the layout plan atomically.
 */
export function usePdfPreview(
  document: ResumeDocument,
  contentKey: string,
): PdfPreviewState {
  const [state, setState] = useState<PdfPreviewState>({
    loading: true,
    refreshing: false,
    error: null,
    pageCount: 0,
    blob: null,
    source: null,
    revision: 0,
  })
  const requestId = useRef(0)
  const documentRef = useRef(document)

  useEffect(() => {
    documentRef.current = document
  }, [document])

  useEffect(() => {
    const currentRequest = ++requestId.current
    let cancelled = false
    const engine = pdfEngine()

    const run = async () => {
      setState((prev) => ({
        ...prev,
        loading: prev.blob === null,
        refreshing: prev.blob !== null,
        error: null,
      }))

      try {
        const presetLabels = getPreset(documentRef.current.meta.presetId).labels
        const source = documentRef.current
        // Typst paginates by itself, so the react-pdf measure (a hidden-DOM layout of every block) is skipped; if
        // Typst fails, generatePdf measures for the react-pdf fallback. Plan-based lints then have no plan (D-004).
        const plan = engine === 'typst' ? null : await computeLayoutPlan(source, presetLabels)
        if (cancelled || currentRequest !== requestId.current) return
        const blob = plan ? await generatePdfWithPlan(source, plan, presetLabels) : await generatePdf(source, presetLabels)
        if (cancelled || currentRequest !== requestId.current) return

        const pdfPageCount = await countPdfPages(blob)
        if (cancelled || currentRequest !== requestId.current) return

        useDocumentStore.getState().setLayoutPlan(plan)
        setState({
          loading: false,
          refreshing: false,
          error: null,
          pageCount: pdfPageCount,
          blob,
          source,
          revision: currentRequest,
        })
      } catch (err) {
        console.error('PDF preview failed:', err)
        if (cancelled || currentRequest !== requestId.current) return
        setState((prev) => ({
          loading: false,
          refreshing: false,
          error: 'Could not render PDF preview.',
          pageCount: prev.pageCount,
          blob: prev.blob,
          source: prev.source,
          revision: currentRequest,
        }))
      }
    }

    const timer = setTimeout(() => {
      void run()
    }, DEBOUNCE_MS[engine])

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [contentKey])

  return state
}

import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { generatePdfWithPlan } from '@/renderers/pdf/generatePdf'
import { useDocumentStore } from '@/app/store/documentStore'
import { getPreset } from '@rb/presets/registry'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'

const DEBOUNCE_MS = 400

export interface PdfPreviewState {
  loading: boolean
  refreshing: boolean
  error: string | null
  pageCount: number
  blob: Blob | null
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

        const pdfPageCount = await countPdfPages(blob)
        if (cancelled || currentRequest !== requestId.current) return

        useDocumentStore.getState().setLayoutPlan(plan)
        setState({
          loading: false,
          refreshing: false,
          error: null,
          pageCount: pdfPageCount,
          blob,
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
  }, [contentKey])

  return state
}

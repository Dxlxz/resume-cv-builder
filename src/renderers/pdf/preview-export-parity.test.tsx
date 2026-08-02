import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {sampleCvDocument, sampleProfileDocument} from '@rb/fixtures'
import { PdfCanvasPreview } from '@/components/preview/PdfCanvasPreview'
import { generatePdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'

vi.mock('@/hooks/usePdfPreview', () => ({
  usePdfPreview: () => ({
    loading: true,
    refreshing: false,
    error: null,
    pageCount: 0,
    blob: null,
    revision: 0,
  }),
}))

vi.mock('@/app/store/documentStore', () => {
  const state = {
    setPreviewPageCount: vi.fn(),
    setPreviewPdfBlob: vi.fn(),
    layoutPlan: null,
    previewPageCount: 2,
    showLayoutBoxes: false,
    setShowLayoutBoxes: vi.fn(),
    focusedSection: null,
    setFocusedSection: vi.fn(),
  }
  const useDocumentStore = Object.assign(
    (selector: (s: typeof state) => unknown) => selector(state),
    { getState: () => state },
  )
  return { useDocumentStore }
})

describe('preview-export parity', () => {
  it('PdfCanvasPreview mounts its loading state (no iframe)', () => {
    render(
      <PdfCanvasPreview
        document={sampleProfileDocument}
        contentKey="parity-test"
      />,
    )
    expect(screen.getByText('Rendering PDF preview…')).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('complete CV PDF has at least 3 pages', async () => {
    const blob = await generatePdf(sampleCvDocument)
    const pages = await countPdfPages(blob)
    expect(pages).toBeGreaterThanOrEqual(3)
  }, 30000)

  it('layout plan page count is within 3 of exported PDF pages for the CV', async () => {
    const plan = await computeLayoutPlan(sampleCvDocument)
    const blob = await generatePdf(sampleCvDocument)
    const pdfPages = await countPdfPages(blob)
    // Complete CV stresses layout planner vs Yoga; wider band than 2-page resumes
    expect(Math.abs(plan.plan.pageCount - pdfPages)).toBeLessThanOrEqual(3)
  }, 30000)
})

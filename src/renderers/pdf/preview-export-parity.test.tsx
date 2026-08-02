import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {sampleCvDocument, sampleProfileDocument} from '@rb/fixtures'
import { PdfJsPreview } from '@/components/preview/PdfJsPreview'
import { generatePdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'

const mockPreviewBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })

vi.mock('@/hooks/usePdfPreview', () => ({
  usePdfPreview: () => ({
    loading: false,
    refreshing: false,
    error: null,
    pages: [],
    pageCount: 2,
    blob: mockPreviewBlob,
    scale: 1,
    pdf: null,
    revision: 1,
  }),
}))

vi.mock('@/app/store/documentStore', () => {
  const state = {
    setPreviewPageCount: vi.fn(),
    setPreviewPdfBlob: vi.fn(),
    layoutPlan: null,
    previewPageCount: 2,
  }
  const useDocumentStore = Object.assign(
    (selector: (s: typeof state) => unknown) => selector(state),
    { getState: () => state },
  )
  return { useDocumentStore }
})

describe('preview-export parity', () => {
  it('PdfJsPreview embeds the PDF blob in an iframe', () => {
    render(
      <PdfJsPreview
        document={sampleProfileDocument}
        contentKey="parity-test"
      />,
    )
    expect(screen.getByTitle('Resume PDF live preview')).toBeInTheDocument()
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

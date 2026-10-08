import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {sampleCvDocument, sampleProfileDocument} from '@rb/fixtures'
import { PdfJsPreview } from './PdfJsPreview'
import { generatePdf } from '@/modules/pdf'
import { countPdfPages } from '@/modules/pdf'
import { computeLayoutPlan } from '@rb/pipeline/computeLayoutPlan'

const mockPreviewBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })

vi.mock('./usePdfPreview', () => ({
  usePdfPreview: () => ({
    loading: false,
    refreshing: false,
    error: null,
    pageCount: 2,
    blob: mockPreviewBlob,
    revision: 1,
  }),
}))

vi.mock('@/modules/document/documentStore', () => {
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
  it('PdfJsPreview draws on canvas with its own zoom and page controls by default', () => {
    render(<PdfJsPreview document={sampleProfileDocument} contentKey="parity-test" />)
    expect(screen.getByRole('toolbar', { name: 'Preview controls' })).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    const fit = screen.getByRole('button', { name: /Reset to fit width/ })
    expect(fit).toHaveTextContent('Fit')
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(fit).toHaveTextContent('125%')
    fireEvent.click(fit)
    expect(fit).toHaveTextContent('Fit')
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(fit).toHaveTextContent('75%')
    expect(screen.queryByTitle('Resume PDF live preview')).not.toBeInTheDocument()
  })

  it('PdfJsPreview embeds the PDF blob in an iframe when ?pdf=native asks for it', () => {
    Object.defineProperty(navigator, 'pdfViewerEnabled', { value: true, configurable: true })
    window.history.pushState({}, '', '/?pdf=native')
    render(
      <PdfJsPreview
        document={sampleProfileDocument}
        contentKey="parity-test"
      />,
    )
    expect(screen.getByTitle('Resume PDF live preview')).toBeInTheDocument()
    window.history.pushState({}, '', '/')
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

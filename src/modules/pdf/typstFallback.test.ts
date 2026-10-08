/**
 * @vitest-environment node
 *
 * When Typst fails (for example the WASM cannot be fetched), the user still gets a PDF from react-pdf.
 */
import { describe, expect, it, vi } from 'vitest'
import { sampleResumeDocument } from '@rb/fixtures'

vi.mock('./pdfEngine', () => ({ pdfEngine: () => 'typst' }))
vi.mock('@rb/typst/renderWithTypst', () => ({
  supportsTypst: () => true,
  renderDocumentWithTypst: () => Promise.reject(new Error('WASM unavailable')),
}))
vi.mock('@rb/pipeline/computeLayoutPlan', () => ({ computeLayoutPlan: async () => ({}) }))
vi.mock('@rb/pipeline/renderDocumentToPdf', () => ({
  renderDocumentToPdf: async () => new Blob(['%PDF-react-pdf'], { type: 'application/pdf' }),
}))

describe('Typst fallback', () => {
  it('renders with react-pdf when Typst throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { generatePdf } = await import('./generatePdf')
    const blob = await generatePdf(sampleResumeDocument)
    expect(await blob.text()).toBe('%PDF-react-pdf')
    // Typst is tried once per render, not again on the react-pdf path.
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

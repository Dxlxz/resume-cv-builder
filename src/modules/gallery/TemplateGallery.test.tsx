import { useRef, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TEMPLATE_LIST } from '@rb/templates/registry'
import { useDocumentStore } from '@/modules/document'

vi.mock('@/modules/pdf', () => ({
  generatePdf: vi.fn(async () => new Blob(['%PDF-1.4'])),
  PdfPageViewer: ({ blob }: { blob: Blob }) => <div data-testid="viewer" data-size={blob.size} />,
}))

import { TemplateGallery } from './TemplateGallery'
import { clearThumbnailCache } from './useTemplateThumbnails'

describe('TemplateGallery', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearThumbnailCache()
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
  })

  it('lists every template in the registry (AC-1)', () => {
    render(<TemplateGallery open onOpenChange={() => {}} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(TEMPLATE_LIST.length)
    for (const template of TEMPLATE_LIST) {
      expect(screen.getByText(template.description)).toBeInTheDocument()
    }
  })

  it('shows a thumbnail made from the user document for each card (AC-2)', async () => {
    render(<TemplateGallery open onOpenChange={() => {}} />)
    await waitFor(() => expect(screen.getAllByTestId('viewer')).toHaveLength(TEMPLATE_LIST.length), { timeout: 5000 })
  })

  it('applies the chosen template and closes (AC-3)', () => {
    const onOpenChange = vi.fn()
    render(<TemplateGallery open onOpenChange={onOpenChange} />)
    const ivy = screen.getAllByRole('radio').find((r) => r.textContent?.includes('Harvard page'))!
    fireEvent.click(ivy)
    expect(useDocumentStore.getState().document?.meta.templateId).toBe('ivy')
    expect(useDocumentStore.getState().document?.meta.themeId).toBe('academic-serif')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('moves focus between cards with the arrow keys and marks the current one (AC-4)', () => {
    render(<TemplateGallery open onOpenChange={() => {}} />)
    const radios = screen.getAllByRole('radio')
    const current = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true')
    expect(current).toBeGreaterThanOrEqual(0)
    radios[current].focus()
    fireEvent.keyDown(radios[current], { key: 'ArrowRight' })
    expect(document.activeElement).toBe(radios[(current + 1) % radios.length])
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(radios[current])
    expect(radios[current]).toHaveTextContent('(current)')
  })

  it('keeps a card selectable when its thumbnail fails (AC-7)', async () => {
    const { generatePdf } = await import('@/modules/pdf')
    vi.mocked(generatePdf).mockRejectedValue(new Error('boom'))
    const onOpenChange = vi.fn()
    render(<TemplateGallery open onOpenChange={onOpenChange} />)
    await waitFor(() => expect(screen.getAllByText('Preview unavailable').length).toBeGreaterThan(0), { timeout: 5000 })
    fireEvent.click(screen.getAllByRole('radio')[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('labels only ATS Strict as portal-safe', () => {
    render(<TemplateGallery open onOpenChange={() => {}} />)
    expect(screen.getAllByText('Portal-safe')).toHaveLength(1)
    expect(screen.getAllByText('ATS-friendly').length).toBeGreaterThan(0)
  })

  it('hands focus back to the opener when it closes', async () => {
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null)
      const [open, setOpen] = useState(true)
      return (
        <>
          <button ref={ref} type="button">
            Opener
          </button>
          <TemplateGallery open={open} onOpenChange={setOpen} returnFocusTo={ref} />
        </>
      )
    }
    render(<Harness />)
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('radiogroup')).toBeNull())
    expect(document.activeElement).toBe(screen.getByText('Opener'))
  })

  it('draws card text on the card colours and thumbnail text on the paper colours', () => {
    render(<TemplateGallery open onOpenChange={() => {}} />)
    // The card is dark in the dark theme; paper text colour there would be unreadable.
    expect(screen.getByText(TEMPLATE_LIST[0].description).className).toContain('text-muted-foreground')
    for (const thumbnail of screen.getAllByTestId('template-thumbnail')) {
      expect(thumbnail.className).toContain('bg-paper')
      expect(thumbnail.className).toContain('text-paper-foreground')
    }
  })
})

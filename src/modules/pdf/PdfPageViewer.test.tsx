import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const PAGES = 6
const renderSpy = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
const destroy = vi.fn()
const getViewport = vi.fn(({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }))

vi.mock('./pdfjsClient', () => ({
  loadPdfDocument: vi.fn(async () => ({
    numPages: PAGES,
    getPage: async () => ({ getViewport, render: renderSpy }),
    destroy,
  })),
}))

import { PdfPageViewer, MAX_LIVE_PAGES, MAX_PIXEL_RATIO } from './PdfPageViewer'

class AllVisibleObserver {
  private cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(target: Element) {
    this.cb([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })

describe('PdfPageViewer', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', AllVisibleObserver)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as CanvasRenderingContext2D)
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
    renderSpy.mockClear()
    getViewport.mockClear()
    destroy.mockClear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('caps the pixel ratio and draws at most three pages at once (AC-13)', async () => {
    render(<PdfPageViewer blob={blob} />)
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(PAGES))
    await waitFor(() => expect(renderSpy).toHaveBeenCalled())
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(MAX_LIVE_PAGES)
    const cssScale = (800 - 16) / 612
    const ratios = getViewport.mock.calls.map(([arg]) => arg.scale / cssScale).filter((r) => r > 1.01)
    expect(ratios.length).toBeGreaterThan(0)
    expect(Math.max(...ratios)).toBeLessThanOrEqual(MAX_PIXEL_RATIO + 1e-6)
    const drawn = screen.getAllByRole('img').filter((c) => (c as HTMLCanvasElement).width > 0)
    expect(drawn.length).toBeLessThanOrEqual(MAX_LIVE_PAGES)
  })

  it('offers a download link when pdf.js cannot open the file', async () => {
    const { loadPdfDocument } = await import('./pdfjsClient')
    vi.mocked(loadPdfDocument).mockRejectedValueOnce(new Error('bad pdf'))
    render(<PdfPageViewer blob={blob} fallbackHref="blob:x" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not show the preview')
    expect(screen.getByRole('link', { name: 'Download the PDF instead' })).toHaveAttribute('href', 'blob:x')
  })

  it('destroys a document that finished loading after the viewer went away (review B2)', async () => {
    const { loadPdfDocument } = await import('./pdfjsClient')
    let release: (value: Awaited<ReturnType<typeof loadPdfDocument>>) => void = () => {}
    vi.mocked(loadPdfDocument).mockImplementationOnce(() => new Promise((resolve) => (release = resolve)))
    const { unmount } = render(<PdfPageViewer blob={blob} />)
    await waitFor(() => expect(loadPdfDocument).toHaveBeenCalled())
    unmount()
    release({ numPages: 1, getPage: async () => ({ getViewport, render: renderSpy }), destroy } as never)
    await waitFor(() => expect(destroy).toHaveBeenCalled())
  })
})

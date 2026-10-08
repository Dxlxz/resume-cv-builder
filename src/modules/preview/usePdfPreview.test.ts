import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LayoutPlanResult } from '@rb/layout/types'
import {sampleProfileDocument} from '@rb/fixtures'
import { usePdfPreview } from './usePdfPreview'
import { computeLayoutPlan } from '@rb/pipeline/computeLayoutPlan'
import { generatePdf, generatePdfWithPlan } from '@/modules/pdf'
import { countPdfPages } from '@/modules/pdf'

const setLayoutPlan = vi.fn()

vi.mock('@/modules/document/documentStore', () => ({
  useDocumentStore: { getState: () => ({ setLayoutPlan }) },
}))

vi.mock('@rb/pipeline/computeLayoutPlan', () => ({
  computeLayoutPlan: vi.fn(),
}))

vi.mock('@/modules/pdf/generatePdf', () => ({
  generatePdf: vi.fn(async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
  generatePdfWithPlan: vi.fn(async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
}))

const engine = { current: 'react-pdf' as 'react-pdf' | 'typst' }
vi.mock('@/modules/pdf/pdfEngine', () => ({ pdfEngine: () => engine.current }))

vi.mock('@/modules/pdf/countPdfPages', () => ({
  countPdfPages: vi.fn(async () => 1),
}))

vi.mock('@/modules/pdf/renderPdfWithPdfJs', () => ({
  loadPdfPreviewLayout: vi.fn(async () => ({
    pages: [],
    pageCount: 0,
    scale: 1,
    pdf: { destroy: vi.fn() },
  })),
  destroyPdfDocument: vi.fn(async () => {}),
}))

const planA = { id: 'A' } as unknown as LayoutPlanResult
const planB = { id: 'B' } as unknown as LayoutPlanResult

describe('usePdfPreview — atomic layout-plan commit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    engine.current = 'react-pdf'
    setLayoutPlan.mockClear()
    vi.mocked(generatePdfWithPlan).mockClear()
    vi.mocked(countPdfPages).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not let a late-resolving older plan overwrite a newer commit', async () => {
    let resolveA: (plan: LayoutPlanResult) => void = () => {}
    const deferredA = new Promise<LayoutPlanResult>((resolve) => {
      resolveA = resolve
    })

    vi.mocked(computeLayoutPlan)
      .mockImplementationOnce(() => deferredA)
      .mockImplementationOnce(async () => planB)

    const { rerender } = renderHook(
      ({ contentKey }) => usePdfPreview(sampleProfileDocument, contentKey),
      { initialProps: { contentKey: 'request-a' } },
    )

    // Let request A's debounce fire; it is now awaiting deferredA.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    // Start request B before A resolves.
    rerender({ contentKey: 'request-b' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    // Request B completes fully and commits its plan.
    expect(setLayoutPlan).toHaveBeenCalledWith(planB)

    // Now request A's stale plan resolves.
    resolveA(planA)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(setLayoutPlan).not.toHaveBeenCalledWith(planA)
    expect(setLayoutPlan).toHaveBeenLastCalledWith(planB)
  })

  it('retains the previous blob/pages and sets an error on failure', async () => {
    vi.mocked(computeLayoutPlan).mockImplementationOnce(async () => planA)
    vi.mocked(generatePdfWithPlan).mockImplementationOnce(async () => {
      throw new Error('boom')
    })

    const { result } = renderHook(() =>
      usePdfPreview(sampleProfileDocument, 'fail-request'),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400)
    })

    expect(result.current.error).toBe('Could not render PDF preview.')
    expect(result.current.blob).toBeNull()
    expect(result.current.pageCount).toBe(0)
  })

  it('skips the react-pdf measure when Typst renders, and follows typing closely', async () => {
    engine.current = 'typst'
    vi.mocked(computeLayoutPlan).mockClear()
    vi.mocked(generatePdf).mockClear()
    renderHook(() => usePdfPreview(sampleProfileDocument, 'typst-request'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150)
    })
    expect(computeLayoutPlan).not.toHaveBeenCalled()
    expect(generatePdf).toHaveBeenCalledTimes(1)
    expect(setLayoutPlan).toHaveBeenCalledWith(null)
  })
})
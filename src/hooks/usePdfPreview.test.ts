import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LayoutPlanResult } from '@rb/layout/types'
import {sampleProfileDocument} from '@rb/fixtures'
import { usePdfPreview } from '@/hooks/usePdfPreview'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { generatePdfWithPlan } from '@/renderers/pdf/generatePdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'

const setLayoutPlan = vi.fn()

vi.mock('@/app/store/documentStore', () => ({
  useDocumentStore: { getState: () => ({ setLayoutPlan }) },
}))

vi.mock('@rb/layout/computeLayoutPlan', () => ({
  computeLayoutPlan: vi.fn(),
}))

vi.mock('@/renderers/pdf/generatePdf', () => ({
  generatePdfWithPlan: vi.fn(async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' })),
}))

vi.mock('@/renderers/pdf/countPdfPages', () => ({
  countPdfPages: vi.fn(async () => 1),
}))

vi.mock('@/renderers/pdf/renderPdfWithPdfJs', () => ({
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
})

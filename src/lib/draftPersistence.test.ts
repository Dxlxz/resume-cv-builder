import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startDraftPersistence } from '@/lib/draftPersistence'
import { DRAFT_STORAGE_KEY_V2 } from '@/lib/persistence'
import { sampleResumeDocument } from '@rb/fixtures'
import type { ResumeDocument } from '@rb/core/types/document'

function newerDoc(base: ResumeDocument, updatedAt: string): ResumeDocument {
  return { ...base, meta: { ...base.meta, updatedAt } }
}

describe('draft persistence controller', () => {
  let current: ResumeDocument | null
  let controller: ReturnType<typeof startDraftPersistence> | null = null
  const statuses: { status: string; error?: string | null }[] = []
  const external: ResumeDocument[] = []

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    current = null
    statuses.length = 0
    external.length = 0
  })

  afterEach(() => {
    controller?.dispose()
    controller = null
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function makeController(debounceMs = 500) {
    controller = startDraftPersistence({
      getCurrent: () => current,
      onStatus: (status, error = null) => statuses.push({ status, error }),
      onExternalChange: (doc) => external.push(doc),
      debounceMs,
    })
    return controller
  }

  it('marks saving, then saves after the debounce and reports saved', () => {
    const controller = makeController()
    current = sampleResumeDocument
    controller.schedule(sampleResumeDocument)

    expect(statuses[0]).toEqual({ status: 'saving', error: null })
    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).toBeNull()

    vi.advanceTimersByTime(500)

    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).not.toBeNull()
    expect(statuses.at(-1)).toEqual({ status: 'saved', error: null })
  })

  it('flush writes immediately without waiting for the debounce', () => {
    const controller = makeController(5_000)
    current = sampleResumeDocument
    controller.schedule(sampleResumeDocument)
    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).toBeNull()

    controller.flush()

    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).not.toBeNull()
    expect(statuses.at(-1)).toEqual({ status: 'saved', error: null })
  })

  it('does not write a stale document after reset (generation guard)', () => {
    makeController()
    current = sampleResumeDocument
    controller?.schedule(sampleResumeDocument)

    current = null // reset happened before the debounce fired

    vi.advanceTimersByTime(500)

    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).toBeNull()
    expect(statuses.some((s) => s.status === 'saved')).toBe(false)
  })

  it('reports quota errors as an error status', () => {
    makeController()
    current = sampleResumeDocument
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError')
      })

    controller?.schedule(sampleResumeDocument)
    vi.advanceTimersByTime(500)

    expect(statuses.at(-1)).toEqual({
      status: 'error',
      error: 'Storage full. Export a JSON backup to free space.',
    })
    setItem.mockRestore()
  })

  it('adopts a newer revision written by another tab', () => {
    makeController()
    current = newerDoc(sampleResumeDocument, '2026-01-01T00:00:00.000Z')

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: DRAFT_STORAGE_KEY_V2,
        newValue: JSON.stringify(newerDoc(sampleResumeDocument, '2026-01-02T00:00:00.000Z')),
      }),
    )

    expect(external).toHaveLength(1)
    expect(external[0].meta.updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('ignores an older revision from another tab', () => {
    makeController()
    current = newerDoc(sampleResumeDocument, '2026-01-02T00:00:00.000Z')

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: DRAFT_STORAGE_KEY_V2,
        newValue: JSON.stringify(newerDoc(sampleResumeDocument, '2026-01-01T00:00:00.000Z')),
      }),
    )

    expect(external).toHaveLength(0)
  })

  it('ignores storage events after dispose', () => {
    const controller = makeController()
    current = newerDoc(sampleResumeDocument, '2026-01-01T00:00:00.000Z')
    controller.dispose()

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: DRAFT_STORAGE_KEY_V2,
        newValue: JSON.stringify(newerDoc(sampleResumeDocument, '2026-01-02T00:00:00.000Z')),
      }),
    )

    expect(external).toHaveLength(0)
  })

  it('flushes the pending draft on dispose', () => {
    const controller = makeController(5_000)
    current = sampleResumeDocument
    controller.schedule(sampleResumeDocument)

    controller.dispose()

    expect(localStorage.getItem(DRAFT_STORAGE_KEY_V2)).not.toBeNull()
  })
})

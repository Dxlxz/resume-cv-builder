import type { ResumeDocument } from '@rb/core/types/document'
import { parseAndMigrate } from '@rb/core/schema/migrate'
import { debounce, type Debounced } from '@/lib/utils'
import {
  DRAFT_STORAGE_KEY_V2,
  StorageQuotaError,
  trySaveToStorage,
} from '@/lib/persistence'

/**
 * Draft persistence controller. Owns the debounced autosave, flushes on
 * tab hide/unload, adopts newer drafts from other tabs, and refuses to
 * write stale documents (fixes the reset-then-save race).
 *
 * Store-agnostic: it talks to the store through the callbacks in
 * `DraftPersistenceOptions`, so it stays unit-testable.
 */

export type DraftSaveStatus = 'saving' | 'saved' | 'error'

export interface DraftPersistenceOptions {
  /** Returns the document the store currently considers canonical. */
  getCurrent: () => ResumeDocument | null
  onStatus: (status: DraftSaveStatus, error?: string | null) => void
  /** Another tab saved a newer revision of the draft. */
  onExternalChange: (document: ResumeDocument) => void
  debounceMs?: number
}

export interface DraftPersistenceController {
  schedule(document: ResumeDocument): void
  /** Writes any pending draft immediately (cancel + save). */
  flush(): void
  dispose(): void
}

const QUOTA_MESSAGE = 'Storage full. Export a JSON backup to free space.'
const FAILURE_MESSAGE = 'Could not save draft.'

export function startDraftPersistence(
  options: DraftPersistenceOptions,
): DraftPersistenceController {
  const { getCurrent, onStatus, onExternalChange, debounceMs = 500 } = options

  let pending: ResumeDocument | null = null
  let disposed = false

  const write = (document: ResumeDocument): void => {
    if (disposed) return
    // Generation guard: the document may have been reset or replaced since
    // this save was scheduled; writing it would resurrect stale content.
    if (getCurrent() !== document) return
    pending = null
    try {
      trySaveToStorage(document)
      onStatus('saved')
    } catch (error) {
      onStatus(
        'error',
        error instanceof StorageQuotaError ? QUOTA_MESSAGE : FAILURE_MESSAGE,
      )
    }
  }

  const debouncedWrite: Debounced<(document: ResumeDocument) => void> = debounce(
    write,
    debounceMs,
  )

  const schedule = (document: ResumeDocument): void => {
    if (disposed) return
    pending = document
    onStatus('saving')
    debouncedWrite(document)
  }

  const flush = (): void => {
    if (disposed) return
    if (!pending) return
    debouncedWrite.cancel()
    write(pending)
  }

  const onStorage = (event: StorageEvent): void => {
    if (disposed || event.key !== DRAFT_STORAGE_KEY_V2 || event.newValue == null) return
    let incoming: ResumeDocument | null
    try {
      incoming = parseAndMigrate(JSON.parse(event.newValue))
    } catch {
      return // malformed write from another tab: ignore
    }
    if (!incoming) return
    const current = getCurrent()
    if (!current) {
      onExternalChange(incoming)
      return
    }
    // Last editor wins: adopt only when the other tab's revision is newer.
    if (incoming.meta.updatedAt > current.meta.updatedAt) {
      onExternalChange(incoming)
    }
  }

  const onWindowHide = (): void => flush()

  const onVisibilityChange = (): void => {
    if (window.document.visibilityState === 'hidden') flush()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener('beforeunload', onWindowHide)
  window.addEventListener('pagehide', onWindowHide)
  window.document.addEventListener('visibilitychange', onVisibilityChange)

  return {
    schedule,
    flush,
    dispose() {
      flush()
      disposed = true
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('beforeunload', onWindowHide)
      window.removeEventListener('pagehide', onWindowHide)
      window.document.removeEventListener('visibilitychange', onVisibilityChange)
    },
  }
}

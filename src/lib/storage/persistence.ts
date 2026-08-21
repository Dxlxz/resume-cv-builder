import type { ResumeDocument } from '@rb/core/types/document'
import { parseAndMigrate } from '@rb/core/schema/migrate'

export const DRAFT_STORAGE_KEY_V2 = 'resume-cv-builder-draft-v2'
export const DRAFT_STORAGE_KEY_V1 = 'resume-cv-builder-draft-v1'
export const RECOVERY_KEY = 'resume-cv-builder-draft-corrupt'

/** Moves an unparseable v2 payload to the recovery key instead of deleting it. */
function quarantine(raw: string): void {
  localStorage.setItem(RECOVERY_KEY, raw)
  localStorage.removeItem(DRAFT_STORAGE_KEY_V2)
}

export function loadFromStorage(): ResumeDocument | null {
  const rawV2 = localStorage.getItem(DRAFT_STORAGE_KEY_V2)
  if (rawV2) {
    try {
      const doc = parseAndMigrate(JSON.parse(rawV2))
      if (doc) return doc
      quarantine(rawV2)
    } catch {
      quarantine(rawV2)
    }
  }

  try {
    const rawV1 = localStorage.getItem(DRAFT_STORAGE_KEY_V1)
    if (rawV1) {
      const migrated = parseAndMigrate(JSON.parse(rawV1))
      if (migrated) {
        saveToStorage(migrated)
        localStorage.removeItem(DRAFT_STORAGE_KEY_V1)
        return migrated
      }
      localStorage.removeItem(DRAFT_STORAGE_KEY_V1)
    }
  } catch {
    return null
  }

  return null
}

export function saveToStorage(document: ResumeDocument): void {
  localStorage.setItem(DRAFT_STORAGE_KEY_V2, JSON.stringify(document))
}

export function clearStorage(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY_V2)
  localStorage.removeItem(DRAFT_STORAGE_KEY_V1)
  localStorage.removeItem(RECOVERY_KEY)
}

export class StorageQuotaError extends Error {
  constructor() {
    super('Storage quota exceeded')
    this.name = 'StorageQuotaError'
  }
}

export function trySaveToStorage(document: ResumeDocument): void {
  try {
    saveToStorage(document)
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22)
    ) {
      throw new StorageQuotaError()
    }
    throw error
  }
}

/** True when a corrupted draft was quarantined and can be recovered. */
export function hasRecoverableDraft(): boolean {
  return localStorage.getItem(RECOVERY_KEY) !== null
}

/** Loads the quarantined draft back, if it can be parsed. The backup is kept until discarded. */
export function loadRecoveredDraft(): ResumeDocument | null {
  const raw = localStorage.getItem(RECOVERY_KEY)
  if (!raw) return null
  try {
    return parseAndMigrate(JSON.parse(raw)) ?? null
  } catch {
    return null
  }
}

export function discardRecoveredDraft(): void {
  localStorage.removeItem(RECOVERY_KEY)
}

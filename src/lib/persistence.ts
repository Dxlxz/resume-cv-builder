import type { ResumeDocument } from '@rb/core/types/document'
import { parseAndMigrate } from '@rb/core/schema/migrate'

const STORAGE_KEY_V2 = 'resume-cv-builder-draft-v2'
const STORAGE_KEY_V1 = 'resume-cv-builder-draft-v1'
export const RECOVERY_KEY = 'resume-cv-builder-draft-corrupt'

/** Moves an unparseable v2 payload to the recovery key instead of deleting it. */
function quarantine(raw: string): void {
  localStorage.setItem(RECOVERY_KEY, raw)
  localStorage.removeItem(STORAGE_KEY_V2)
}

export function loadFromStorage(): ResumeDocument | null {
  const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
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
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      const migrated = parseAndMigrate(JSON.parse(rawV1))
      if (migrated) {
        saveToStorage(migrated)
        localStorage.removeItem(STORAGE_KEY_V1)
        return migrated
      }
      localStorage.removeItem(STORAGE_KEY_V1)
    }
  } catch {
    return null
  }

  return null
}

export function saveToStorage(document: ResumeDocument): void {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(document))
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY_V2)
  localStorage.removeItem(STORAGE_KEY_V1)
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

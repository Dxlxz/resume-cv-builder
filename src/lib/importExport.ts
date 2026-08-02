import type { ResumeDocument } from '@rb/core/types/document'
import { MAX_IMPORT_BYTES } from '@/lib/utils'
import { parseAndMigrate } from '@rb/core/schema/migrate'

export interface ImportResult {
  success: true
  document: ResumeDocument
}

export interface ImportError {
  success: false
  message: string
}

export function exportDocumentJson(resume: ResumeDocument): void {
  const blob = new Blob([JSON.stringify(resume, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `resume-cv-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importDocumentJson(
  file: File,
): Promise<ImportResult | ImportError> {
  if (file.size > MAX_IMPORT_BYTES) {
    return {
      success: false,
      message: 'File is too large. Maximum size is 1 MB.',
    }
  }

  try {
    const text = await file.text()
    const json: unknown = JSON.parse(text)
    const document = parseAndMigrate(json)
    if (!document) {
      return {
        success: false,
        message:
          'Invalid file format. Please import a JSON backup from this app.',
      }
    }
    return { success: true, document }
  } catch {
    return {
      success: false,
      message: 'Could not read the file. Ensure it is valid JSON.',
    }
  }
}

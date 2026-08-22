import type { ResumeDocument } from '@rb/core/types/document'
import { MAX_IMPORT_BYTES } from '@/lib/utils'
import { parseAndMigrate } from '@rb/core/schema/migrate'
import { fromJsonResume, toJsonResume, type JsonResume } from '@rb/core/interop/jsonResume'
import { createEmptyDocument } from '@rb/presets/createDocument'

export interface ImportResult {
  success: true
  document: ResumeDocument
  /** Set when the file was a JSON Resume and some fields had no home here. */
  dropped?: string[]
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

function looksLikeJsonResume(json: unknown): json is JsonResume {
  if (typeof json !== 'object' || json === null) return false
  const candidate = json as Record<string, unknown>
  if (typeof candidate.$schema === 'string' && candidate.$schema.includes('resume-schema')) {
    return true
  }
  // `basics` is the standard's only near-universal key; a Rizzume backup has
  // `meta.schemaVersion` instead, so the two are unambiguous.
  return 'basics' in candidate && !('meta' in candidate && 'contact' in candidate)
}

/** Download the document in the JSON Resume standard rather than Rizzume's own. */
export function exportJsonResume(resume: ResumeDocument): void {
  const blob = new Blob([JSON.stringify(toJsonResume(resume), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `resume-${new Date().toISOString().slice(0, 10)}.json-resume.json`
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

    // One Import button accepts both formats: a Rizzume backup, or any file
    // following the JSON Resume standard.
    if (looksLikeJsonResume(json)) {
      const documentType = 'resume'
      const { document, dropped } = fromJsonResume(json, createEmptyDocument(documentType))
      return { success: true, document, dropped }
    }

    const document = parseAndMigrate(json)
    if (!document) {
      return {
        success: false,
        message:
          'Invalid file format. Import a backup from this app, or a JSON Resume file.',
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

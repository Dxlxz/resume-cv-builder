import type { ResumeDocument } from '@rb/core/types/document'
import { sanitizeFilename } from '@/lib/utils'

export function downloadPdf(blob: Blob, document: ResumeDocument): void {
  const name = sanitizeFilename(document.contact.fullName || 'document')
  const type = document.meta.documentType
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `${type}-${name}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}

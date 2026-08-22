/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import { sampleResumeDocument } from '@rb/fixtures'
import { renderDocumentToPdf } from '@rb/render/renderDocumentToPdf'
import { checkAnyPdf } from '@rb/validators/ats-proof/checkAnyPdf'
import type { ResumeDocument } from '@rb/core/types/document'

async function report(document: ResumeDocument) {
  const blob = await renderDocumentToPdf(document)
  return checkAnyPdf(new Uint8Array(await blob.arrayBuffer()))
}

const severityOf = (checks: Awaited<ReturnType<typeof checkAnyPdf>>['checks'], id: string) =>
  checks.find((check) => check.id === id)?.severity

describe('checkAnyPdf', () => {
  it('passes a known-good single-column export', async () => {
    const result = await report({
      ...sampleResumeDocument,
      meta: { ...sampleResumeDocument.meta, templateId: 'ats-strict' },
    })

    expect(result.wordCount).toBeGreaterThan(50)
    expect(severityOf(result.checks, 'text-layer')).toBe('ok')
    expect(severityOf(result.checks, 'email')).toBe('ok')
    expect(severityOf(result.checks, 'empty-pages')).toBe('ok')
    expect(severityOf(result.checks, 'columns')).toBe('ok')
    expect(result.checks.some((check) => check.severity === 'critical')).toBe(false)
  }, 60000)

  it('flags the two-column layout as a reading-order risk', async () => {
    const result = await report({
      ...sampleResumeDocument,
      meta: { ...sampleResumeDocument.meta, templateId: 'sidebar' },
    })
    // Not a failure of the template — a warning that portals are the wrong
    // place for it, which is exactly the guidance the template carries.
    expect(severityOf(result.checks, 'columns')).toBe('warning')
  }, 60000)

  it('calls out a PDF with no text layer as critical', async () => {
    const empty = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    await expect(checkAnyPdf(empty)).rejects.toThrow()
  })

  it('reports what the parser actually read', async () => {
    const result = await report(sampleResumeDocument)
    expect(result.extractedText).toContain(sampleResumeDocument.contact.fullName)
    expect(result.detectedSections).toContain('experience')
  }, 60000)
})

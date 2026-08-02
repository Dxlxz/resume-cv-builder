import { describe, expect, it } from 'vitest'
import {
  safeParseDocument,
  validateForExport,
} from '@rb/core/schema'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { sampleResume } from '@rb/fixtures'
import { MAX_IMPORT_BYTES } from '@/lib/utils'

describe('resumeDocumentSchema v3', () => {
  it('accepts a valid minimal document', () => {
    const doc = createEmptyDocument('resume')
    const result = safeParseDocument(doc)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.meta.schemaVersion).toBe(3)
    }
  })

  it('accepts sample resume data', () => {
    const result = safeParseDocument(sampleResume)
    expect(result.success).toBe(true)
  })

  it('rejects missing email on export validation', () => {
    const doc = createEmptyDocument('resume')
    const result = validateForExport(doc)
    expect(result.success).toBe(false)
  })

  it('rejects invalid JSON shape', () => {
    const result = safeParseDocument({ foo: 'bar' })
    expect(result.success).toBe(false)
  })

  it('defines import size limit of 1 MB', () => {
    expect(MAX_IMPORT_BYTES).toBe(1_000_000)
  })
})

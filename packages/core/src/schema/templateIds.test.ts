import { describe, expect, it } from 'vitest'
import { TEMPLATE_IDS } from '@rb/core/types/document'
import { documentMetaV3Schema } from './v3'
import { sampleResumeDocument } from '@rb/fixtures'

describe('template ids in saved drafts', () => {
  it.each(TEMPLATE_IDS)('a draft using %s still parses (AC-8)', (templateId) => {
    const meta = { ...sampleResumeDocument.meta, templateId }
    expect(documentMetaV3Schema.safeParse(meta).success).toBe(true)
  })

  it('rejects an id that is not a template', () => {
    const meta = { ...sampleResumeDocument.meta, templateId: 'nope' }
    expect(documentMetaV3Schema.safeParse(meta).success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { hasBlockingErrors, runValidation } from '@rb/validators/ats-lint'
import { sampleMalaysiaResume } from '@rb/fixtures'

describe('ats-lint', () => {
  it('blocks export without email', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    const issues = runValidation(doc)
    expect(hasBlockingErrors(issues)).toBe(true)
    expect(issues.some((i) => i.code === 'CONTACT_EMAIL_REQUIRED')).toBe(true)
  })

  it('passes contact validation for complete sample', () => {
    const issues = runValidation(sampleMalaysiaResume)
    expect(hasBlockingErrors(issues)).toBe(false)
  })

  it('warns on IC number in text', () => {
    const doc = {
      ...sampleMalaysiaResume,
      summary: 'IC: 900101-01-1234',
    }
    const issues = runValidation(doc)
    expect(issues.some((i) => i.code === 'IC_NUMBER_DETECTED')).toBe(true)
  })

  it('warns when portal-safe without ats-strict template', () => {
    const doc = {
      ...sampleMalaysiaResume,
      meta: {
        ...sampleMalaysiaResume.meta,
        templateId: 'classic' as const,
        exportProfile: 'portal-safe' as const,
      },
    }
    const issues = runValidation(doc)
    expect(issues.some((i) => i.code === 'ATS_TEMPLATE_RECOMMENDED')).toBe(true)
  })
})

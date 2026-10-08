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

  it('suggests ATS Strict as a tip when portal-safe uses another template', () => {
    const doc = {
      ...sampleMalaysiaResume,
      meta: {
        ...sampleMalaysiaResume.meta,
        templateId: 'classic' as const,
        exportProfile: 'portal-safe' as const,
      },
    }
    const issues = runValidation(doc)
    expect(issues.find((i) => i.code === 'ATS_TEMPLATE_RECOMMENDED')?.level).toBe('info')
  })

  it('raises an ATS risk for a role without a start date (AC-5)', () => {
    const [first, ...rest] = sampleMalaysiaResume.experience
    const doc = { ...sampleMalaysiaResume, experience: [{ ...first, startDate: '' }, ...rest] }
    const issue = runValidation(doc).find((i) => i.code === 'EXPERIENCE_DATES_MISSING')
    expect(issue?.level).toBe('warning')
    expect(runValidation(sampleMalaysiaResume).some((i) => i.code === 'EXPERIENCE_DATES_MISSING')).toBe(false)
  })

  it('raises at most one metrics tip for the whole document (AC-7)', () => {
    const doc = {
      ...sampleMalaysiaResume,
      experience: sampleMalaysiaResume.experience.map((role) => ({
        ...role,
        bullets: ['Led the team', 'Built the platform', 'Ran the reviews'],
      })),
    }
    const metric = runValidation(doc).filter((i) => i.code === 'BULLET_NO_METRIC')
    expect(metric).toHaveLength(1)
    expect(metric[0].level).toBe('info')
  })

  it('raises no empty-section, page-length or metric tip for a cover letter (AC-8)', () => {
    const doc = createEmptyDocument('cover-letter', 'malaysia-corporate')
    const codes = runValidation(doc).map((i) => i.code)
    expect(codes).not.toContain('EMPTY_SECTION')
    expect(codes).not.toContain('PAGE_LENGTH_RESUME')
    expect(codes).not.toContain('BULLET_NO_METRIC')
  })
})
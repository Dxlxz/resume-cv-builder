import { describe, expect, it } from 'vitest'
import { isSectionFilled } from '@/lib/sectionStatus'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { sampleResumeDocument } from '@rb/fixtures'

describe('isSectionFilled', () => {
  it('empty sections are not filled', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    expect(isSectionFilled(doc, 'summary')).toBe(false)
    expect(isSectionFilled(doc, 'experience')).toBe(false)
    expect(isSectionFilled(doc, 'skills')).toBe(false)
    expect(isSectionFilled(doc, 'references')).toBe(false)
  })

  it('a typed name fills contact', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    doc.contact.fullName = 'Jordan'
    expect(isSectionFilled(doc, 'contact')).toBe(true)
  })

  it('a role with any content fills experience', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    doc.experience = [{ id: 'x', title: '', company: '', bullets: ['Built things'] } as never]
    expect(isSectionFilled(doc, 'experience')).toBe(true)
  })

  it('the sample document fills the main sections', () => {
    expect(isSectionFilled(sampleResumeDocument, 'summary')).toBe(true)
    expect(isSectionFilled(sampleResumeDocument, 'experience')).toBe(true)
    expect(isSectionFilled(sampleResumeDocument, 'education')).toBe(true)
    expect(isSectionFilled(sampleResumeDocument, 'skills')).toBe(true)
    expect(isSectionFilled(sampleResumeDocument, 'projects')).toBe(true)
    expect(isSectionFilled(sampleResumeDocument, 'volunteer')).toBe(true)
  })
})

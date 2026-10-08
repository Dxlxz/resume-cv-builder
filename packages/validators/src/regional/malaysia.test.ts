import { describe, expect, it } from 'vitest'
import { sampleMalaysiaResume } from '@rb/fixtures'
import { runMalaysiaRegionalRules } from '@rb/validators/regional/malaysia'

const withSummary = (summary: string) => runMalaysiaRegionalRules({ ...sampleMalaysiaResume, summary })

describe('Malaysia personal details (F-007 AC-6)', () => {
  it.each([
    ['Marital status: Single', 'marital status'],
    ['Religion: Islam', 'religion'],
    ['Date of Birth: 1 Jan 1998', 'date of birth'],
    ['Age : 27', 'age'],
    ['Tarikh lahir - 1/1/1998', 'date of birth'],
    ['Date of Birth 12/03/1995', 'date of birth'],
    ['Bangsa: Melayu', 'race'],
  ])('raises an ATS risk for "%s"', (summary, label) => {
    const issue = withSummary(summary).find((i) => i.code === 'PERSONAL_DETAILS')
    expect(issue?.level).toBe('warning')
    expect(issue?.message).toContain(label)
  })

  it.each([
    'Built a single-page app for page 12 of the usage report.',
    'Average age of the fleet dropped by 20%.',
    'Managed race-day logistics for 3 events.',
    'Dragon Boat Race – Champion, 2023',
  ])('ignores ordinary words: "%s"', (summary) => {
    expect(withSummary(summary).some((i) => i.code === 'PERSONAL_DETAILS')).toBe(false)
  })
})

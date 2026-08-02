import { describe, expect, it } from 'vitest'
import {
  buildImproveBulletsMessages,
  buildImproveSummaryMessages,
  buildTailorToJobMessages,
  parseTailorResult,
} from '@/lib/ai/prompts'

const role = { title: 'Software Engineer', company: 'MapWorks', bullets: ['Built APIs', 'Cut manual work'] }

describe('prompt builders', () => {
  it('builds improve-summary messages with the writing rules', () => {
    const messages = buildImproveSummaryMessages({
      summary: 'A developer.',
      experience: [role],
      documentType: 'resume',
      presetName: 'Malaysia Corporate',
    })
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('British English')
    expect(messages[0].content).toContain('Never use em dashes or en dashes')
    expect(messages[0].content).toContain('Never invent facts')
    expect(messages[1].content).toContain('A developer.')
    expect(messages[1].content).toContain('MapWorks')
    expect(messages[1].content).toContain('Document type: Resume')
    expect(messages[1].content).toContain('Malaysia Corporate')
  })

  it('asks for a longer summary for a CV', () => {
    const messages = buildImproveSummaryMessages({
      summary: '',
      experience: [],
      documentType: 'cv',
      presetName: '',
    })
    expect(messages[1].content).toContain('4 to 6 sentences')
    expect(messages[1].content).toContain('Document type: CV')
  })

  it('builds improve-bullets messages from a role', () => {
    const messages = buildImproveBulletsMessages(role)
    expect(messages[1].content).toContain('Software Engineer, MapWorks')
    expect(messages[1].content).toContain('- Built APIs')
    expect(messages[1].content).toContain('one per line')
  })

  it('builds tailor-to-job messages with the required structure', () => {
    const messages = buildTailorToJobMessages({
      jobDescription: 'Need a React engineer for geospatial work.',
      summary: 'A developer.',
      skills: ['React', 'GIS'],
      experience: [role],
      documentType: 'resume',
    })
    const user = messages[1].content
    expect(user).toContain('Need a React engineer for geospatial work.')
    expect(user).toContain('React')
    expect(user).toContain('TAILORED SUMMARY')
    expect(user).toContain('MISSING KEYWORDS')
    expect(user).toContain('BULLET SUGGESTIONS')
  })
})

describe('parseTailorResult', () => {
  const wellFormed = `TAILORED SUMMARY
A geospatial engineer with React skills.

MISSING KEYWORDS
GIS, React, PostgreSQL

BULLET SUGGESTIONS
Software Engineer: Built the map layer pipeline.
Software Engineer: Cut manual data entry by 40 percent.`

  it('splits well-formed output into sections', () => {
    const parsed = parseTailorResult(wellFormed)
    expect(parsed.tailoredSummary).toBe('A geospatial engineer with React skills.')
    expect(parsed.missingKeywords).toEqual(['GIS', 'React', 'PostgreSQL'])
    expect(parsed.bulletSuggestions).toContain('Software Engineer: Built the map layer pipeline.')
  })

  it('falls back to the raw text when headers are missing', () => {
    const parsed = parseTailorResult('just some text')
    expect(parsed.tailoredSummary).toBe('just some text')
    expect(parsed.missingKeywords).toEqual([])
    expect(parsed.bulletSuggestions).toBe('')
  })
})

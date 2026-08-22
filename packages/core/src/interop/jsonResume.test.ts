import { describe, expect, it } from 'vitest'
import { sampleResumeDocument } from '@rb/fixtures'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { fromJsonResume, toJsonResume, type JsonResume } from '@rb/core/interop/jsonResume'
import { safeParseV3 } from '@rb/core/schema/v3'

describe('JSON Resume interop', () => {
  it('round-trips everything the mapping claims to preserve', () => {
    const original = sampleResumeDocument
    const { document: back } = fromJsonResume(
      toJsonResume(original),
      createEmptyDocument('resume'),
    )

    expect(back.contact.fullName).toBe(original.contact.fullName)
    expect(back.contact.email).toBe(original.contact.email)
    expect(back.contact.headline).toBe(original.contact.headline)
    expect(back.summary).toBe(original.summary)

    expect(back.experience).toHaveLength(original.experience.length)
    original.experience.forEach((role, i) => {
      expect(back.experience[i].title).toBe(role.title)
      expect(back.experience[i].company).toBe(role.company)
      expect(back.experience[i].bullets).toEqual(role.bullets)
      expect(back.experience[i].present).toBe(role.present)
    })

    expect(back.education.map((e) => e.institution)).toEqual(
      original.education.map((e) => e.institution),
    )
    expect(back.skills.map((s) => s.items)).toEqual(original.skills.map((s) => s.items))
    expect(back.certifications.map((c) => c.name)).toEqual(
      original.certifications.map((c) => c.name),
    )
    expect(back.projects.map((p) => p.name)).toEqual(original.projects.map((p) => p.name))
  })

  it('carries Rizzume meta through its own export', () => {
    const { document: back } = fromJsonResume(
      toJsonResume(sampleResumeDocument),
      createEmptyDocument('resume'),
    )
    expect(back.meta.templateId).toBe(sampleResumeDocument.meta.templateId)
    expect(back.meta.themeId).toBe(sampleResumeDocument.meta.themeId)
    expect(back.meta.presetId).toBe(sampleResumeDocument.meta.presetId)
  })

  it('produces a document the v3 schema accepts', () => {
    const { document } = fromJsonResume(
      toJsonResume(sampleResumeDocument),
      createEmptyDocument('resume'),
    )
    expect(safeParseV3(document).success).toBe(true)
  })

  it('imports a foreign file and keeps the app’s own meta', () => {
    const foreign: JsonResume = {
      basics: {
        name: 'Ada Lovelace',
        label: 'Analyst',
        email: 'ada@example.com',
        location: { city: 'London', region: 'England', countryCode: 'GB' },
        profiles: [
          { network: 'LinkedIn', url: 'https://linkedin.com/in/ada' },
          { network: 'Mastodon', url: 'https://example.social/@ada' },
        ],
      },
      work: [
        {
          name: 'Analytical Engine Co',
          position: 'Mathematician',
          startDate: '1842-07',
          highlights: ['Wrote the first algorithm.'],
        },
      ],
      languages: [{ language: 'English', fluency: 'Native' }],
      awards: [{ title: 'Posthumous recognition' }] as never,
    }

    const base = createEmptyDocument('resume', 'malaysia-corporate')
    const { document, dropped } = fromJsonResume(foreign, base)

    expect(document.contact.fullName).toBe('Ada Lovelace')
    expect(document.contact.location).toBe('London, England')
    expect(document.contact.linkedIn).toBe('https://linkedin.com/in/ada')
    // No end date in the source means the role is current.
    expect(document.experience[0].present).toBe(true)
    expect(document.experience[0].startDate).toBe('1842-07')
    // Languages have no Rizzume section, so they land as a skill group.
    expect(document.skills.at(-1)?.name).toBe('Languages')
    expect(document.skills.at(-1)?.items).toEqual(['English — Native'])
    // A foreign file carries no Rizzume meta, so the app's choice stands.
    expect(document.meta.presetId).toBe('malaysia-corporate')

    expect(dropped).toContain('awards')
    expect(dropped).toContain('basics.location.countryCode')
    expect(dropped.some((d) => d.startsWith('basics.profiles'))).toBe(true)
  })

  it('normalises the date formats the standard allows', () => {
    const { document } = fromJsonResume(
      {
        work: [
          { name: 'A', position: 'x', startDate: '2020', endDate: '2021-03-15' },
        ],
      },
      createEmptyDocument('resume'),
    )
    expect(document.experience[0].startDate).toBe('2020')
    expect(document.experience[0].endDate).toBe('2021-03')
  })

  it('survives an empty document without throwing', () => {
    const { document } = fromJsonResume({}, createEmptyDocument('resume'))
    expect(document.contact.fullName).toBe('')
    expect(document.experience).toEqual([])
    expect(safeParseV3(document).success).toBe(true)
  })
})

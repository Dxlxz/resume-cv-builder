import { describe, expect, it } from 'vitest'
import type { ResumeDocumentV1, SectionId } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { migrateV1ToV2, parseAndMigrate } from '@rb/core/schema/migrate'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { sampleResume } from '@rb/fixtures'

describe('migrateV1ToV2', () => {
  it('migrates v1 empty resume to v2 with international preset', () => {
    const v1: ResumeDocumentV1 = {
      meta: {
        schemaVersion: 1,
        documentType: 'resume',
        templateId: 'classic',
        sectionOrder: [...ALL_SECTIONS] as SectionId[],
        hiddenSections: [],
        pageSize: 'letter',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      contact: { fullName: 'Test', email: 't/e.com' },
      summary: '',
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      projects: [],
      volunteer: [],
      references: [],
    }
    const v2 = migrateV1ToV2(v1)
    expect(v2.meta.schemaVersion).toBe(2)
    expect(v2.meta.presetId).toBe('international-generic')
    expect(v2.contact.fullName).toBe('Test')
  })

  it('parseAndMigrate accepts v2 document', () => {
    const doc = createEmptyDocument('resume')
    expect(parseAndMigrate(doc)?.meta.schemaVersion).toBe(2)
  })

  it('parseAndMigrate preserves v2 sample content', () => {
    const result = parseAndMigrate(sampleResume)
    expect(result?.contact.fullName).toBe('Alex Morgan')
    expect(result?.meta.presetId).toBe('international-generic')
  })
})

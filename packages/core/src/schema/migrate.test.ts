import { describe, expect, it } from 'vitest'
import type { ResumeDocumentV1, SectionId } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { migrateV1ToV3, parseAndMigrate } from '@rb/core/schema/migrate'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { sampleResume } from '@rb/fixtures'

describe('migrateV1ToV3', () => {
  it('migrates v1 empty resume to v3 with international preset', () => {
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
    const v3 = migrateV1ToV3(v1)
    expect(v3.meta.schemaVersion).toBe(3)
    expect(v3.meta.presetId).toBe('international-generic')
    expect(v3.meta.sectionGuides).toEqual({})
    expect(v3.contact.fullName).toBe('Test')
  })

  it('parseAndMigrate accepts a v3 document', () => {
    const doc = createEmptyDocument('resume')
    expect(parseAndMigrate(doc)?.meta.schemaVersion).toBe(3)
  })

  it('parseAndMigrate upgrades a v2 document to v3 with empty guides', () => {
    const doc = createEmptyDocument('resume')
    const v2 = { ...doc, meta: { ...doc.meta, schemaVersion: 2 } }
    const migrated = parseAndMigrate(v2)
    expect(migrated?.meta.schemaVersion).toBe(3)
    expect(migrated?.meta.sectionGuides).toEqual({})
  })

  it('parseAndMigrate preserves v3 section guides', () => {
    const doc = createEmptyDocument('resume')
    const guided = {
      ...doc,
      meta: {
        ...doc.meta,
        sectionGuides: { summary: '  British English, lead with impact.  ', skills: '' },
      },
    }
    const migrated = parseAndMigrate(guided)
    expect(migrated?.meta.sectionGuides).toEqual({
      summary: 'British English, lead with impact.',
    })
  })

  it('parseAndMigrate preserves sample content', () => {
    const result = parseAndMigrate(sampleResume)
    expect(result?.contact.fullName).toBe('Alex Morgan')
    expect(result?.meta.presetId).toBe('international-generic')
    expect(result?.meta.schemaVersion).toBe(3)
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import type { ResumeDocumentV1, SectionId } from '@rb/core/types/document'
import { parseAndMigrate } from '@rb/core/schema/migrate'
import { sampleResume } from '@rb/fixtures'
import {
  clearStorage,
  loadFromStorage,
  RECOVERY_KEY,
  saveToStorage,
} from '@/lib/persistence'

const STORAGE_KEY_V2 = 'resume-cv-builder-draft-v2'
const STORAGE_KEY_V1 = 'resume-cv-builder-draft-v1'

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads a normalized v2 draft through parseAndMigrate, matching file-import normalization', () => {
    const raw = {
      ...sampleResume,
      certifications: undefined,
      volunteer: undefined,
      references: undefined,
      meta: {
        ...sampleResume.meta,
        sectionOrder: ['contact', 'summary'] as SectionId[],
      },
    }
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(raw))

    const fromStorage = loadFromStorage()
    const fromImport = parseAndMigrate(raw)

    expect(fromStorage).not.toBeNull()
    expect(fromStorage).toEqual(fromImport)
    expect(fromStorage?.meta.sectionOrder).toContain('experience')
    expect(fromStorage?.certifications).toEqual([])
    expect(fromStorage?.volunteer).toEqual([])
    expect(fromStorage?.references).toEqual([])
  })

  it('quarantines a corrupt v2 draft instead of deleting it', () => {
    const corrupt = '{"meta":{"schemaVersion":2,"documentType":"bogus"}}'
    localStorage.setItem(STORAGE_KEY_V2, corrupt)

    const result = loadFromStorage()

    expect(result).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY_V2)).toBeNull()
    expect(localStorage.getItem(RECOVERY_KEY)).toBe(corrupt)
  })

  it('quarantines invalid JSON in the v2 slot', () => {
    const corrupt = 'not json{'
    localStorage.setItem(STORAGE_KEY_V2, corrupt)

    const result = loadFromStorage()

    expect(result).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY_V2)).toBeNull()
    expect(localStorage.getItem(RECOVERY_KEY)).toBe(corrupt)
  })

  it('migrates a v1 draft to v2, persists it, and removes the v1 key', () => {
    const v1: ResumeDocumentV1 = {
      meta: {
        schemaVersion: 1,
        documentType: 'resume',
        templateId: 'classic',
        sectionOrder: ['contact', 'summary', 'experience', 'education', 'skills', 'projects'],
        hiddenSections: [],
        pageSize: 'letter',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      contact: { fullName: 'Test User', email: 't/e.com' },
      summary: '',
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      projects: [],
      volunteer: [],
      references: [],
    }
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1))

    const result = loadFromStorage()

    expect(result?.meta.schemaVersion).toBe(2)
    expect(result?.meta.presetId).toBe('international-generic')
    expect(localStorage.getItem(STORAGE_KEY_V1)).toBeNull()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_V2) ?? 'null')).toEqual(result)
  })

  it('clearStorage removes draft v1, v2, and recovery keys', () => {
    saveToStorage(sampleResume)
    localStorage.setItem(STORAGE_KEY_V1, '{}')
    localStorage.setItem(RECOVERY_KEY, 'corrupt')

    clearStorage()

    expect(localStorage.getItem(STORAGE_KEY_V2)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY_V1)).toBeNull()
    expect(localStorage.getItem(RECOVERY_KEY)).toBeNull()
  })
})

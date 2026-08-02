import { describe, expect, it, beforeEach } from 'vitest'
import { clearCatalogOverrides } from '@rb/catalog/persistence'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { runCatalogRules } from '@rb/catalog/lint/catalog-lint'
import { sampleMalaysiaResume } from '@rb/fixtures'

describe('catalog-lint', () => {
  beforeEach(() => {
    clearCatalogOverrides()
    useCatalogStore.getState().init('malaysia-default')
  })

  it('flags duplicate case skills', () => {
    const doc = {
      ...sampleMalaysiaResume,
      skills: [
        {
          id: 'g1',
          name: 'Tools',
          items: ['Python', 'python'],
        },
      ],
    }
    const issues = runCatalogRules(doc)
    expect(issues.some((i) => i.code === 'CATALOG_DUPLICATE_CASE')).toBe(true)
  })

  it('suggests near match for typos', () => {
    const doc = {
      ...sampleMalaysiaResume,
      skills: [
        {
          id: 'g1',
          name: 'Tools',
          items: ['Pythn'],
        },
      ],
    }
    const issues = runCatalogRules(doc)
    expect(issues.some((i) => i.code === 'CATALOG_NEAR_MATCH')).toBe(true)
  })

  it('flags very short unknown occupation titles', () => {
    const doc = {
      ...sampleMalaysiaResume,
      experience: [
        {
          ...sampleMalaysiaResume.experience[0],
          title: 'VP',
        },
      ],
    }
    const issues = runCatalogRules(doc)
    expect(issues.some((i) => i.code === 'CATALOG_UNKNOWN_OCCUPATION')).toBe(true)
  })
})

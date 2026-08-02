import { describe, expect, it } from 'vitest'
import { runCatalogRules } from '@rb/catalog/lint/catalog-lint'
import { sampleMalaysiaResume } from '@rb/fixtures'

describe('catalog-lint', () => {
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
})

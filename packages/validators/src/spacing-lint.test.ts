import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { runSpacingRules } from '@rb/validators/spacing-lint'

describe('spacing-lint', () => {
  it('passes cleanly for the curated personal resume', () => {
    const issues = runSpacingRules(sampleProfileDocument)
    expect(issues.filter((i) => i.level === 'warning')).toHaveLength(0)
  })

  it('warns when an item exceeds the preset bullet cap', () => {
    const doc = {
      ...sampleProfileDocument,
      experience: [
        {
          ...sampleProfileDocument.experience[0],
          bullets: ['a', 'b', 'c', 'd', 'e'],
        },
      ],
    }
    const issues = runSpacingRules(doc)
    expect(issues.some((i) => i.code === 'BULLETS_HIDDEN_BY_PRESET')).toBe(true)
  })

  it('emits PAGE_1_DEAD_ZONE when plan shows low page-1 fill', () => {
    const issues = runSpacingRules(sampleProfileDocument, {
      layout: { blocks: [], templateId: 'ats-strict', contentWidthPt: 500, contentHeightPt: 700 },
      measured: { blocks: [], totalHeightPt: 0, contentWidthPt: 500 },
      plan: {
        pageCount: 2,
        contentWidthPt: 500,
        contentHeightPt: 700,
        fillRatio: [0.6, 0.9],
        breaks: [],
        slices: [],
      },
      blockHints: {},
    })
    expect(issues.some((i) => i.code === 'PAGE_1_DEAD_ZONE')).toBe(true)
  })
})

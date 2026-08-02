import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { runLayoutRules } from '@rb/validators/layout-lint'

describe('layout-lint', () => {
  it('returns no issues when plan is missing', () => {
    expect(runLayoutRules(sampleProfileDocument, null)).toEqual([])
  })

  it('evaluates dead-zone and width drift from a real plan', async () => {
    const plan = await computeLayoutPlan(sampleProfileDocument)
    const issues = runLayoutRules(sampleProfileDocument, plan)
    const codes = issues.map((i) => i.code)
    expect(codes.every((c) => c.startsWith('LAYOUT_'))).toBe(true)
  })
})

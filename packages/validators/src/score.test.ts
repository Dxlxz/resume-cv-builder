import { describe, expect, it } from 'vitest'
import { summarizeChecks } from '@rb/validators/score'
import type { LintIssue } from '@rb/validators/types'

const issue = (level: LintIssue['level'], code = 'TEST'): LintIssue => ({ level, code, message: 'test' })
const many = (level: LintIssue['level'], count: number) => Array.from({ length: count }, () => issue(level))

describe('summarizeChecks (F-007 AC-2)', () => {
  it('is ready with no issues', () => {
    expect(summarizeChecks([])).toMatchObject({ status: 'ready', label: 'ATS ready', errors: 0, risks: 0, tips: 0 })
  })

  it('stays ready however many tips there are', () => {
    const summary = summarizeChecks(many('info', 25))
    expect(summary.status).toBe('ready')
    expect(summary.tips).toBe(25)
  })

  it('reports risks when there is a warning', () => {
    expect(summarizeChecks([issue('warning'), ...many('info', 3)])).toMatchObject({ status: 'risks', risks: 1, tips: 3 })
  })

  it('is blocked by an error, whatever else is present', () => {
    expect(summarizeChecks([issue('error'), issue('warning'), issue('info')])).toMatchObject({
      status: 'blocked',
      label: 'Fix before export',
      errors: 1,
    })
  })
})

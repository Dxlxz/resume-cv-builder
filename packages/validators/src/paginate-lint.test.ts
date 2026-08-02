import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { paginateDriftIssue, runPaginateRules } from '@rb/validators/paginate-lint'

describe('paginate-lint', () => {
  it('warns on page count drift', () => {
    const issue = paginateDriftIssue(2, 4)
    expect(issue?.code).toBe('PAGINATION_PAGE_COUNT_DRIFT')
  })

  it('allows matching page counts', () => {
    expect(paginateDriftIssue(2, 2)).toBeNull()
  })

  it('flags overflow risk for long resumes', () => {
    const issues = runPaginateRules(sampleProfileDocument, 3)
    expect(issues.some((i) => i.code === 'PAGINATION_OVERFLOW_RISK')).toBe(true)
  })
})

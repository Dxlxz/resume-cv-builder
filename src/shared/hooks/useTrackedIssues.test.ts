import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { LintIssue } from '@rb/validators/types'
import { trackIssues, useTrackedIssues } from './useTrackedIssues'

const name: LintIssue = { level: 'error', code: 'CONTACT_NAME_REQUIRED', message: 'Full name is required', field: 'fullName', section: 'contact' }
const email: LintIssue = { level: 'error', code: 'CONTACT_EMAIL_REQUIRED', message: 'Email is required', field: 'email', section: 'contact' }

describe('trackIssues', () => {
  it('reports a fixed issue as resolved after open ones (AC-10)', () => {
    const first = trackIssues(new Map(), [name, email])
    expect(first.items.map((i) => i.resolved)).toEqual([false, false])
    const second = trackIssues(first.seen, [email])
    expect(second.items.map((i) => [i.issue.field, i.resolved])).toEqual([
      ['email', false],
      ['fullName', true],
    ])
  })

  it('reopens an issue that comes back', () => {
    const first = trackIssues(new Map(), [name])
    const gone = trackIssues(first.seen, [])
    const back = trackIssues(gone.seen, [name])
    expect(back.items).toEqual([{ issue: name, resolved: false }])
  })
})

describe('issue identity', () => {
  it('keeps a field issue the same when its wording changes (review N2)', () => {
    const reworded: LintIssue = { ...email, message: 'Enter a valid email address' }
    const first = trackIssues(new Map(), [email])
    const second = trackIssues(first.seen, [reworded])
    expect(second.items).toEqual([{ issue: reworded, resolved: false }])
  })
})

describe('issue identity for messages with numbers', () => {
  it('treats a changed percentage as the same issue (review N2)', () => {
    const a: LintIssue = { level: 'warning', code: 'LAST_PAGE_SPARSE', message: 'Last page is only 42% full' }
    const b: LintIssue = { ...a, message: 'Last page is only 45% full' }
    const first = trackIssues(new Map(), [a])
    expect(trackIssues(first.seen, [b]).items).toEqual([{ issue: b, resolved: false }])
  })
})

describe('useTrackedIssues', () => {
  it('keeps a fixed issue listed with a resolved flag (AC-10)', () => {
    const { result, rerender } = renderHook(({ issues }) => useTrackedIssues(issues), { initialProps: { issues: [name, email] } })
    expect(result.current.every((i) => !i.resolved)).toBe(true)
    rerender({ issues: [email] })
    expect(result.current.find((i) => i.issue.field === 'fullName')?.resolved).toBe(true)
    expect(result.current.find((i) => i.issue.field === 'email')?.resolved).toBe(false)
  })
})

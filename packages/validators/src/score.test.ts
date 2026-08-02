import { describe, expect, it } from 'vitest'
import { scoreDocument } from '@rb/validators/score'
import type { LintIssue } from '@rb/validators/types'

const issue = (level: LintIssue['level'], code = 'TEST'): LintIssue => ({
  level,
  code,
  message: 'test',
})

describe('scoreDocument', () => {
  it('scores a clean document 100', () => {
    const r = scoreDocument([])
    expect(r.score).toBe(100)
    expect(r.band).toBe('excellent')
    expect(r.bandLabel).toBe('Ready to export')
  })

  it('applies flat weighted penalties', () => {
    const r = scoreDocument([issue('error'), issue('warning'), issue('info')])
    expect(r.score).toBe(100 - 14 - 7 - 2)
    expect(r.errors).toBe(1)
    expect(r.warnings).toBe(1)
    expect(r.infos).toBe(1)
  })

  it('clamps to zero and never below', () => {
    const many: LintIssue[] = []
    for (let i = 0; i < 10; i++) many.push(issue('error'))
    expect(scoreDocument(many).score).toBe(0)
  })

  it('caps at 100 for negative input', () => {
    expect(scoreDocument([]).score).toBe(100)
  })

  it('assigns bands at boundaries', () => {
    const withCounts = (errors: number, warnings: number, infos: number): LintIssue[] => [
      ...Array.from({ length: errors }, () => issue('error')),
      ...Array.from({ length: warnings }, () => issue('warning')),
      ...Array.from({ length: infos }, () => issue('info')),
    ]
    expect(scoreDocument(withCounts(0, 0, 5)).band).toBe('excellent') // 90
    expect(scoreDocument(withCounts(0, 1, 2)).band).toBe('good') // 89
    expect(scoreDocument(withCounts(1, 1, 2)).band).toBe('good') // 75
    expect(scoreDocument(withCounts(1, 0, 6)).band).toBe('fair') // 74
    expect(scoreDocument(withCounts(2, 0, 6)).band).toBe('fair') // 60
    expect(scoreDocument(withCounts(2, 1, 3)).band).toBe('poor') // 59
  })
})

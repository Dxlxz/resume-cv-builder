import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { resolveDocumentStyles } from '@rb/styles/shared'
import {
  runTypographyRules,
  typographyIssuesFromResolved,
} from '@rb/validators/typography-lint'

describe('typography-lint', () => {
  it('passes for personal Malaysia profile', () => {
    const issues = runTypographyRules(sampleProfileDocument)
    expect(issues.some((i) => i.code === 'TYPE_SIZE_TOO_SMALL')).toBe(false)
    expect(issues.some((i) => i.code === 'TYPE_LOW_CONTRAST')).toBe(false)
    expect(issues.some((i) => i.code === 'TYPE_TOO_MANY_FAMILIES')).toBe(false)
  })

  it('warns when body size is below 10pt', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    const issues = typographyIssuesFromResolved({
      ...resolved,
      typography: { ...resolved.typography, bodySize: 9 },
    })
    expect(issues.some((i) => i.code === 'TYPE_SIZE_TOO_SMALL')).toBe(true)
  })

  it('info on tight line height', () => {
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    const issues = typographyIssuesFromResolved({
      ...resolved,
      typography: { ...resolved.typography, lineHeight: 1.1 },
    })
    expect(issues.some((i) => i.code === 'TYPE_LINE_HEIGHT_TIGHT')).toBe(true)
  })
})

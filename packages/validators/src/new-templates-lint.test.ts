import { describe, expect, it } from 'vitest'
import { sampleCvDocument, sampleResumeDocument } from '@rb/fixtures'
import { themeForDocument } from '@rb/themes/registry'
import { runValidation } from './ats-lint'

describe.each(['ivy', 'compact', 'split', 'executive', 'harbor', 'slate', 'minimal'] as const)('%s template lints', (templateId) => {
  it.each([
    ['resume', sampleResumeDocument],
    ['cv', sampleCvDocument],
  ] as const)('raises no blocking error on the sample %s', (_label, base) => {
    const document = {
      ...base,
      meta: { ...base.meta, templateId, themeId: themeForDocument(templateId, base.meta.documentType, base.meta.themeId) },
    }
    const issues = runValidation(document)
    expect(issues.filter((issue) => issue.level === 'error')).toEqual([])
    // Contrast, type size, line height and font-family count are decided by the template and theme, so they must hold.
    expect(issues.filter((issue) => issue.code.startsWith('TYPE_'))).toEqual([])
  })
})

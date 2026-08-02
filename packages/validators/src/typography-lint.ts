import type { ResumeDocument } from '@rb/core/types/document'
import { meetsContrastAA } from '@rb/styles/shared/contrast'
import { resolveDocumentStyles } from '@rb/styles/shared/resolveDocumentStyles'
import type { ResolvedStyles } from '@rb/styles/shared/types'
import type { LintIssue } from '@rb/validators/types'

export function typographyIssuesFromResolved(resolved: ResolvedStyles): LintIssue[] {
  const { typography, theme } = resolved
  const issues: LintIssue[] = []

  if (typography.bodySize < 10) {
    issues.push({
      level: 'warning',
      code: 'TYPE_SIZE_TOO_SMALL',
      message: `Body text is ${typography.bodySize}pt. Use at least 10pt for ATS compatibility.`,
    })
  }

  if (typography.lineHeight < 1.2) {
    issues.push({
      level: 'info',
      code: 'TYPE_LINE_HEIGHT_TIGHT',
      message: 'Line height may reduce readability. Consider 1.3 or higher.',
    })
  }

  if (!meetsContrastAA(theme.colors.accent, theme.colors.paper)) {
    issues.push({
      level: 'warning',
      code: 'TYPE_LOW_CONTRAST',
      message: 'Accent color contrast against white is below WCAG AA (4.5:1).',
    })
  }

  const toGroup = (value: string) => {
    const lower = value.toLowerCase()
    if (lower.includes('times') || lower.includes('georgia') || lower.includes('serif')) {
      return 'serif'
    }
    if (
      lower.includes('helvetica') ||
      lower.includes('arial') ||
      lower.includes('sans') ||
      lower.includes('calibri') ||
      lower.includes('carlito')
    ) {
      return 'sans'
    }
    return value
  }

  const familyGroups = new Set(
    [
      theme.fonts.previewBody,
      theme.fonts.previewHeading,
      theme.fonts.pdfBody,
      theme.fonts.pdfHeading,
    ].map(toGroup),
  )
  if (familyGroups.size > 2) {
    issues.push({
      level: 'warning',
      code: 'TYPE_TOO_MANY_FAMILIES',
      message: 'Multiple font families detected. Use one body + one heading family.',
    })
  }

  return issues
}

export function runTypographyRules(document: ResumeDocument): LintIssue[] {
  return typographyIssuesFromResolved(resolveDocumentStyles(document))
}

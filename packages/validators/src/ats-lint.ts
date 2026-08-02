import type { ResumeDocument } from '@rb/core/types/document'
import { SECTION_LABELS } from '@rb/core/types/document'
import { validateForExport } from '@rb/core/schema/v3'
import { getPreset } from '@rb/presets/registry'
import { getTheme } from '@rb/themes/registry'
import type { ValidatorId } from '@rb/presets/types'
import type { LayoutPlanResult } from '@rb/layout/types'
import type { LintIssue } from '@rb/validators/types'
import { runMalaysiaRegionalRules } from '@rb/validators/regional/malaysia'
import { runTypographyRules } from '@rb/validators/typography-lint'
import { runCatalogRules } from '@rb/catalog/lint/catalog-lint'
import { runPaginateRules } from '@rb/validators/paginate-lint'
import { runSpacingRules } from '@rb/validators/spacing-lint'
import { runLayoutRules } from '@rb/validators/layout-lint'

export function runValidation(
  document: ResumeDocument,
  layoutPlan: LayoutPlanResult | null = null,
  previewPageCount = 0,
): LintIssue[] {
  const preset = getPreset(document.meta.presetId)
  const theme = getTheme(document.meta.themeId)
  const issues: LintIssue[] = []

  const contactResult = validateForExport(document)
  if (!contactResult.success) {
    for (const issue of contactResult.error.issues) {
      const field = String(issue.path[0] ?? 'contact')
      issues.push({
        level: 'error',
        code: field === 'fullName' ? 'CONTACT_NAME_REQUIRED' : 'CONTACT_EMAIL_REQUIRED',
        message: issue.message,
        field,
        section: 'contact',
      })
    }
  }

  if (
    document.meta.exportProfile === 'portal-safe' &&
    document.meta.templateId !== 'ats-strict'
  ) {
    issues.push({
      level: 'warning',
      code: 'ATS_TEMPLATE_RECOMMENDED',
      message: 'Portal-safe profile works best with the ATS Strict template.',
    })
  }

  if (!theme.atsSafe) {
    issues.push({
      level: 'warning',
      code: 'THEME_NOT_ATS_SAFE',
      message: 'Current theme may not be fully ATS-compatible.',
    })
  }

  if (document.meta.documentType === 'resume' && document.experience.length > 4) {
    issues.push({
      level: 'info',
      code: 'PAGE_LENGTH_RESUME',
      message: 'Resume has many roles — consider trimming to 1–2 pages for corporate applications.',
    })
  }

  for (const item of document.experience) {
    for (const bullet of item.bullets) {
      if (bullet.trim() && !/\d/.test(bullet)) {
        issues.push({
          level: 'info',
          code: 'BULLET_NO_METRIC',
          message: `Consider adding a metric to: "${bullet.slice(0, 50)}…"`,
          section: 'experience',
        })
        break
      }
    }
  }

  const standardLabels = new Set(Object.values(SECTION_LABELS))
  for (const [sectionId, label] of Object.entries(preset.labels)) {
    if (label && !standardLabels.has(label as (typeof SECTION_LABELS)[keyof typeof SECTION_LABELS])) {
      // preset uses ATS labels — ok
      void sectionId
    }
  }

  if (preset.validators.includes('malaysia-regional')) {
    issues.push(...runMalaysiaRegionalRules(document))
  }

  issues.push(...runTypographyRules(document))
  issues.push(...runCatalogRules(document))
  issues.push(...runPaginateRules(document, previewPageCount))
  issues.push(...runSpacingRules(document, layoutPlan))
  issues.push(...runLayoutRules(document, layoutPlan))

  return issues
}

export function hasBlockingErrors(issues: LintIssue[]): boolean {
  return issues.some((i) => i.level === 'error')
}

export function runValidationByIds(
  document: ResumeDocument,
  validatorIds: ValidatorId[],
): LintIssue[] {
  const all = runValidation(document)
  if (validatorIds.includes('ats') && validatorIds.includes('malaysia-regional')) {
    return all
  }
  return all.filter((issue) => {
    if (issue.code.startsWith('IC_') || issue.code === 'LOCATION_EMPTY') {
      return validatorIds.includes('malaysia-regional')
    }
    return validatorIds.includes('ats')
  })
}

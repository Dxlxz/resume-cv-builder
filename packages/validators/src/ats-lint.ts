import type { ResumeDocument } from '@rb/core/types/document'
import { validateForExport } from '@rb/core/schema/v3'
import { getVisibleSections } from '@rb/core/selectors/getVisibleSections'
import { getPreset } from '@rb/presets/registry'
import { getTheme } from '@rb/themes/registry'
import type { ValidatorId } from '@rb/presets/types'
import type { LayoutPlanResult } from '@rb/layout/types'
import type { LintIssue } from '@rb/validators/types'
import { runMalaysiaRegionalRules } from '@rb/validators/regional/malaysia'
import { runTypographyRules } from '@rb/validators/typography-lint'
import { runCatalogRules } from '@rb/validators/catalog-lint'
import { runPaginateRules } from '@rb/validators/paginate-lint'
import { runSpacingRules } from '@rb/validators/spacing-lint'
import { runLengthRules } from '@rb/validators/length-lint'

/**
 * Levels mean one thing each (F-007): `error` blocks export (name, email); `warning` is an ATS risk, something that
 * stops a parser or a recruiter's search from finding content; `info` is a polish tip. Style, length and layout are
 * tips, because no ATS rejects a resume for them.
 */
export function runValidation(
  document: ResumeDocument,
  layoutPlan: LayoutPlanResult | null = null,
  previewPageCount = 0,
): LintIssue[] {
  const preset = getPreset(document.meta.presetId)
  const theme = getTheme(document.meta.themeId)
  const issues: LintIssue[] = []
  const isLetter = document.meta.documentType === 'cover-letter'

  const contactResult = validateForExport(document)
  if (!contactResult.success) {
    const reported = new Set<string>()
    for (const issue of contactResult.error.issues) {
      const field = String(issue.path[0] ?? 'contact')
      // One message per field: an empty email is "required", not also "not valid".
      if (reported.has(field)) continue
      reported.add(field)
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
      level: 'info',
      code: 'ATS_TEMPLATE_RECOMMENDED',
      message: 'Portal-safe profile works best with the ATS Strict template.',
    })
  }

  if (!theme.atsSafe) {
    issues.push({
      level: 'info',
      code: 'THEME_NOT_ATS_SAFE',
      message: 'Current theme may not be fully ATS-compatible.',
    })
  }

  if (!isLetter) {
    issues.push(...runContentRules(document))
  }

  if (preset.validators.includes('malaysia-regional')) {
    issues.push(...runMalaysiaRegionalRules(document))
  }

  issues.push(...runTypographyRules(document))
  issues.push(...runCatalogRules(document))
  issues.push(...runPaginateRules(document, previewPageCount))
  issues.push(...runSpacingRules(document, layoutPlan))
  issues.push(...runLengthRules(document, layoutPlan, previewPageCount))

  return issues
}

/** Share of experience bullets with a number in them below which one metrics tip is shown for the whole document. */
export const METRIC_SHARE_TIP = 0.5

function runContentRules(document: ResumeDocument): LintIssue[] {
  const issues: LintIssue[] = []

  if (document.meta.documentType === 'resume' && document.experience.length > 4) {
    issues.push({
      level: 'info',
      code: 'PAGE_LENGTH_RESUME',
      message: 'Many roles listed. Keep the older ones to a line each if the resume runs long.',
    })
  }

  // Parsers place a job on a timeline from its dates; a role without them is the case they flag.
  const experienceVisible = getVisibleSections(document).includes('experience')
  for (const [index, item] of experienceVisible ? document.experience.entries() : []) {
    if (!item.startDate?.trim()) {
      issues.push({
        level: 'warning',
        code: 'EXPERIENCE_DATES_MISSING',
        message: `"${item.title || `Role ${index + 1}`}" has no start date. ATS parsers place jobs on a timeline from their dates.`,
        field: `experience.${index}.startDate`,
        section: 'experience',
      })
    }
  }

  const bullets = document.experience.flatMap((item) => item.bullets).filter((b) => b.trim())
  const withNumber = bullets.filter((b) => /\d/.test(b)).length
  if (bullets.length >= 3 && withNumber / bullets.length < METRIC_SHARE_TIP) {
    issues.push({
      level: 'info',
      code: 'BULLET_NO_METRIC',
      message: `${withNumber} of ${bullets.length} experience bullets have a number. Where you can, add a result (%, RM, time saved, users).`,
      section: 'experience',
    })
  }

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
    if (issue.code.startsWith('IC_') || issue.code === 'LOCATION_EMPTY' || issue.code === 'PERSONAL_DETAILS') {
      return validatorIds.includes('malaysia-regional')
    }
    return validatorIds.includes('ats')
  })
}

import type { ResumeDocument } from '@rb/core/types/document'
import type { LayoutPlanResult } from '@rb/layout/types'
import { resolveDocumentStyles } from '@rb/styles/shared'
import type { LintIssue } from '@rb/validators/types'

const SKILLS_LINE_MAX = 120
/** Page 1 fill below this triggers PAGE_1_DEAD_ZONE ( >15% unused vertical space ). */
const PAGE_1_FILL_INFO = 0.85

export function runSpacingRules(
  document: ResumeDocument,
  layoutPlan: LayoutPlanResult | null = null,
): LintIssue[] {
  const issues: LintIssue[] = []
  const { layout } = resolveDocumentStyles(document)

  if (layout.pageMarginPt < 36) {
    issues.push({
      level: 'warning',
      code: 'SPACE_MARGIN_TIGHT',
      message: `Page margins (${layout.pageMarginPt}pt) are below the recommended 36pt minimum.`,
    })
  }

  if (layout.bulletGapPt < 3) {
    issues.push({
      level: 'warning',
      code: 'SPACE_BULLETS_CRAMPED',
      message: `Bullet spacing (${layout.bulletGapPt}pt) is tight — use at least 3pt for readability.`,
    })
  }

  if (layout.sectionTitleGapPt < 6) {
    issues.push({
      level: 'warning',
      code: 'SPACE_HEADING_CRAMPED',
      message: `Heading-to-body gap (${layout.sectionTitleGapPt}pt) is tight — use at least 6pt.`,
    })
  }

  const cap = layout.maxBulletsPerItem
  if (cap) {
    const overCap: string[] = []
    for (const item of [...document.experience, ...document.volunteer]) {
      if (item.bullets.filter(Boolean).length > cap) overCap.push(item.title || 'Untitled role')
    }
    for (const project of document.projects) {
      if (project.bullets.filter(Boolean).length > cap) overCap.push(project.name || 'Untitled project')
    }
    if (overCap.length > 0) {
      issues.push({
        level: 'warning',
        code: 'BULLETS_HIDDEN_BY_PRESET',
        message: `This preset renders at most ${cap} bullets per item — extra bullets are hidden for: ${overCap.join(', ')}. Edit each item to keep its strongest ${cap}.`,
        section: 'experience',
      })
    }
  }

  for (const group of document.skills) {
    const line = `${group.name ? `${group.name}: ` : ''}${group.items.filter(Boolean).join(', ')}`
    if (line.length > SKILLS_LINE_MAX) {
      issues.push({
        level: 'info',
        code: 'SKILLS_LINE_LONG',
        message: `Skill group "${group.name || 'Untitled'}" is ${line.length} characters — consider splitting or trimming.`,
        section: 'skills',
      })
      break
    }
  }

  if (layoutPlan && layoutPlan.plan.pageCount > 1) {
    const page1Fill = layoutPlan.plan.fillRatio[0] ?? 1
    if (page1Fill < PAGE_1_FILL_INFO) {
      const unusedPct = Math.round((1 - page1Fill) * 100)
      issues.push({
        level: 'info',
        code: 'PAGE_1_DEAD_ZONE',
        message: `Page 1 has ~${unusedPct}% unused vertical space — consider trimming skills or allowing more breaks.`,
      })
    }
  }

  return issues
}

import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { LayoutPlanResult } from '@rb/layout/types'
import type { LintIssue } from '@rb/validators/types'

/**
 * Length and balance rules driven by the measured layout plan: sections
 * that dominate a page, items that split across pages, a nearly empty last
 * page, empty sections, and plan-vs-preview page drift. Skipped when no
 * layout plan is available.
 */

const SECTION_TOO_LONG_RATIO = 0.45
const LAST_PAGE_SPARSE_RATIO = 0.25
const DRIFT_TOLERANCE = 1

const ITEM_ID_PREFIX = /^(experience|education|project|volunteer|reference)-/

export function runLengthRules(
  document: ResumeDocument,
  layoutPlan: LayoutPlanResult | null,
  previewPageCount = 0,
): LintIssue[] {
  const issues: LintIssue[] = []

  if (layoutPlan) {
    const { measured, plan } = layoutPlan
    const pageHeightPt = plan.contentHeightPt

  // --- Per-section share of a page -------------------------------------
  const sectionHeights = new Map<SectionId, number>()
  for (const block of measured.blocks) {
    sectionHeights.set(
      block.sectionId,
      (sectionHeights.get(block.sectionId) ?? 0) + block.bbox.height,
    )
  }
  for (const [sectionId, height] of sectionHeights) {
    const share = height / pageHeightPt
    if (share > SECTION_TOO_LONG_RATIO) {
      issues.push({
        level: 'warning',
        code: 'SECTION_TOO_LONG',
        message: `${getSectionLabel(sectionId, {})} takes about ${Math.round(share * 100)}% of a page - trim it or split the content.`,
        section: sectionId,
      })
    }
  }

  // --- Items spanning more than one page --------------------------------
  const blocksById = new Map(measured.blocks.map((block) => [block.id, block]))
  const itemPages = new Map<string, { pages: Set<number>; title: string }>()
  for (const slice of plan.slices) {
    const block = blocksById.get(slice.blockId)
    if (!block || !ITEM_ID_PREFIX.test(slice.blockId)) continue
    const base = slice.blockId.replace(/-b\d+$/, '')
    const entry = itemPages.get(base) ?? { pages: new Set<number>(), title: '' }
    entry.pages.add(slice.pageIndex)
    if (!entry.title && block.type !== 'referenceItem') {
      entry.title = String((block.content as { title?: string }).title ?? '')
    }
    itemPages.set(base, entry)
  }
  for (const [base, { pages, title }] of itemPages) {
    if (pages.size > 1) {
      issues.push({
        level: 'warning',
        code: 'ITEM_SPANS_PAGES',
        message: title
          ? `"${title}" splits across ${pages.size} pages - shorten it or trim the bullets.`
          : `An entry splits across ${pages.size} pages - shorten it or trim the bullets.`,
        section: blocksById.get(base)?.sectionId ?? 'experience',
      })
    }
  }

  // --- Nearly empty last page -------------------------------------------
  if (plan.pageCount > 1) {
    const lastFill = plan.fillRatio[plan.pageCount - 1] ?? 0
    if (lastFill < LAST_PAGE_SPARSE_RATIO) {
      issues.push({
        level: 'info',
        code: 'LAST_PAGE_SPARSE',
        message: `Last page is only ${Math.round(lastFill * 100)}% full - tighten the content to fit ${plan.pageCount - 1} page${plan.pageCount - 1 === 1 ? '' : 's'}, or hide a section.`,
      })
    }
  }

  // --- Plan vs preview page drift ---------------------------------------
  if (previewPageCount > 0 && Math.abs(plan.pageCount - previewPageCount) > DRIFT_TOLERANCE) {
    issues.push({
      level: 'info',
      code: 'PLAN_PREVIEW_DRIFT',
      message: `Layout plan expects ${plan.pageCount} page${plan.pageCount === 1 ? '' : 's'}; the preview shows ${previewPageCount}. The PDF engine may place content slightly differently.`,
    })
  }
  }

  // --- Empty sections (no layout needed) ---------------------------------
  if (!document.summary.trim()) {
    issues.push({
      level: 'info',
      code: 'EMPTY_SECTION',
      message: 'No summary yet - add 2-4 sentences on your focus and what you are looking for.',
      section: 'summary',
    })
  }
  if (document.experience.length === 0) {
    issues.push({
      level: 'info',
      code: 'EMPTY_SECTION',
      message: 'No work experience yet - add your current or most recent role.',
      section: 'experience',
    })
  }
  if (document.skills.length === 0) {
    issues.push({
      level: 'info',
      code: 'EMPTY_SECTION',
      message: 'No skills yet - group your skills by category.',
      section: 'skills',
    })
  }

  return issues
}

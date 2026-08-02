import { describe, expect, it } from 'vitest'
import { runLengthRules } from '@rb/validators/length-lint'
import { createEmptyDocument } from '@rb/presets/createDocument'
import type { LayoutPlanResult, MeasuredBlock } from '@rb/layout/types'

function block(
  id: string,
  sectionId: MeasuredBlock['sectionId'],
  height: number,
  type: MeasuredBlock['type'] = 'paragraph',
  title = '',
): MeasuredBlock {
  return {
    id,
    sectionId,
    type,
    breakPolicy: 'auto',
    spacingBeforePt: 0,
    spacingAfterPt: 0,
    content: { kind: 'paragraph', text: id, ...(title ? { title } : {}) } as never,
    bbox: { x: 0, y: 0, width: 500, height },
  }
}

function planWith(blocks: MeasuredBlock[], opts: Partial<LayoutPlanResult['plan']> = {}): LayoutPlanResult {
  return {
    layout: { templateId: 'ats-strict', blocks: [], contentWidthPt: 500, contentHeightPt: 700 },
    measured: {
      blocks,
      totalHeightPt: blocks.reduce((sum, b) => sum + b.bbox.height, 0),
      contentWidthPt: 500,
    },
    plan: {
      pageCount: 1,
      contentHeightPt: 700,
      contentWidthPt: 500,
      slices: [],
      breaks: [],
      fillRatio: [1],
      ...opts,
    },
    blockHints: {},
  }
}

describe('runLengthRules', () => {
  it('flags a section that dominates the page', () => {
    const plan = planWith([block('summary-body', 'summary', 400)])
    const issues = runLengthRules(createEmptyDocument('resume'), plan)
    expect(issues.some((i) => i.code === 'SECTION_TOO_LONG' && i.section === 'summary')).toBe(true)
  })

  it('does not flag compact sections', () => {
    const plan = planWith([block('summary-body', 'summary', 100)])
    expect(runLengthRules(createEmptyDocument('resume'), plan).some((i) => i.code === 'SECTION_TOO_LONG')).toBe(false)
  })

  it('flags an item that spans pages', () => {
    const plan = planWith(
      [
        block('experience-x', 'experience', 300, 'itemHeader', 'Software Engineer'),
        block('experience-x-b0', 'experience', 300, 'bullet'),
      ],
      {
        pageCount: 2,
        slices: [
          { pageIndex: 0, blockId: 'experience-x', yPt: 0 },
          { pageIndex: 1, blockId: 'experience-x-b0', yPt: 0 },
        ],
        fillRatio: [1, 0.6],
      },
    )
    const issues = runLengthRules(createEmptyDocument('resume'), plan)
    const spans = issues.find((i) => i.code === 'ITEM_SPANS_PAGES')
    expect(spans).toBeDefined()
    expect(spans?.message).toContain('Software Engineer')
  })

  it('flags a nearly empty last page', () => {
    const plan = planWith([block('a', 'summary', 400)], {
      pageCount: 2,
      slices: [{ pageIndex: 0, blockId: 'a', yPt: 0 }],
      fillRatio: [1, 0.1],
    })
    expect(runLengthRules(createEmptyDocument('resume'), plan).some((i) => i.code === 'LAST_PAGE_SPARSE')).toBe(true)
  })

  it('flags plan-vs-preview drift', () => {
    const plan = planWith([])
    const issues = runLengthRules(createEmptyDocument('resume'), plan, 3)
    expect(issues.some((i) => i.code === 'PLAN_PREVIEW_DRIFT')).toBe(true)
  })

  it('flags empty sections without a layout plan', () => {
    const issues = runLengthRules(createEmptyDocument('resume'), null)
    expect(issues.filter((i) => i.code === 'EMPTY_SECTION').map((i) => i.section)).toEqual([
      'summary',
      'experience',
      'skills',
    ])
  })

  it('returns nothing for a clean measured document', () => {
    const plan = planWith([
      block('summary-body', 'summary', 100),
      block('experience-x', 'experience', 100, 'experienceItem', 'Engineer'),
    ])
    const issues = runLengthRules(createEmptyDocument('resume'), plan, 1)
    expect(issues.filter((i) => !['EMPTY_SECTION'].includes(i.code))).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT } from '@rb/themes/types'
import type { LayoutProfile } from '@rb/themes/types'
import {
  accentBarHeightPt,
  bulletIndentPt,
  headerBandPaddingPt,
  railOffsetPt,
  skillColumnWidth,
  skillGridGutterPt,
  skillGridRowGapPt,
  usesAccentBar,
  usesInlineRule,
  usesRail,
  usesSkillGrid,
} from '@rb/render/blocks/blockVariants'

function layoutWith(overrides: Partial<LayoutProfile>): LayoutProfile {
  return { ...DEFAULT_LAYOUT, ...overrides }
}

describe('blockVariants', () => {
  it('costs the text column nothing when entries are stacked', () => {
    const layout = layoutWith({ entryStyle: 'stacked' })
    expect(railOffsetPt(layout)).toBe(0)
    expect(bulletIndentPt(layout)).toBe(0)
  })

  it('derives the rail offset from the profile, not a constant', () => {
    const layout = layoutWith({ entryStyle: 'rail', railWidthPt: 80, railGutterPt: 14 })
    expect(railOffsetPt(layout)).toBe(94)
    // Fragmented bullets must clear the gutter or they sit under the dates.
    expect(bulletIndentPt(layout)).toBe(94)
  })

  it('splits the skills grid by the configured column count', () => {
    expect(skillColumnWidth(layoutWith({ skillGridColumns: 2 }))).toBe('50%')
    expect(skillColumnWidth(layoutWith({ skillGridColumns: 4 }))).toBe('25%')
    // Guards against a divide-by-zero producing an Infinity width.
    expect(skillColumnWidth(layoutWith({ skillGridColumns: 0 }))).toBe('100%')
  })

  it('scales grid spacing off bulletGapPt', () => {
    const layout = layoutWith({ bulletGapPt: 6, skillGridGutterScale: 2, skillGridRowGapScale: 0.5 })
    expect(skillGridGutterPt(layout)).toBe(12)
    expect(skillGridRowGapPt(layout)).toBe(3)
  })

  it('scales band padding off headerRulePaddingPt', () => {
    expect(headerBandPaddingPt(layoutWith({ headerRulePaddingPt: 9, headerBandPaddingScale: 2 }))).toBe(18)
    expect(headerBandPaddingPt(layoutWith({ headerRulePaddingPt: 9, headerBandPaddingScale: 3 }))).toBe(27)
  })

  it('scales the accent bar off the section size', () => {
    expect(accentBarHeightPt(layoutWith({ accentBarHeightRatio: 0.95 }), 10)).toBeCloseTo(9.5)
    expect(accentBarHeightPt(layoutWith({ accentBarHeightRatio: 1.2 }), 10)).toBeCloseTo(12)
  })

  it('selects variants from the profile discriminators', () => {
    expect(usesRail(layoutWith({ entryStyle: 'rail' }))).toBe(true)
    expect(usesSkillGrid(layoutWith({ skillsStyle: 'grid' }))).toBe(true)
    expect(usesAccentBar(layoutWith({ sectionTitleDecoration: 'accent-bar' }))).toBe(true)
    expect(usesInlineRule(layoutWith({ sectionTitleDecoration: 'rule-inline' }))).toBe(true)
    expect(usesAccentBar(layoutWith({ sectionTitleDecoration: 'rule' }))).toBe(false)
  })
})

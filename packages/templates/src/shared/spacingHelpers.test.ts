import { describe, expect, it } from 'vitest'
import { DEFAULT_LAYOUT, DEFAULT_TYPOGRAPHY } from '@rb/themes/types'
import {
  minPresenceForSection,
  shouldKeepItemTogether,
} from '@rb/templates/shared/spacingHelpers'

describe('spacingHelpers', () => {
  it('minPresenceForSection scales with line height', () => {
    const value = minPresenceForSection(DEFAULT_TYPOGRAPHY, DEFAULT_LAYOUT)
    const bodyLine = DEFAULT_TYPOGRAPHY.bodySize * DEFAULT_TYPOGRAPHY.lineHeight
    const titleLine = DEFAULT_TYPOGRAPHY.sectionSize * DEFAULT_TYPOGRAPHY.lineHeight
    expect(value).toBe(
      Math.round(
        DEFAULT_LAYOUT.sectionTitleGapPt +
          titleLine +
          bodyLine * 3 +
          DEFAULT_LAYOUT.itemSubtitleGapPt,
      ),
    )
  })

  it('allows tall experience blocks to break across pages', () => {
    const contentHeight = 700
    expect(shouldKeepItemTogether(2, DEFAULT_TYPOGRAPHY, DEFAULT_LAYOUT, contentHeight)).toBe(true)
    expect(shouldKeepItemTogether(25, DEFAULT_TYPOGRAPHY, DEFAULT_LAYOUT, contentHeight)).toBe(false)
  })
})

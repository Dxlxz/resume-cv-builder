import { describe, expect, it } from 'vitest'
import {
  PRESET_IDS,
  TEMPLATE_IDS,
  THEME_IDS,
  type PresetId,
  type TemplateId,
  type ThemeId,
} from '@rb/core/types/document'
import { PRESETS } from '@rb/presets/registry'
import { TEMPLATE_LAYOUTS } from '@rb/templates/shared/layoutProfiles'
import { THEMES } from '@rb/themes/registry'

/**
 * Compile-time only: a `Record<Id, ...>` argument fails to typecheck if it is
 * missing an entry for any id in the declared union, so a vocabulary id added
 * to `core/types/document.ts` without a matching registry entry breaks the build.
 */
function assertCoversAllIds<Id extends string>(record: Record<Id, unknown>): void {
  void record
}

describe('vocabulary registries are exhaustive', () => {
  it('cover every declared preset, template, and theme id', () => {
    assertCoversAllIds<PresetId>(PRESETS)
    assertCoversAllIds<TemplateId>(TEMPLATE_LAYOUTS)
    assertCoversAllIds<ThemeId>(THEMES)

    expect(Object.keys(PRESETS).sort()).toEqual([...PRESET_IDS].sort())
    expect(Object.keys(TEMPLATE_LAYOUTS).sort()).toEqual([...TEMPLATE_IDS].sort())
    expect(Object.keys(THEMES).sort()).toEqual([...THEME_IDS].sort())
  })
})

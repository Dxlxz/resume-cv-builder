import { describe, expect, it } from 'vitest'
import { TEMPLATE_IDS } from '@rb/core/types/document'
import { TEMPLATE_LAYOUTS } from '@rb/styles/shared/layoutProfiles'
import { TEMPLATES, TEMPLATE_LIST } from './registry'

describe('template registry', () => {
  it('has a registry entry and a layout profile for every template id', () => {
    for (const id of TEMPLATE_IDS) {
      expect(TEMPLATES[id]?.id).toBe(id)
      expect(TEMPLATE_LAYOUTS[id]?.id).toBe(id)
    }
    expect(TEMPLATE_LIST).toHaveLength(TEMPLATE_IDS.length)
  })

  it('declares two columns exactly where the layout profile uses two', () => {
    for (const id of TEMPLATE_IDS) {
      expect(TEMPLATES[id].columns).toBe(TEMPLATE_LAYOUTS[id].layout?.columns ?? 1)
    }
  })

  it('includes the three templates added with the gallery', () => {
    expect(TEMPLATE_IDS).toEqual(expect.arrayContaining(['ivy', 'compact', 'split', 'executive', 'harbor', 'slate', 'minimal']))
  })
})

import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { getPreset } from '@rb/presets/registry'

describe('malaysia-corporate preset', () => {
  it('sets ATS-strict defaults', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    expect(doc.meta.presetId).toBe('malaysia-corporate')
    expect(doc.meta.templateId).toBe('ats-strict')
    expect(doc.meta.pageSize).toBe('a4')
    expect(doc.meta.exportProfile).toBe('portal-safe')
    expect(doc.meta.locale).toBe('en-MY')
  })

  it('has ATS section labels', () => {
    const preset = getPreset('malaysia-corporate')
    expect(preset.labels.experience).toBe('Work Experience')
    expect(preset.labels.summary).toBe('Professional Summary')
  })
})

import { describe, expect, it } from 'vitest'
import { bundleIdForPreset } from '@rb/catalog/bundleForPreset'

describe('bundleIdForPreset', () => {
  it('maps malaysia preset to malaysia-default', () => {
    expect(bundleIdForPreset('malaysia-corporate')).toBe('malaysia-default')
  })

  it('maps international preset to international-default', () => {
    expect(bundleIdForPreset('international-generic')).toBe('international-default')
  })
})

import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { getPageSpec } from '@rb/styles/shared/pageSpec'

describe('getPageSpec', () => {
  it('returns A4 dimensions for Malaysia profile', () => {
    const spec = getPageSpec(sampleProfileDocument)
    expect(spec.pageSize).toBe('a4')
    expect(spec.widthMm).toBe(210)
    expect(spec.heightMm).toBe(297)
    expect(spec.marginPt).toBe(40)
    expect(spec.contentHeightPt).toBeGreaterThan(700)
  })

  it('returns letter dimensions when page size is letter', () => {
    const spec = getPageSpec({
      ...sampleProfileDocument,
      meta: { ...sampleProfileDocument.meta, pageSize: 'letter' },
    })
    expect(spec.pageSize).toBe('letter')
    expect(spec.pageHeightCss).toBe('11in')
  })
})

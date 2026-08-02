import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { blockWrapperStylePt } from '@rb/render/blocks/blockSpacing'

describe('layout blocks', () => {
  it('assigns section gaps via spacingBeforePt only (not CSS marginTop)', () => {
    const layout = compileLayout(sampleProfileDocument)
    const firstTitle = layout.blocks.find((b) => b.id === 'summary-title')
    const secondTitle = layout.blocks.find((b) => b.id === 'experience-title')

    expect(firstTitle?.spacingBeforePt).toBeGreaterThanOrEqual(10)
    expect(secondTitle?.spacingBeforePt).toBeGreaterThanOrEqual(12)
    expect(blockWrapperStylePt(firstTitle!).marginTop).toBe(firstTitle!.spacingBeforePt)
  })

  it('compiles the same block ids used by measure and PDF walkers', () => {
    const layout = compileLayout(sampleProfileDocument)
    const ids = layout.blocks.map((b) => b.id)

    expect(ids[0]).toBe('header')
    expect(ids).toContain('summary-title')
    expect(ids).toContain('summary-body')
    expect(ids.some((id) => id.startsWith('experience-') && id !== 'experience-title')).toBe(true)
  })
})

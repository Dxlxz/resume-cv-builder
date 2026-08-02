import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { layoutOverlayRects } from '@rb/layout/debug/drawLayoutOverlay'
import { resolveDocumentStyles } from '@rb/styles'

describe('drawLayoutOverlay', () => {
  it('returns page-relative rects aligned to slices', async () => {
    const plan = await computeLayoutPlan(sampleProfileDocument)
    const resolved = resolveDocumentStyles(sampleProfileDocument)
    const pageWidth = 600
    const rects = layoutOverlayRects(plan, 0, pageWidth, resolved.layout.pageMarginPt)

    expect(rects.length).toBeGreaterThan(0)
    for (const rect of rects) {
      expect(rect.blockId).toBeTruthy()
      expect(rect.width).toBeGreaterThan(0)
      expect(rect.y).toBeGreaterThanOrEqual(0)
    }
  })
})

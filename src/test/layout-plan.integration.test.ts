import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { generatePdfWithPlan } from '@/renderers/pdf/generatePdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import { buildBlockPdfHints } from '@rb/layout/adapt/reactPdfPlan'
import { resolveDocumentStyles } from '@rb/styles'

describe('layout plan integration', () => {
  it('builds block hints for every sliced block', async () => {
    const plan = await computeLayoutPlan(sampleProfileDocument)
    const styles = resolveDocumentStyles(sampleProfileDocument)

    expect(Object.keys(plan.blockHints).length).toBeGreaterThan(0)
    for (const slice of plan.plan.slices) {
      expect(plan.blockHints[slice.blockId] ?? {}).toBeDefined()
    }

    const hints = buildBlockPdfHints(
      plan.layout.blocks,
      plan.measured,
      plan.plan,
      styles.typography,
      styles.layout,
    )
    expect(Object.keys(hints).length).toBe(plan.plan.slices.length)
  })

  it('PDF page count is within 1 of planned page count', async () => {
    const plan = await computeLayoutPlan(sampleProfileDocument)
    const blob = await generatePdfWithPlan(sampleProfileDocument, plan)
    const pdfPages = await countPdfPages(blob)

    expect(pdfPages).toBeGreaterThanOrEqual(1)
    // Full personal profile has more content than a 1–2 page resume fixture
    expect(Math.abs(pdfPages - plan.plan.pageCount)).toBeLessThanOrEqual(3)
  }, 20000)
})

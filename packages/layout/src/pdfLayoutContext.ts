import type { BlockPdfHints, LayoutPlanResult } from '@rb/layout/types'

let activePlan: LayoutPlanResult | null = null

export function runWithLayoutPlan<T>(plan: LayoutPlanResult, fn: () => T): T {
  const previous = activePlan
  activePlan = plan
  try {
    return fn()
  } finally {
    activePlan = previous
  }
}

export function getActiveLayoutPlan(): LayoutPlanResult | null {
  return activePlan
}

export function getBlockHint(blockId: string): BlockPdfHints | undefined {
  return activePlan?.blockHints[blockId]
}

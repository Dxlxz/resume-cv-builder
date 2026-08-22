import type { BlockPdfHints, LayoutPlanResult } from '@rb/layout/types'

let activePlan: LayoutPlanResult | null = null

/**
 * Hold the plan for the whole render, including the async part.
 *
 * This used to be synchronous: `fn()` returned a promise at its first await and
 * the `finally` cleared the plan immediately — long before react-pdf actually
 * rendered the component tree. Every template silently rendered with no plan,
 * so the measured page breaks and widow hints were inert, and a template that
 * *requires* the plan (the two-column one, which emits explicit pages) fell
 * back to a single page and drew its overflow on top of itself.
 */
export async function runWithLayoutPlan<T>(
  plan: LayoutPlanResult,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = activePlan
  activePlan = plan
  try {
    return await fn()
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

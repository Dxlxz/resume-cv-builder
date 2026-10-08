import { useState } from 'react'
import type { LintIssue } from '@rb/validators/types'

export interface TrackedIssue {
  issue: LintIssue
  /** True once the issue was seen and has since gone away. */
  resolved: boolean
}

/**
 * Identity of an issue across re-runs. An issue about a field keeps its identity when its wording changes (for example
 * "required" becoming "enter a valid email"); one with no field also uses its message, with numbers blanked ("only 42% full" becomes "only 45% full"), so distinct findings stay apart.
 */
export const issueKey = (issue: LintIssue) =>
  [issue.code, issue.field ?? '', issue.section ?? '', issue.field ? '' : issue.message.replace(/\d+(\.\d+)?/g, '#')].join('|')

/**
 * Pure core of the tracker: adds new issues to what was seen and reports each seen issue as open or resolved.
 * Open issues come first, in their current order; resolved ones follow in the order they were first seen.
 */
export function trackIssues(
  seen: ReadonlyMap<string, LintIssue>,
  current: LintIssue[],
): { seen: Map<string, LintIssue>; items: TrackedIssue[]; changed: boolean } {
  const next = new Map(seen)
  let changed = false
  const open = new Set<string>()
  for (const issue of current) {
    const key = issueKey(issue)
    open.add(key)
    if (!next.has(key)) {
      next.set(key, issue)
      changed = true
    }
  }
  const items: TrackedIssue[] = current.map((issue) => ({ issue, resolved: false }))
  for (const [key, issue] of next) {
    if (!open.has(key)) items.push({ issue, resolved: true })
  }
  return { seen: next, items, changed }
}

/**
 * Keeps issues that were fixed visible, with a tick, instead of letting them vanish. Used by the fix list and the ATS
 * panel so a user sees progress, not just a shrinking list. The record lives as long as the component that calls it.
 */
export function useTrackedIssues(current: LintIssue[]): TrackedIssue[] {
  const [seen, setSeen] = useState<Map<string, LintIssue>>(() => new Map())
  const result = trackIssues(seen, current)
  // Adjusting state during render, guarded so it settles after one pass (react.dev: "adjusting state on a prop change").
  if (result.changed) setSeen(result.seen)
  return result.items
}

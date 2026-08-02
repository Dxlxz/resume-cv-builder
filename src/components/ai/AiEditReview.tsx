import { useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { ResumeDocument } from '@rb/core/types/document'
import type { AiEditPlan } from '@/lib/ai/edits'
import { Button } from '@/components/ui/Button'

/**
 * Review panel for an Idrizz edit plan: changes grouped by section, each
 * with its own Apply/Discard, plus Apply all. Nothing is applied until the
 * user clicks. Every apply reports what changed and the pre-apply document
 * snapshot so the chat can offer Undo. Plans with no real effects show a
 * "Nothing to review" card instead of silently rendering nothing.
 */

export type PlanKey = keyof AiEditPlan

const GROUP_ORDER: PlanKey[] = [
  'summary',
  'experience',
  'education',
  'certifications',
  'skills',
  'projects',
  'volunteer',
  'references',
  'sections',
]

const GROUP_LABELS: Record<PlanKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  skills: 'Skills',
  projects: 'Projects',
  volunteer: 'Volunteer',
  references: 'References',
  sections: 'Sections',
}

function truncate(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text
}

function describePlan(key: PlanKey, plan: AiEditPlan, document: ReturnType<typeof useDocumentStore.getState>['document']): string[] {
  const lines: string[] = []

  if (key === 'summary' && plan.summary !== undefined) {
    lines.push(`New summary: ${truncate(plan.summary)}`)
    return lines
  }

  if (key === 'sections' && plan.sections) {
    plan.sections.hide?.forEach((s) => lines.push(`Hide ${getSectionLabel(s, {})}`))
    plan.sections.show?.forEach((s) => lines.push(`Show ${getSectionLabel(s, {})}`))
    return lines
  }

  const ops = plan[key] as
    | { add?: unknown[]; edit?: { id: string; patch: Record<string, unknown> }[]; remove?: string[] }
    | undefined
  if (!ops) return lines

  const labelOf = (id: string): string => {
    if (key === 'experience') return document?.experience.find((e) => e.id === id)?.title ?? 'a role'
    if (key === 'education') return document?.education.find((e) => e.id === id)?.institution ?? 'an entry'
    if (key === 'certifications') return document?.certifications.find((e) => e.id === id)?.name ?? 'an entry'
    if (key === 'skills') return document?.skills.find((e) => e.id === id)?.name ?? 'a group'
    if (key === 'projects') return document?.projects.find((e) => e.id === id)?.name ?? 'a project'
    if (key === 'volunteer') return document?.volunteer.find((e) => e.id === id)?.title ?? 'an entry'
    if (key === 'references') return document?.references.find((e) => e.id === id)?.name ?? 'a reference'
    return 'an entry'
  }

  if (ops.add?.length) {
    for (const draft of ops.add as Record<string, unknown>[]) {
      const name = (draft.title ?? draft.name ?? draft.institution ?? 'New entry') as string
      lines.push(`Add: ${name}`)
    }
  }
  if (ops.edit?.length) {
    for (const edit of ops.edit) {
      const fields = Object.keys(edit.patch).join(', ')
      lines.push(`Edit ${labelOf(edit.id)}: ${fields || 'details'}`)
    }
  }
  if (ops.remove?.length) {
    for (const id of ops.remove) {
      lines.push(`Remove: ${labelOf(id)}`)
    }
  }

  return lines
}

export interface AiAppliedInfo {
  /** Which group was applied ('all' for Apply all). */
  key: PlanKey | 'all'
  /** Human summary of what was applied. */
  summary: string
  /** Document snapshot taken before this apply (first apply of the plan). */
  snapshot: ResumeDocument | null
}

interface AiEditReviewProps {
  plan: AiEditPlan
  /** Discards the whole suggestion. */
  onDiscard: () => void
  /** Called after any successful apply. */
  onApplied: (info: AiAppliedInfo) => void
}

export function AiEditReview({ plan, onDiscard, onApplied }: AiEditReviewProps) {
  const document = useDocumentStore((s) => s.document)
  const applyAiEditPlan = useDocumentStore((s) => s.applyAiEditPlan)
  const [dismissed, setDismissed] = useState<Set<PlanKey>>(new Set())

  const groups = GROUP_ORDER.filter(
    (key) => plan[key] !== undefined && !dismissed.has(key),
  )

  if (groups.length === 0) {
    return (
      <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        No changes left to review.
      </p>
    )
  }

  const applyGroup = (key: PlanKey) => {
    const partial = { [key]: plan[key] } as AiEditPlan
    const snapshot = useDocumentStore.getState().document
    applyAiEditPlan(partial)
    setDismissed((prev) => new Set(prev).add(key))
    onApplied({ key, summary: GROUP_LABELS[key], snapshot })
  }

  const applyAll = () => {
    const remaining = Object.fromEntries(
      groups.map((key) => [key, plan[key]]),
    ) as AiEditPlan
    const snapshot = useDocumentStore.getState().document
    applyAiEditPlan(remaining)
    setDismissed(new Set(GROUP_ORDER))
    onApplied({ key: 'all', summary: 'All suggestions', snapshot })
    onDiscard()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Idrizz suggestions
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={applyAll}>
            Apply all
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
            Discard all
          </Button>
        </div>
      </div>

      {groups.map((key) => {
        const lines = describePlan(key, plan, document)
        if (lines.length === 0) return null
        return (
          <section
            key={key}
            className="rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{GROUP_LABELS[key]}</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => applyGroup(key)}>
                  Apply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setDismissed((prev) => new Set(prev).add(key))}
                >
                  Discard
                </Button>
              </div>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {lines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

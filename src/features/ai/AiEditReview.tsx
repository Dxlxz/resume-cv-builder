import { useState } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import type { ResumeDocument } from '@rb/core/types/document'
import type { AiEditPlan } from '@/features/ai/edits'
import { Button } from '@/components/ui/Button'

/**
 * Review panel for an Idrizz edit plan: changes grouped by section, each with
 * its own Apply/Discard, plus Apply all. Nothing is applied until the user
 * clicks. Every apply reports what changed and the pre-apply document snapshot
 * so the chat can offer Undo.
 *
 * UX rule: show CONTENT, not labels. The suggested summary and new bullets
 * render in full so the user can judge the change before applying; the old
 * keyed dump ("New summary: <truncated>") is gone.
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

/** Natural singular noun per section, for "Add a role" copy. */

/** Name field on an add-draft, per section type. */
function draftName(key: PlanKey, draft: Record<string, unknown>): string {
  return String(
    draft.title ?? draft.name ?? draft.institution ?? draft.company ?? GROUP_LABELS[key] ?? 'Entry',
  )
}

/** Item label for edit/remove targets, looking the id up in the document. */
function labelOf(key: PlanKey, id: string, document: ResumeDocument | null): string {
  if (!document) return 'an entry'
  if (key === 'experience') return document.experience.find((e) => e.id === id)?.title ?? 'a role'
  if (key === 'education') return document.education.find((e) => e.id === id)?.institution ?? 'an entry'
  if (key === 'certifications') {
    return document.certifications.find((e) => e.id === id)?.name ?? 'a certification'
  }
  if (key === 'skills') return document.skills.find((e) => e.id === id)?.name ?? 'a skill group'
  if (key === 'projects') return document.projects.find((e) => e.id === id)?.name ?? 'a project'
  if (key === 'volunteer') return document.volunteer.find((e) => e.id === id)?.title ?? 'a role'
  if (key === 'references') return document.references.find((e) => e.id === id)?.name ?? 'a reference'
  return 'an entry'
}

function BulletList({ bullets }: { bullets: unknown }) {
  if (!Array.isArray(bullets) || bullets.length === 0) return null
  return (
    <ul className="mt-1.5 space-y-1">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
          <span className="min-w-0 flex-1 whitespace-pre-wrap">{String(bullet)}</span>
        </li>
      ))}
    </ul>
  )
}

interface EditOp {
  id: string
  patch: Record<string, unknown>
}

interface GroupBodyProps {
  groupKey: PlanKey
  plan: AiEditPlan
  document: ResumeDocument | null
}

function GroupBody({ groupKey, plan, document }: GroupBodyProps) {
  if (groupKey === 'summary' && plan.summary !== undefined) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          Suggested {GROUP_LABELS.summary.toLowerCase()} —
          <span className="text-muted-foreground/80"> replaces your current one</span>
        </p>
        <p className="mt-1.5 whitespace-pre-wrap rounded-sm border border-border bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
          {plan.summary}
        </p>
      </div>
    )
  }

  if (groupKey === 'sections' && plan.sections) {
    return (
      <ul className="space-y-1.5 text-sm">
        {plan.sections.show?.map((s) => (
          <li key={`show-${s}`} className="text-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success/30 bg-badge-success px-2 py-0.5 text-xs font-medium text-status-success-foreground">
              Show
            </span>{' '}
            {getSectionLabel(s, {})} section
          </li>
        ))}
        {plan.sections.hide?.map((s) => (
          <li key={`hide-${s}`} className="text-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Hide
            </span>{' '}
            {getSectionLabel(s, {})} section
          </li>
        ))}
      </ul>
    )
  }

  const ops = plan[groupKey] as
    | { add?: Record<string, unknown>[]; edit?: EditOp[]; remove?: string[] }
    | undefined
  if (!ops) return null

  return (
    <div className="space-y-3">
      {ops.add?.map((draft, i) => {
        const bullets = draft.bullets ?? draft.items
        return (
          <div key={i}>
            <p className="text-sm font-medium text-foreground">
              <span className="mr-1.5 inline-flex items-center gap-1.5 rounded-full border border-status-success/30 bg-badge-success px-2 py-0.5 text-xs font-medium text-status-success-foreground">
                Add
              </span>
              {draftName(groupKey, draft)}
            </p>
            <BulletList bullets={bullets} />
          </div>
        )
      })}

      {ops.edit?.map((edit, i) => {
        const bullets = edit.patch.bullets
        const extra = Object.keys(edit.patch).filter((field) => field !== 'bullets')
        return (
          <div key={i}>
            <p className="text-sm font-medium text-foreground">
              <span className="mr-1.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Rewrite
              </span>
              {labelOf(groupKey, edit.id, document)}
              {extra.length > 0 && (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  ({extra.join(', ')})
                </span>
              )}
            </p>
            <BulletList bullets={bullets} />
          </div>
        )
      })}

      {ops.remove?.map((id) => (
        <p key={id} className="text-sm text-foreground">
          <span className="mr-1.5 inline-flex items-center gap-1.5 rounded-full border border-status-danger/30 bg-badge-danger px-2 py-0.5 text-xs font-medium text-status-danger-foreground">
            Remove
          </span>
          {labelOf(groupKey, id, document)}
        </p>
      ))}
    </div>
  )
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

  const groups = GROUP_ORDER.filter((key) => plan[key] !== undefined && !dismissed.has(key))

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
    const remaining = Object.fromEntries(groups.map((key) => [key, plan[key]])) as AiEditPlan
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

      {groups.map((key) => (
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
          <div className="mt-2.5">
            <GroupBody groupKey={key} plan={plan} document={document} />
          </div>
        </section>
      ))}
    </div>
  )
}
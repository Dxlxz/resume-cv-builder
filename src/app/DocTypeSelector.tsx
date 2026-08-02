import { useState } from 'react'
import type { DocumentType, PresetId } from '@rb/core/types/document'
import type { PresetDefinition } from '@rb/presets/types'
import { useDocumentStore } from '@/app/store/documentStore'
import { PRESET_LIST } from '@rb/presets/registry'
import { AppShell } from '@/app/AppShell'
import { Button } from '@/components/ui/Button'

type Step = 'preset' | 'doctype'

interface DocOption {
  type: DocumentType
  title: string
  /** One plain line: what this document is. */
  line: string
  /** When to choose it. */
  points: string[]
  /** Page motif: 1 = single page, 3 = full record stack. */
  pages: 1 | 3
}

const DOC_OPTIONS: DocOption[] = [
  {
    type: 'resume',
    title: 'Resume',
    line: 'One or two pages. The standard for most applications.',
    points: [
      'Covers the essentials: contact, recent roles, key skills',
      'What recruiters expect for corporate and tech roles',
    ],
    pages: 1,
  },
  {
    type: 'cv',
    title: 'CV',
    line: 'Full career record, no page limit.',
    points: [
      'Every role, project, and certification in detail',
      'For academic, research, and senior applications',
    ],
    pages: 3,
  },
]

const TEMPLATE_LABELS: Record<PresetDefinition['defaults']['templateId'], string> = {
  classic: 'Classic layout',
  academic: 'Academic layout',
  'ats-strict': 'ATS-strict layout',
}

/** What each preset is for - plain language, not lint rules. */
const PRESET_POINTS: Record<PresetId, string[]> = {
  'malaysia-corporate': [
    'ATS-safe single-column layout, kept to 1-2 pages',
    'Malaysia checks: city/state only, no IC/NRIC numbers',
    'Quantify impact in % or RM where possible',
  ],
  'international-generic': [
    'Clean, familiar layout recruiters read quickly',
    'Choose US Letter or A4',
    'Detailed CV mode for academic or research roles',
  ],
}

function presetChips(p: PresetDefinition): string[] {
  const chips: string[] = []
  chips.push(p.defaults.pageSize === 'a4' ? 'A4' : 'US Letter')
  chips.push(TEMPLATE_LABELS[p.defaults.templateId])
  chips.push(p.defaults.locale === 'en-MY' ? 'British English' : 'US English')
  if (p.validators.includes('malaysia-regional')) chips.push('Malaysia checks')
  return chips
}

/** Decorative page schematic - differs per preset so the choice feels concrete. */
function PresetSchematic({ atsStrict }: { atsStrict: boolean }) {
  const bar = (w: string, t: 'strong' | 'soft' | 'faint') =>
    `h-1.5 rounded-full ${w} ${
      t === 'strong'
        ? 'bg-foreground/70'
        : t === 'soft'
          ? 'bg-foreground/40'
          : 'bg-foreground/20'
    }`
  return (
    <div
      aria-hidden
      className="w-full max-w-44 shrink-0 rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]"
    >
      {atsStrict ? (
        <div className="space-y-1">
          <div className={bar('w-3/4', 'strong')} />
          <div className={bar('w-1/2', 'soft')} />
        </div>
      ) : (
        <div className="space-y-1 text-center">
          <div className={`${bar('w-2/3', 'strong')} mx-auto`} />
          <div className={`${bar('w-1/3', 'soft')} mx-auto`} />
        </div>
      )}
      <div className="mt-3 space-y-2">
        <div className={`flex items-center gap-1.5 ${atsStrict ? '' : 'justify-center'}`}>
          <div className={bar('w-1/5', 'soft')} />
          <div className="h-px flex-1 bg-foreground/10" />
        </div>
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-5/6', 'faint')} />
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-4/6', 'faint')} />
      </div>
      <div className="mt-3 space-y-2">
        <div className={`flex items-center gap-1.5 ${atsStrict ? '' : 'justify-center'}`}>
          <div className={bar('w-1/4', 'soft')} />
          <div className="h-px flex-1 bg-foreground/10" />
        </div>
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-3/4', 'faint')} />
      </div>
    </div>
  )
}

/** Decorative page motif: single page (resume) vs stacked pages (CV). */
function PageStack({ pages }: { pages: 1 | 3 }) {
  return (
    <div aria-hidden className="relative h-14 w-10 shrink-0">
      {pages === 3 && (
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm border border-border bg-card" />
      )}
      {pages === 3 && (
        <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-sm border border-border bg-card" />
      )}
      <div className="absolute inset-0 rounded-sm border border-border bg-card shadow-[var(--shadow-raised)]">
        <div className="mx-1.5 mt-2 space-y-1">
          <div className="h-1 w-2/3 rounded-full bg-foreground/50" />
          <div className="h-1 w-full bg-foreground/15" />
          <div className="h-1 w-4/5 bg-foreground/15" />
          <div className="h-1 w-full bg-foreground/15" />
        </div>
      </div>
    </div>
  )
}

interface DocTypeSelectorProps {
  onBack: () => void
}

export function DocTypeSelector({ onBack }: DocTypeSelectorProps) {
  const startDocument = useDocumentStore((s) => s.startDocument)
  const startFromSample = useDocumentStore((s) => s.startFromSample)
  const loadPersonalProfile = useDocumentStore((s) => s.loadPersonalProfile)
  const personalProfileAvailable = useDocumentStore((s) => s.personalProfileAvailable)
  const [step, setStep] = useState<Step>('preset')
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('malaysia-corporate')

  const preset = PRESET_LIST.find((p) => p.id === selectedPreset)!

  if (step === 'preset') {
    return (
      <AppShell backLabel="Home" onBack={onBack}>
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Step 1 of 2
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
              Where are you applying?
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              This sets your template, page size, and writing norms. You can change
              everything later in the builder.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PRESET_LIST.map((p) => {
              const isSelected = selectedPreset === p.id
              return (
                <article
                  key={p.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => setSelectedPreset(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedPreset(p.id)
                    }
                  }}
                  className={`flex cursor-pointer flex-col rounded-lg border bg-card p-6 transition-shadow duration-[var(--duration-state)] ${
                    isSelected
                      ? 'border-ring ring-2 ring-ring/20 shadow-[var(--shadow-raised)]'
                      : 'border-border shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-menu)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {p.region}
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-foreground">{p.name}</h2>
                    </div>
                    <span
                      aria-hidden
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {presetChips(p).map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-5">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {PRESET_POINTS[p.id].map((point) => (
                        <li key={point} className="flex gap-2">
                          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <PresetSchematic atsStrict={p.id === 'malaysia-corporate'} />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Button className="min-w-48" onClick={() => setStep('doctype')}>
              Continue with {preset.name}
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell backLabel="Preset" onBack={() => setStep('preset')}>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Step 2 of 2
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            Resume or CV?
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Both start from the same details. You can switch later and nothing is lost.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {DOC_OPTIONS.map((option) => (
            <article
              key={option.type}
              className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-raised)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{option.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {option.line}
                  </p>
                </div>
                <PageStack pages={option.pages} />
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {option.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => startDocument(option.type, selectedPreset)}
                >
                  Start blank
                </Button>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => startFromSample(option.type, selectedPreset)}
                >
                  See a sample
                </Button>
                {personalProfileAvailable && (
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() =>
                      startDocument(option.type, selectedPreset, { withPersonalProfile: true })
                    }
                  >
                    Use my profile
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Saved automatically in your browser. No account needed.
        </p>

        {personalProfileAvailable && (
          <p className="mt-2 text-center">
            <button
              type="button"
              className="text-sm text-primary underline"
              onClick={() => loadPersonalProfile()}
            >
              Load full personal profile (Malaysia Corporate preset)
            </button>
          </p>
        )}
      </div>
    </AppShell>
  )
}

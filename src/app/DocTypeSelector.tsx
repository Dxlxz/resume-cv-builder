import { useState } from 'react'
import type { DocumentType, PresetId } from '@rb/core/types/document'
import type { PresetDefinition } from '@rb/presets/types'
import { useDocumentStore } from '@/app/store/documentStore'
import { PRESET_LIST } from '@rb/presets/registry'
import { Button } from '@/components/ui/Button'

type Step = 'preset' | 'doctype'

const DOC_OPTIONS: {
  type: DocumentType
  title: string
  description: string
}[] = [
  {
    type: 'resume',
    title: 'Resume',
    description: 'Concise 1–2 pages for most job applications.',
  },
  {
    type: 'cv',
    title: 'CV',
    description: 'Detailed record for academic or research roles.',
  },
]

const TEMPLATE_LABELS: Record<PresetDefinition['defaults']['templateId'], string> = {
  classic: 'Classic layout',
  academic: 'Academic layout',
  'ats-strict': 'ATS-strict layout',
}

/** What each preset is for — plain language, not lint rules. */
const PRESET_POINTS: Record<PresetId, string[]> = {
  'malaysia-corporate': [
    'ATS-safe single-column layout, kept to 1–2 pages',
    'Malaysia checks: city/state only, no IC/NRIC numbers',
    'Quantify impact in % or RM where possible',
  ],
  'international-generic': [
    'Clean, familiar layout recruiters read quickly',
    'US Letter or A4 — your choice',
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

/** Decorative page schematic — differs per preset so the choice feels concrete. */
function PresetSchematic({ atsStrict }: { atsStrict: boolean }) {
  const bar = (w: string, t: 'strong' | 'soft' | 'faint') =>
    `h-1.5 rounded-full ${w} ${
      t === 'strong'
        ? 'bg-[var(--gray-alpha-800)]'
        : t === 'soft'
          ? 'bg-[var(--gray-alpha-500)]'
          : 'bg-[var(--gray-alpha-300)]'
    }`
  return (
    <div aria-hidden className="w-full max-w-44 shrink-0 rounded-sm border border-[var(--gray-alpha-200)] bg-card p-4 shadow-[var(--shadow-raised)]">
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
          <div className="h-px flex-1 bg-[var(--gray-alpha-300)]" />
        </div>
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-5/6', 'faint')} />
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-4/6', 'faint')} />
      </div>
      <div className="mt-3 space-y-2">
        <div className={`flex items-center gap-1.5 ${atsStrict ? '' : 'justify-center'}`}>
          <div className={bar('w-1/4', 'soft')} />
          <div className="h-px flex-1 bg-[var(--gray-alpha-300)]" />
        </div>
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-3/4', 'faint')} />
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
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center bg-background px-6 py-12">
        <div className="mb-10 text-center">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-primary underline"
          >
            ← Back to home
          </button>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Resume & CV Builder
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
                    ? 'border-[var(--ring)] ring-2 ring-[var(--ring)]/20 shadow-[var(--shadow-raised)]'
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
                        : 'border-[var(--gray-alpha-400)] bg-transparent'
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
                      className="rounded-full border border-[var(--gray-alpha-300)] bg-[var(--gray-alpha-100)] px-2.5 py-0.5 text-xs text-muted-foreground"
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
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center bg-background px-6 py-12">
      <div className="mb-10 text-center">
        <button
          type="button"
          className="mb-4 text-sm text-primary underline"
          onClick={() => setStep('preset')}
        >
          ← Change preset ({preset.name})
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Resume or CV?
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Your content is preserved if you switch later.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {DOC_OPTIONS.map((option) => (
          <article
            key={option.type}
            className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-raised)]"
          >
            <h2 className="text-2xl font-bold text-foreground">{option.title}</h2>
            <p className="mt-2 flex-1 text-muted-foreground">{option.description}</p>
            <Button
              className="mt-6 w-full"
              onClick={() => startDocument(option.type, selectedPreset)}
            >
              Start blank {option.title}
            </Button>
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => startFromSample(option.type, selectedPreset)}
            >
              Start from sample
            </Button>
            {personalProfileAvailable && (
              <Button
                className="mt-2 w-full"
                variant="secondary"
                onClick={() =>
                  startDocument(option.type, selectedPreset, { withPersonalProfile: true })
                }
              >
                Start with my profile
              </Button>
            )}
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Start blank and build from scratch, or load a fictional sample to see a
        finished, ATS-ready example you can edit or replace.
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

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Local only — drafts save automatically in this browser.
      </p>
    </div>
  )
}

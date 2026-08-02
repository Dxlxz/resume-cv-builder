import { useState } from 'react'
import type { DocumentType, PresetId } from '@rb/core/types/document'
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
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center bg-background px-6 py-12">
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
            Choose your profile preset
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Presets configure templates, page size, and export rules. You can change later.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRESET_LIST.map((p) => (
            <article
              key={p.id}
              className={`flex cursor-pointer flex-col rounded-lg border bg-card p-6 transition-shadow duration-[var(--duration-state)] ${
                selectedPreset === p.id
                  ? 'border-[var(--ring)] ring-2 ring-[var(--ring)]/20 shadow-[var(--shadow-raised)]'
                  : 'border-border shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-menu)]'
              }`}
              onClick={() => setSelectedPreset(p.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedPreset(p.id)}
              role="button"
              tabIndex={0}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {p.region}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">{p.name}</h2>
              <p className="mt-2 flex-1 text-muted-foreground">{p.description}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {p.hints.slice(0, 3).map((hint) => (
                  <li key={hint}>• {hint}</li>
                ))}
              </ul>
            </article>
          ))}
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

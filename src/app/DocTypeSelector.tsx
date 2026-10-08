import { useState } from 'react'
import { CheckIcon } from 'lucide-react'
import type { DocumentType, PresetId } from '@rb/core/types/document'
import type { PresetDefinition } from '@rb/presets/types'
import { PRESET_LIST } from '@rb/presets/registry'
import { useDocumentStore } from '@/modules/document'
import { AppShell } from '@/shared/layout/AppShell'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldContent, FieldLabel, FieldTitle } from '@/shared/ui/field'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/shared/ui/stepper'

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
      'Every role, project and certification in detail',
      'For academic, research and senior applications',
    ],
    pages: 3,
  },
]

const TEMPLATE_LABELS: Record<PresetDefinition['defaults']['templateId'], string> = {
  classic: 'Classic layout',
  academic: 'Academic layout',
  'ats-strict': 'ATS-strict layout',
  'modern-rail': 'Modern rail layout',
  banner: 'Banner layout',
  sidebar: 'Sidebar layout',
  ivy: 'Ivy layout',
  compact: 'Compact layout',
  split: 'Split layout',
  executive: 'Executive layout',
  harbor: 'Harbor layout',
  slate: 'Slate layout',
  minimal: 'Minimal layout',
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

/** Decorative page schematic - differs per preset so the choice feels concrete. It is paper, so it uses the paper tokens. */
function PresetSchematic({ atsStrict }: { atsStrict: boolean }) {
  const bar = (width: string, tone: 'strong' | 'soft' | 'faint') =>
    `h-1.5 rounded-full ${width} ${
      tone === 'strong' ? 'bg-paper-foreground/70' : tone === 'soft' ? 'bg-paper-foreground/40' : 'bg-paper-foreground/15'
    }`
  const align = atsStrict ? '' : 'justify-center'
  return (
    <div aria-hidden className="w-full max-w-36 shrink-0 rounded-sm bg-paper p-3 shadow-md ring-1 ring-paper-foreground/10">
      <div className={`space-y-1 ${atsStrict ? '' : 'flex flex-col items-center'}`}>
        <div className={bar(atsStrict ? 'w-3/4' : 'w-2/3', 'strong')} />
        <div className={bar(atsStrict ? 'w-1/2' : 'w-1/3', 'soft')} />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className={`flex items-center gap-1.5 ${align}`}>
          <div className={bar('w-1/5', 'soft')} />
          <div className="h-px flex-1 bg-paper-foreground/10" />
        </div>
        <div className={bar('w-full', 'faint')} />
        <div className={bar('w-5/6', 'faint')} />
        <div className={bar('w-4/6', 'faint')} />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className={`flex items-center gap-1.5 ${align}`}>
          <div className={bar('w-1/4', 'soft')} />
          <div className="h-px flex-1 bg-paper-foreground/10" />
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
      {pages === 3 && <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-sm bg-paper ring-1 ring-paper-foreground/15" />}
      {pages === 3 && <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-sm bg-paper ring-1 ring-paper-foreground/15" />}
      <div className="absolute inset-0 rounded-sm bg-paper shadow-sm ring-1 ring-paper-foreground/15">
        <div className="mx-1.5 mt-2 space-y-1">
          <div className="h-1 w-2/3 rounded-full bg-paper-foreground/50" />
          <div className="h-1 w-full bg-paper-foreground/15" />
          <div className="h-1 w-4/5 bg-paper-foreground/15" />
          <div className="h-1 w-full bg-paper-foreground/15" />
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
  const [step, setStep] = useState(1)
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('malaysia-corporate')

  const preset = PRESET_LIST.find((p) => p.id === selectedPreset)!

  return (
    <AppShell backLabel={step === 1 ? 'Home' : 'Preset'} onBack={step === 1 ? onBack : () => setStep(1)}>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Stepper value={step} onValueChange={setStep} indicators={{ completed: <CheckIcon className="size-4" aria-hidden /> }}>
          <StepperNav className="mx-auto mb-10 max-w-sm">
            <StepperItem step={1}>
              <StepperTrigger className="flex-col gap-2 sm:flex-row">
                <StepperIndicator className="size-7 text-sm">1</StepperIndicator>
                <StepperTitle>Preset</StepperTitle>
              </StepperTrigger>
              <StepperSeparator className="mx-3 group-data-[state=completed]/step:bg-primary" />
            </StepperItem>
            <StepperItem step={2}>
              <StepperTrigger className="flex-col gap-2 sm:flex-row">
                <StepperIndicator className="size-7 text-sm">2</StepperIndicator>
                <StepperTitle>Document</StepperTitle>
              </StepperTrigger>
            </StepperItem>
          </StepperNav>

          <StepperPanel>
            <StepperContent value={1}>
              <div className="mb-8 text-center">
                <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">Where are you applying?</h1>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  This sets your template, page size and writing norms. You can change everything later in the builder.
                </p>
              </div>

              <RadioGroup
                value={selectedPreset}
                onValueChange={(value) => setSelectedPreset(value as PresetId)}
                aria-label="Preset"
                className="grid gap-4 md:grid-cols-2"
              >
                {PRESET_LIST.map((p) => (
                  <FieldLabel key={p.id} htmlFor={`preset-${p.id}`}>
                    <Field orientation="horizontal" className="items-start">
                      <FieldContent className="gap-3">
                        <div>
                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{p.region}</p>
                          <FieldTitle className="mt-1 text-lg">{p.name}</FieldTitle>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {presetChips(p).map((chip) => (
                            <Badge key={chip} variant="outline" size="lg">
                              {chip}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-end justify-between gap-5">
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {PRESET_POINTS[p.id].map((point) => (
                              <li key={point} className="flex gap-2">
                                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                                {point}
                              </li>
                            ))}
                          </ul>
                          <PresetSchematic atsStrict={p.id === 'malaysia-corporate'} />
                        </div>
                      </FieldContent>
                      <RadioGroupItem value={p.id} id={`preset-${p.id}`} aria-label={p.name} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>

              <div className="mt-8 flex justify-center">
                <Button size="lg" className="h-10 min-w-56 px-4 text-sm" onClick={() => setStep(2)}>
                  Continue with {preset.name}
                </Button>
              </div>
            </StepperContent>

            <StepperContent value={2}>
              <div className="mb-8 text-center">
                <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">Resume or CV?</h1>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Both start from the same details. You can switch later and nothing is lost.
                </p>
              </div>

              <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
                {DOC_OPTIONS.map((option) => (
                  <Card key={option.type}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{option.title}</CardTitle>
                          <CardDescription className="mt-1.5">{option.line}</CardDescription>
                        </div>
                        <PageStack pages={option.pages} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {option.points.map((point) => (
                          <li key={point} className="flex gap-2">
                            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch gap-2 border-t-0 bg-transparent">
                      <Button className="w-full" onClick={() => startDocument(option.type, selectedPreset)}>
                        Start blank
                      </Button>
                      <Button className="w-full" variant="outline" onClick={() => startFromSample(option.type, selectedPreset)}>
                        See a sample
                      </Button>
                      {personalProfileAvailable && (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => startDocument(option.type, selectedPreset, { withPersonalProfile: true })}
                        >
                          Use my profile
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Saved automatically in your browser. No account needed.
              </p>

              {personalProfileAvailable && (
                <p className="mt-2 text-center">
                  <Button type="button" variant="link" size="sm" className="h-auto whitespace-normal py-1" onClick={() => loadPersonalProfile()}>
                    Load full personal profile (Malaysia Corporate preset)
                  </Button>
                </p>
              )}
            </StepperContent>
          </StepperPanel>
        </Stepper>
      </div>
    </AppShell>
  )
}

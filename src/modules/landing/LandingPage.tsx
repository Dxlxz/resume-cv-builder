import type { ComponentType } from 'react'
import { FileSearchIcon, FileUpIcon, MapPinIcon } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Brand } from '@/shared/ui/brand'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion'
import { navigateTo } from '@/shared/hooks/useAppRoute'
import { ThemeToggle } from '@/shared/theme/ThemeToggle'
import { TEMPLATE_LIST } from '@rb/templates/registry'
import { HeroPdfCard } from './HeroPdfPreview'
import { TemplatesShowcase } from './TemplatesShowcase'
import {
  CheckExportIllustration,
  ChoosePresetIllustration,
  FillDetailsIllustration,
  LocalOnlyIllustration,
  PreviewIsPdfIllustration,
  ReadBackIllustration,
} from './illustrations'

/**
 * Marketing landing. The product is a document, so the page is built around one: the hero shows a real exported PDF
 * resting on a desk surface, and everything around it stays quiet. Display type is a serif (the documents' own
 * voice); the interface itself is Geist. No gradients, glass or stock art: the illustrations are drawn from the
 * product itself (F-008), and every claim on the page is true of the build.
 */

interface LandingPageProps {
  onStart: () => void
  onLoadProfile: () => void
  /** Private local personal pack present (dev-only feature; hidden otherwise). */
  personalProfileAvailable?: boolean
}

const FACTS: { value: string; label: string }[] = [
  { value: String(TEMPLATE_LIST.length), label: 'templates, one click apart' },
  { value: 'No account', label: 'and no server: drafts stay in your browser' },
  { value: 'Tagged PDF', label: 'with a title and language, readable by screen readers' },
  { value: 'Read back', label: 'your PDF is checked the way an ATS parses it' },
]

const HIGHLIGHTS: { title: string; description: string; Illustration: ComponentType }[] = [
  {
    title: 'The preview is the PDF',
    description:
      'What you see beside the form is the file you export, typeset as you type. Zoom in, check every page, then send it.',
    Illustration: PreviewIsPdfIllustration,
  },
  {
    title: 'Read back like an ATS',
    description:
      'Your PDF is read back the way a parser reads it: every field present, in order, no word split across a line. Style is a tip, never a fail.',
    Illustration: ReadBackIllustration,
  },
  {
    title: 'Stays on your device',
    description:
      'No account, no upload, no tracking. Your drafts live in this browser and the PDF is made on your machine.',
    Illustration: LocalOnlyIllustration,
  },
]

const MORE: { title: string; description: string; icon: ComponentType<{ className?: string }> }[] = [
  {
    title: 'Malaysia corporate preset',
    description: 'A4, an ATS-strict layout, British English norms, and a warning before an IC number or personal details go out.',
    icon: MapPinIcon,
  },
  {
    title: 'Bring what you already have',
    description: 'Import a JSON Resume file or an existing resume PDF, and export a JSON backup any time.',
    icon: FileUpIcon,
  },
  {
    title: 'Check any PDF',
    description: 'Drop in a resume from anywhere and see exactly what an applicant tracking system reads from it.',
    icon: FileSearchIcon,
  },
]

const STEPS: { title: string; description: string; Illustration: ComponentType }[] = [
  {
    title: 'Choose a preset',
    description: 'Malaysia Corporate or International. Template, page size and writing norms are set for you.',
    Illustration: ChoosePresetIllustration,
  },
  {
    title: 'Fill in your details',
    description: 'The preview beside the form is the real PDF, updating as you type.',
    Illustration: FillDetailsIllustration,
  },
  {
    title: 'Check and export',
    description: 'Fix any ATS risk the check finds, then download the PDF.',
    Illustration: CheckExportIllustration,
  },
]

const FAQ: { question: string; answer: string }[] = [
  {
    question: 'Is Rizzume free?',
    answer: 'Yes. There is no account, no trial and no paid tier. Every template and the ATS check are included.',
  },
  {
    question: 'Does my resume leave my computer?',
    answer:
      'No. Drafts are saved in this browser, and the PDF is typeset on your device. Nothing is uploaded, and there is no tracking.',
  },
  {
    question: 'Will an ATS reject my resume for its design?',
    answer:
      'Applicant tracking systems reject candidates through the employer’s screening questions, not through fonts or colours. What matters is that a parser can read your PDF, in order. Rizzume checks exactly that by reading your PDF back.',
  },
  {
    question: 'Are two-column templates safe for job portals?',
    answer:
      'Our two-column templates keep the reading order a parser needs, and each one passes the same read-back test. For the strictest portals, ATS Strict is the plain single-column choice.',
  },
  {
    question: 'Should I put my IC number, age or photo on it?',
    answer:
      'For Malaysian applications, leave out your IC number, marital status, religion, age and date of birth: employers collect these on their own forms. A photo is optional; include one only when the job ad asks.',
  },
  {
    question: 'Can I edit a resume I already have?',
    answer: 'Yes. Import an existing resume PDF or a JSON Resume file, then switch templates freely.',
  },
]

export function LandingPage({ onStart, onLoadProfile, personalProfileAvailable = false }: LandingPageProps) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground outline-none">
      {/* --- Nav --- */}
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
          <Brand />
          <nav aria-label="Primary" className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <a href="#templates-heading">Templates</a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <a href="#faq-heading">FAQ</a>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => navigateTo('ats-check')} className="hidden sm:inline-flex">
              ATS check
            </Button>
            <ThemeToggle />
            <Button type="button" onClick={onStart}>
              Start building
            </Button>
          </nav>
        </div>
      </header>

      <main>
      {/* --- Hero: the paper is the star --- */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr] lg:py-24">
          <div>
            <Badge variant="primary-light" size="lg" radius="full">
              ATS-ready resume builder
            </Badge>

            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Resumes with <em className="italic">rizz.</em>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Typeset a resume that reads well to people and parses cleanly for applicant tracking systems. Live PDF
              preview, {TEMPLATE_LIST.length} templates and presets tuned for Malaysia. Your data stays in your browser.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button type="button" size="lg" onClick={onStart} className="h-10 px-4 text-sm">
                Start building
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigateTo('ats-check')}
                className="h-10 px-4 text-sm"
              >
                Check a PDF
              </Button>
              {personalProfileAvailable && (
                <Button type="button" variant="ghost" size="lg" onClick={onLoadProfile} className="h-10 px-4 text-sm">
                  Start with my profile
                </Button>
              )}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">Free · No account · Runs entirely in your browser</p>
          </div>

          <HeroPdfCard />
        </div>
      </section>

      {/* --- Facts: true of the build, no invented numbers --- */}
      <section aria-label="At a glance" className="border-b border-border bg-muted/40">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {FACTS.map((fact) => (
            <li key={fact.value} className="flex flex-col gap-1">
              <span className="font-display text-2xl font-semibold tracking-tight text-foreground">{fact.value}</span>
              <span className="text-sm leading-snug text-muted-foreground">{fact.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <TemplatesShowcase onStart={onStart} />

      {/* --- Highlights: three things it does, each drawn --- */}
      <section aria-labelledby="highlights-heading" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="highlights-heading" className="max-w-2xl scroll-mt-24 font-display text-3xl font-semibold tracking-tight text-balance">
            Built around the file you send
          </h2>
          <ul className="mt-10 grid gap-6 lg:grid-cols-3">
            {HIGHLIGHTS.map(({ title, description, Illustration }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="desk-grain rounded-xl bg-muted px-3 py-4">
                  <Illustration />
                </div>
                <h3 className="mt-5 font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-12 grid gap-x-12 gap-y-8 md:grid-cols-3">
            {MORE.map(({ title, description, icon: Icon }) => (
              <div key={title}>
                <dt className="flex items-center gap-3 font-semibold text-foreground">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  {title}
                </dt>
                <dd className="mt-1 pl-8 text-sm leading-relaxed text-muted-foreground">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --- How it works --- */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ Illustration, ...step }, index) => (
              <li key={step.title} className="flex flex-col gap-4">
                <div className="desk-grain rounded-xl bg-muted px-4 py-3">
                  <Illustration />
                </div>
                <div className="flex gap-4">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section aria-labelledby="faq-heading" className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="faq-heading" className="scroll-mt-24 font-display text-3xl font-semibold tracking-tight">
              Questions
            </h2>
            <p className="mt-3 text-muted-foreground">Straight answers, including where the common ATS advice is wrong.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* --- Bottom CTA --- */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl font-semibold tracking-tight text-balance">
            Your next application starts here
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Pick a preset, fill in your details and export a PDF that people and parsers both read well.
          </p>
          <div className="mt-8 flex justify-center">
            <Button type="button" size="lg" onClick={onStart} className="h-10 px-4 text-sm">
              Start building
            </Button>
          </div>
        </div>
      </section>

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr] sm:px-6">
          <div>
            <Brand />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A local-first resume and CV builder. Drafts stay in your browser; nothing is uploaded.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col items-start gap-1 text-sm">
            <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onStart}>
              Start building
            </Button>
            <Button variant="link" size="sm" asChild className="h-auto px-0">
              <a href="#templates-heading">Templates</a>
            </Button>
            <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => navigateTo('ats-check')}>
              Check a PDF
            </Button>
            <Button variant="link" size="sm" asChild className="h-auto px-0">
              <a href="#faq-heading">FAQ</a>
            </Button>
          </nav>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">© 2026 Rizzume.</p>
        </div>
      </footer>
    </div>
  )
}

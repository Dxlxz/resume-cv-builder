import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Brand } from '@/components/ui/Brand'
import { HeroPdfCard } from '@/components/landing/HeroPdfPreview'
import { ExamplesSection } from '@/components/landing/ExamplesSection'

/**
 * Marketing landing, editorial persona (see UDS taste-and-feel.md). The one
 * deliberate marketing surface in the product: large type, asymmetric hero,
 * concrete copy. Stays on UDS semantic tokens: no dark flip, no glow orbs,
 * no glass, no pill buttons, no raw primitives.
 */

interface LandingPageProps {
  onStart: () => void
  onLoadProfile: () => void
  /** Private local personal pack present (dev-only feature; hidden otherwise). */
  personalProfileAvailable?: boolean
}

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-primary">
      {children}
    </span>
  )
}

const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: 'Live PDF preview',
    description:
      'The preview is the exported PDF. Select, copy, and zoom to check every page before you send it.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 8l10-5 10 5v8l-10 5L2 16V8z" />
        <path d="M2 8l10 5 10-5M12 13v8" />
      </svg>
    ),
  },
  {
    title: 'ATS check before export',
    description:
      'Contact validation, template hints, and Malaysia warnings such as IC numbers in your draft.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Malaysia corporate presets',
    description:
      'JobStreet-ready defaults: A4, ATS-strict layout, British English norms, with a one to two page goal.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: 'AI assistance, opt-in',
    description:
      'Improve a summary, rewrite bullets, or tailor to a job description. Suggestions are reviewed before applying; nothing is stored or used for training.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2a3 3 0 0 1 3 3v2h3a3 3 0 0 1 3 3v3a3 3 0 0 1-2 2.83V19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-4.17A3 3 0 0 1 3 13v-3a3 3 0 0 1 3-3h3V5a3 3 0 0 1 3-3z" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    title: 'JSON backup and import',
    description:
      'Export your document as JSON and import it anywhere. Auto-save keeps every keystroke in this browser.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
  {
    title: 'Local-first privacy',
    description:
      'No account, no server, no tracking. Drafts and catalog choices live in your browser and never leave your machine.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
]

const STEPS: { title: string; description: string }[] = [
  {
    title: 'Choose a preset',
    description: 'Malaysia Corporate or International. Template, page size, and writing norms are set for you.',
  },
  {
    title: 'Fill in your details',
    description: 'The preview on the right is the real PDF, updating as you type.',
  },
  {
    title: 'Check and export',
    description: 'Run the ATS check, fix what it flags, then download the PDF.',
  },
]

/** Abstract resume mock. Skeleton bars that read like a real page without fake text. */

/** Hero backdrop: compressed looping video with a dark veil; static poster under reduced motion. */
function HeroBackground() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {reduced ? (
        <img
          src="/images/landing-bg-poster.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          className="h-full w-full object-cover"
          src="/videos/landing-bg.mp4"
          poster="/images/landing-bg-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          tabIndex={-1}
        />
      )}
      <div className="absolute inset-0 bg-foreground/45" />
    </div>
  )
}

export function LandingPage({
  onStart,
  onLoadProfile,
  personalProfileAvailable = false,
}: LandingPageProps) {
  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground outline-none">
      {/* --- Nav --- */}
      <header className="sticky top-0 z-40 border-b border-border bg-header">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
          <Brand />
          <nav aria-label="Primary" className="ml-auto flex items-center gap-2">
            <Button type="button" onClick={onStart}>
              Start building
            </Button>
          </nav>
        </div>
      </header>

      {/* --- Hero --- */}
      <section className="relative overflow-hidden border-b border-border">
        <HeroBackground />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-3.5 py-1.5 text-xs font-medium text-background">
              <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden />
              Local-first. No account required.
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-background sm:text-5xl">
              Resumes with rizz.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-background/80 sm:text-lg">
              A local-first builder with a live PDF preview, ATS checks, and
              presets tuned for Malaysia. Your data stays in your browser.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={onStart}>
                Start building
              </Button>
              {personalProfileAvailable && (
                <Button type="button" variant="secondary" onClick={onLoadProfile}>
                  Start with my profile
                </Button>
              )}
            </div>

            <p className="mt-5 text-sm text-background/70">
              Free. No account. Export a PDF you can check before sending.
            </p>
          </div>

          <div className="relative">
            <HeroPdfCard />
          </div>
        </div>
      </section>

      {/* --- Examples --- */}
      <ExamplesSection />

      {/* --- How it works --- */}
      <section className="border-b border-border bg-muted">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-[15px] font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Features --- */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight">
            Everything you need to apply with confidence
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-md border border-border bg-card p-6 transition-colors duration-[var(--duration-state)] hover:border-foreground/25"
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Bottom CTA --- */}
      <section className="border-t border-border bg-muted">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your next application starts here
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Pick a preset, fill in your details, and export an ATS-ready PDF in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" onClick={onStart}>
              Start building
            </Button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <p>
            © 2026 Rizzume. Drafts stay in your browser. AI assistance
            is opt-in and sends text to an external service that stores nothing.
          </p>
        </div>
      </footer>
    </div>
  )
}

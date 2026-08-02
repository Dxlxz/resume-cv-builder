import type { ReactNode } from 'react'
import { navigateToAdmin } from '@/hooks/useAppRoute'

/**
 * Marketing landing — ChatGPT-style premium hero, rendered with UDS tokens.
 * The `.dark` class on the root wrapper switches the vendored token set to
 * dark mode (the app itself stays light; the landing is a deliberate
 * marketing surface that transitions into the product).
 */

interface LandingPageProps {
  onStart: () => void
  onLoadProfile: () => void
  /** Private local personal pack present (dev-only feature; hidden otherwise). */
  personalProfileAvailable?: boolean
}

function Orb({ className, color, size }: { className: string; color: string; size: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(closest-side, ${color}, transparent)`,
      }}
    />
  )
}

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gray-alpha-200)] bg-[var(--gray-alpha-100)] text-[var(--brand-500)]">
      {children}
    </span>
  )
}

const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: 'ATS-ready checks',
    description:
      'Lint your resume before export — contact validation, template hints, and Malaysia-specific warnings like NRIC exposure.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Live PDF preview',
    description:
      'The preview is the real PDF — rendered by the same engine that exports. Select, copy, zoom, and verify every pixel before downloading.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 8l10-5 10 5v8l-10 5L2 16V8z" />
        <path d="M2 8l10 5 10-5M12 13v8" />
      </svg>
    ),
  },
  {
    title: 'Malaysia corporate presets',
    description:
      'Start from an ATS-strict, A4 layout tuned for Malaysian hiring — or an international generic profile for roles abroad.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: 'Local-first privacy',
    description:
      'No account, no server, no tracking. Drafts and catalogs live in your browser — your data never leaves your machine.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    title: 'Smart catalog pickers',
    description:
      'Searchable skill, occupation, institution, and language lists with canonical labels — fully customizable in admin mode.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5h9M11 12h9M11 19h9" />
        <circle cx="5" cy="5" r="1.6" />
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="5" cy="19" r="1.6" />
      </svg>
    ),
  },
  {
    title: 'JSON backup & import',
    description:
      'Export your document as JSON for backup or portability, and import it anywhere. Auto-save keeps every keystroke safe.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
]

/** Abstract resume mock — skeleton bars, reads like a real page without fake text. */
function ResumeMock() {
  const bar = (w: string, tone: 'fg' | 'muted' | 'faint') =>
    `h-2 rounded-full ${w} ${
      tone === 'fg'
        ? 'bg-gray-1000'
        : tone === 'muted'
          ? 'bg-[var(--gray-alpha-700)]'
          : 'bg-[var(--gray-alpha-500)]'
    }`
  return (
    <div className="w-full max-w-md rounded-lg border border-[var(--gray-alpha-200)] bg-card p-6 shadow-[var(--shadow-modal)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--brand-700)]/70" />
        <div className="flex-1 space-y-1.5">
          <div className={bar('w-2/3', 'fg')} />
          <div className={bar('w-2/5', 'muted')} />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-11/12', 'muted')} />
        <div className={bar('w-4/5', 'faint')} />
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-3/4', 'faint')} />
        <div className={bar('w-10/12', 'muted')} />
        <div className={bar('w-2/3', 'faint')} />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-status-success" />
        <div className={bar('w-1/3', 'muted')} />
      </div>
    </div>
  )
}

export function LandingPage({
  onStart,
  onLoadProfile,
  personalProfileAvailable = false,
}: LandingPageProps) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* ————— Nav ————— */}
      <header className="sticky top-0 z-40 border-b border-[var(--gray-alpha-300)]/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--brand-700)] text-primary-foreground">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                <path d="M14 2v5h5M9 12h6M9 16h6" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Resume &amp; CV Builder</span>
          </div>
          <nav className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={navigateToAdmin}
              className="rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors duration-[var(--duration-state)] hover:text-foreground"
            >
              Manage catalogs
            </button>
            <button
              type="button"
              onClick={onStart}
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity duration-[var(--duration-state)] hover:opacity-85"
            >
              Start building
            </button>
          </nav>
        </div>
      </header>

      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden">
        <Orb
          className="-top-24 left-1/2 -translate-x-[70%]"
          color="color-mix(in oklch, var(--brand-500) 45%, transparent)"
          size="34rem"
        />
        <Orb
          className="top-40 right-[-8rem]"
          color="color-mix(in oklch, var(--teal-600) 30%, transparent)"
          size="28rem"
        />
        <Orb
          className="bottom-[-10rem] left-[-6rem]"
          color="color-mix(in oklch, var(--gray-1000) 50%, transparent)"
          size="26rem"
        />

        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gray-alpha-300)] bg-[var(--gray-alpha-100)] px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden />
            Local-first · No account required
          </span>

          <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Resumes that get read.
            <br />
            <span className="text-muted-foreground">CVs that clear ATS.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A browser-based resume &amp; CV builder with live PDF preview, ATS checks, and
            regional presets for Malaysia. Your data never leaves your browser.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="rounded-full bg-foreground px-7 py-3 text-[15px] font-medium text-background transition-opacity duration-[var(--duration-state)] hover:opacity-85"
            >
              Start building — free
            </button>
            {personalProfileAvailable && (
              <button
                type="button"
                onClick={onLoadProfile}
                className="rounded-full border border-[var(--gray-alpha-400)] px-7 py-3 text-[15px] font-medium text-foreground transition-colors duration-[var(--duration-state)] hover:bg-[var(--gray-alpha-200)]"
              >
                Start with my profile
              </button>
            )}
          </div>

          <p className="mt-7 text-xs tracking-wide text-muted-foreground/80">
            PDF export · ATS check · Auto-save · JSON backup
          </p>
        </div>

        {/* ————— Product mock ————— */}
        <div className="relative mx-auto max-w-4xl px-5 pb-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-8 h-64 rounded-full bg-[var(--brand-700)]/15 blur-3xl"
          />
          <div className="relative overflow-hidden rounded-lg border border-[var(--gray-alpha-300)] bg-card shadow-[var(--shadow-modal)]">
            <div className="flex items-center gap-1.5 border-b border-[var(--gray-alpha-300)] bg-[var(--gray-alpha-100)] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--gray-alpha-500)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--gray-alpha-500)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--gray-alpha-500)]" />
              <span className="ml-3 rounded-full bg-[var(--gray-alpha-200)] px-2.5 py-0.5 text-[10px] text-muted-foreground">
                resume-dale.pdf
              </span>
            </div>
            <div className="flex items-stretch justify-center gap-8 px-6 py-10 sm:px-12">
              <ResumeMock />
              <div className="hidden flex-col items-start justify-center gap-4 sm:flex">
                <span className="inline-flex items-center gap-2 rounded-full border border-status-success/30 bg-badge-success px-3 py-1.5 text-xs font-medium text-status-success-foreground">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  ATS check passed
                </span>
                <span className="text-xs text-muted-foreground">
                  A4 · 2 pages · Malaysia Corporate
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Features ————— */}
      <section className="border-t border-[var(--gray-alpha-300)]/60 bg-[var(--background-200)]/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything you need to apply with confidence
            </h2>
            <p className="mt-3 text-muted-foreground">
              A small tool with an unusual standard: the preview is the exact PDF you export.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-[var(--gray-alpha-300)] bg-card p-6 transition-colors duration-[var(--duration-state)] hover:border-[var(--gray-alpha-500)]"
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

      {/* ————— Bottom CTA ————— */}
      <section className="border-t border-[var(--gray-alpha-300)]/60">
        <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
          <Orb
            className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            color="color-mix(in oklch, var(--brand-500) 30%, transparent)"
            size="26rem"
          />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next application starts here
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted-foreground">
              Pick a preset, fill in your details, and export an ATS-ready PDF in minutes.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onStart}
                className="rounded-full bg-foreground px-7 py-3 text-[15px] font-medium text-background transition-opacity duration-[var(--duration-state)] hover:opacity-85"
              >
                Start building
              </button>
              <button
                type="button"
                onClick={navigateToAdmin}
                className="rounded-full border border-[var(--gray-alpha-400)] px-7 py-3 text-[15px] font-medium text-foreground transition-colors duration-[var(--duration-state)] hover:bg-[var(--gray-alpha-200)]"
              >
                Browse catalogs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Footer ————— */}
      <footer className="border-t border-[var(--gray-alpha-300)]/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground">
          <p>© 2026 Resume &amp; CV Builder · Local only — drafts stay in your browser</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={navigateToAdmin}
              className="transition-colors duration-[var(--duration-state)] hover:text-foreground"
            >
              Manage catalogs
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { THEME_KEY } from '@/shared/theme/theme-context'
import { useDocumentStore } from '@/modules/document'
import { editorSections } from '@/modules/editor'
import { LandingPage } from '@/modules/landing'
import { AtsCheckerPage } from '@/modules/ats-check'
import { DocTypeSelector } from '@/app/DocTypeSelector'
import { BuilderLayout } from '@/app/BuilderLayout'
import { PdfPageViewer } from '@/modules/pdf'
import { TemplateGallery } from '@/modules/gallery'
import { scrollToFormSection } from '@/shared/lib/scrollToSection'

/*
 * Accessibility over every screen, in the light and the dark theme (WCAG 2.2 AA tags).
 * jsdom has no layout or computed colour, so the colour-contrast rule cannot run here: contrast is proven
 * from the tokens in src/shared/ui/design-system.test.ts and re-checked in a real browser.
 */

// axe over a whole screen is slow, especially when the suite runs in parallel.
vi.setConfig({ testTimeout: 60_000 })

// Thumbnails are real PDFs; a stub keeps the gallery test about structure, not about react-pdf under jsdom.
vi.mock('@/modules/pdf', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/pdf')>()),
  generatePdf: async () => new Blob(['x']),
}))
// The live preview is an iframe of a generated PDF; the toolbar and editor are what we check here.
vi.mock('@/modules/preview', () => ({
  PreviewPanel: () => <div role="region" aria-label="Preview placeholder" />,
}))

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function violationsIn(container: HTMLElement): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: TAGS },
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`,
  )
}

/** Opens every editor section, the way a user who scrolls through the whole form does. */
async function openEverySection() {
  const sections = editorSections(useDocumentStore.getState().document!)
  act(() => {
    for (const id of sections) scrollToFormSection(id)
  })
  for (const id of sections) {
    await waitFor(() =>
      expect(document.querySelector(`#form-section-${id} [data-slot="accordion-trigger"]`)).toHaveAttribute('aria-expanded', 'true'),
    )
  }
}

const screens: { name: string; element: () => React.ReactElement; setup?: () => void }[] = [
  {
    name: 'landing',
    element: () => <LandingPage onStart={() => {}} />,
  },
  { name: 'chooser', element: () => <DocTypeSelector onBack={() => {}} /> },
  {
    name: 'builder',
    element: () => <BuilderLayout onHome={() => {}} />,
    setup: () => useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate'),
  },
  { name: 'ATS checker', element: () => <AtsCheckerPage onHome={() => {}} /> },
]

describe.each(['light', 'dark'] as const)('accessibility in the %s theme', (theme) => {
  beforeEach(() => {
    window.localStorage.clear()
    window.localStorage.setItem(THEME_KEY, theme)
    window.matchMedia = vi.fn().mockReturnValue({
      matches: theme === 'dark',
      addEventListener: () => {},
      removeEventListener: () => {},
    })
  })
  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it.each(screens)('has no axe violation on the $name screen (AC-12, AC-13)', async ({ element, setup }) => {
    setup?.()
    const { container } = render(
      <ThemeProvider>
        {element()}
      </ThemeProvider>,
    )
    expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark')
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no axe violation on the builder with every editor section open (AC-12, AC-13)', async () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    const { container } = render(
      <ThemeProvider>
        <BuilderLayout onHome={() => {}} />
      </ThemeProvider>,
    )
    await openEverySection()
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no axe violation in the open Sections popover (AC-12, AC-13)', async () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    render(
      <ThemeProvider>
        <BuilderLayout onHome={() => {}} />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /^Sections/ }))
    await screen.findByText('Reorder and choose what shows in the PDF.')
    // The popover renders in a portal, so check the whole document.
    expect(await violationsIn(document.body)).toEqual([])
  })

  it('has no axe violation on a blank builder with the first-run guide (AC-17)', async () => {
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    const { container } = render(
      <ThemeProvider>
        <BuilderLayout onHome={() => {}} />
      </ThemeProvider>,
    )
    expect(screen.getByRole('region', { name: 'Getting started' })).toBeInTheDocument()
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no axe violation with the export fix list open (AC-17)', async () => {
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    const { container } = render(
      <ThemeProvider>
        <BuilderLayout onHome={() => {}} />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    await screen.findByRole('region', { name: 'What to fix before exporting' })
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no axe violation in the canvas PDF viewer (AC-17)', async () => {
    const { container } = render(
      <ThemeProvider>
        <PdfPageViewer blob={new Blob(['x'])} />
      </ThemeProvider>,
    )
    expect(await violationsIn(container)).toEqual([])
  })

  it('has no axe violation in the open template gallery (AC-12)', async () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    render(
      <ThemeProvider>
        <TemplateGallery open onOpenChange={() => {}} />
      </ThemeProvider>,
    )
    await screen.findByRole('radiogroup', { name: 'Template' })
    expect(await violationsIn(document.body)).toEqual([])
  })
})

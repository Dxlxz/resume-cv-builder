# F-002 — Remove AI, redesign on shadcn/ui and ReUI

**Status:** Ready for Dale (not committed) · **Class:** L2 / U4 · **Owner:** Dale · **Closed:** (set at closure — see tasks.md)

## User, problem, and outcome

A job seeker builds a resume or CV in Rizzume. The chrome is styled by a private design system (UDS) vendored
into the repo, is light-only, and uses hand-written primitives; the app also carries an AI assistant (Idrizz)
that Dale no longer wants. Outcome: the AI feature is gone, and every screen (landing, chooser, builder, ATS
checker) is rebuilt on shadcn/ui and ReUI components under one token set, in light and dark, following the Gold
Standard's accessibility, forms, layout and anti-slop rules. The resume PDF is unchanged.

## In scope

- Remove the AI feature (T0): the `ai` module, `/api/ai` and its dev proxy, edit-plan code, chat and guide state,
  the section-guide UI, `react-markdown`, env typings, docs.
- shadcn `radix-nova` foundation: tokens, theme provider and toggle, canonical components in `src/shared/ui/`.
- ReUI items `alert`, `badge`, `stepper`, `sortable`, `scrollspy`.
- Redesign of the landing page, the chooser, the builder (top bar, editor, preview, dialogs) and the ATS checker.
- Retire UDS and the old primitives; add checks that keep them gone.
- Decision record [shadcn-reui-design-system.md](../../../docs/decisions/shadcn-reui-design-system.md).

## Non-goals

- No change to the document schema, layout engine, PDF output, ATS rules, persistence format or module map
  structure (only the removed `ai` module leaves it). The inert `meta.sectionGuides` field stays in the schema so
  saved drafts and JSON imports keep loading (debt D-003).
- No new feature, route or copy beyond what the redesign needs.
- No form library: the document store stays the single owner of field state.
- No ReUI `phone-input`, `date-selector`, `data-grid` or `filters`.
- The in-progress cover-letter feature keeps its behavior; its form markup (`LetterForm.tsx`) is restyled with the rest.

## Actors, permissions, and business rules

One actor, the browser user; nothing leaves the browser. Theme choice is a per-viewer convenience: stored in
`localStorage`, wrapped in try/catch, default follows the operating system.

## Primary flow, and edge, failure and recovery behaviour

Landing → chooser (preset, then type, then start) → builder (edit, preview, check, export) → optional ATS checker.
Edge: `localStorage` unavailable → the theme falls back to the system setting and the app still renders.
Recovery: each slice is reverted with `git checkout` of its files; nothing is committed until a slice is green.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | After T0, no file in `src/`, `packages/`, `vite.config.ts` or `package.json` shall reference Idrizz, `/api/ai` or `react-markdown`. | `src/shared/ui/design-system.test.ts` | the test scans `src/`; grep of `packages/`, `vite.config.ts`, `package.json` returns no hit; the test failed on a planted reference | Pass |
| AC-2 | `components.json` shall declare style `radix-nova` and the `@reui` registry. | `src/shared/ui/design-system.test.ts` | 1 test | Pass |
| AC-3 | Every component file in `src/shared/ui/` shall have a provenance entry in `MANIFEST.json`. | `src/shared/ui/design-system.test.ts` | 4 tests; it caught my own missing `radio-group` entry | Pass |
| AC-4 | No file outside `src/shared/ui/` shall import `radix-ui` or `@radix-ui/*`. | `src/shared/ui/design-system.test.ts` | 1 test | Pass |
| AC-5 | No file in `src/` shall use a UDS-only token utility (`status-*`, `badge-*`, `header`, `overlay-surface`, `primary-hover`, `shadow-raised`, `duration-state`). | `src/shared/ui/design-system.test.ts` | passes on the tree; fails on a planted `bg-status-danger` (the first version of the regex held backspace characters and missed it; fixed) | Pass |
| AC-6 | The repository shall not contain `packages/styles/src/uds/` or `scripts/sync-uds.mjs`. | `src/shared/ui/design-system.test.ts` | both deleted; 1 test | Pass |
| AC-7 | The light and dark themes shall each define every semantic token, including `info`, `success`, `warning` and `invert`. | `src/shared/ui/design-system.test.ts` | 2 tests over 31 tokens | Pass |
| AC-8 | Every foreground and background token pair shall have a contrast ratio of at least 4.5:1 in the light theme. | `src/shared/ui/design-system.test.ts` | 1 test; fails when `muted-foreground` is lightened | Pass |
| AC-9 | Every foreground and background token pair shall have a contrast ratio of at least 4.5:1 in the dark theme. | `src/shared/ui/design-system.test.ts` | 1 test | Pass |
| AC-10 | When the user picks a theme, the app shall add or remove the `dark` class on `html` and store the choice. | `src/shared/theme/ThemeProvider.test.tsx` | 3 tests (pick, system follow, restore) | Pass |
| AC-11 | If `localStorage` throws, then the app shall render with the system theme. | `src/shared/theme/ThemeProvider.test.tsx` | 1 test | Pass |
| AC-12 | Each screen (landing, chooser, builder, ATS checker) shall have no axe violation in the light theme. | `src/test/a11y.test.tsx` and axe in the real browser | 6 jsdom tests incl. the builder with every section open and the Sections popover; browser axe with colour contrast: landing, chooser steps 1 and 2, builder, builder with the ATS dialog open, ATS checker: 0 violations | Pass |
| AC-13 | Each screen shall have no axe violation in the dark theme. | `src/test/a11y.test.tsx` and axe in the real browser | same screens and counts in the dark theme: 0 violations | Pass |
| AC-14 | At a 320 px viewport width, each screen shall not scroll horizontally. | browser: `document.documentElement.scrollWidth` at 320 px on each screen | landing, chooser steps 1 and 2, builder (edit and preview tabs), ATS checker all 320 of 320; three overflow bugs found and fixed on the way | Pass |
| AC-15 | When a section is reordered by keyboard in the editor, the new order shall appear in the document. | `src/modules/editor/SectionList.test.tsx` | 4 tests; the move buttons are focusable and operate by keyboard | Pass |
| AC-16 | When `pnpm test` runs, every baseline test shall pass except the 3 baseline failures in `coverLetter.test.ts`. | `pnpm test` vs the T0 baseline (221 passed, 3 failed) | 262 passed (221 plus 41 new), the same 3 failed | Pass |
| AC-17 | When `pnpm run modules:check` and `pnpm run lint` run, both shall exit 0. | both commands | both exit 0 | Pass |
| AC-18 | When `pnpm run build` runs, it shall exit 0. | `pnpm run build` | built in 1.21 s | Pass |
| AC-19 | When `pnpm run build` runs, the scripts that `index.html` loads at startup (the entry chunk and the chunks it preloads) shall total at most 575 kB (T0 entry chunk 574.85 kB). | `pnpm run build`, summing the scripts referenced by `dist/index.html` | 507.08 kB (entry chunk 20 kB); the builder route adds 177.67 kB when opened; the builder, chooser and ATS checker are lazy-loaded. Reworded from "entry chunk at most 632 kB" because splitting the routes removes most code from the entry chunk | Pass |
| AC-20 | When the ATS proof suite runs, the generated PDFs shall be unaffected by the redesign. | `pnpm test packages/validators` | ATS proof suite passes inside the full run; no file under `packages/` changed in this feature except removing the unused UDS CSS | Pass |
| AC-21 | At 375, 768 and 1440 px, in light and dark, each screen shall render the redesigned layout with no overlapping or clipped control. | browser screenshots per screen, viewport and theme | viewed: 1440 light (landing, chooser both steps, builder), 1440 dark (landing, builder, ATS dialog), 768 light (builder, ATS checker), 375 dark (landing, builder). Not viewed: 375 light, 768 dark, chooser at 375 and 768, ATS checker in dark; those have axe and 320 px reflow results only | Partial |

Excluded, and residual risk: axe in jsdom cannot evaluate colour contrast, so AC-8 and AC-9 compute it from the tokens and
the browser axe run measures it on the rendered pages; the embedded browser PDF viewer keeps its own chrome and ignores
the theme; AC-21 is only partly covered by screenshots (see its row); the 3 baseline failures are the in-progress
cover-letter feature; two React `flushSync` console errors predate this work and are queued as a separate task.

## Risks and assumptions

- Assumption: the shadcn CLI (4.21.3) resolves `@/*` from the root `tsconfig.json` (verified in a scratch copy).
- Risk: removing UDS breaks any class that has no shadcn equivalent. Mitigation: a temporary compat token layer
  during the slices, deleted in the last slice, and AC-5 forbids leftovers.
- Risk: `radix-ui` and `lucide-react` grow the startup JavaScript. Mitigation: route-level lazy loading and AC-19.
- Risk: shadcn files use lowercase names while the repo used PascalCase; Windows is case-insensitive and Vercel is
  not. Mitigation: old files are deleted before new ones are added and every import is rewritten to the new case.
- Risk: removing AI deletes about 43 tests of deleted code; the T0 baseline replaces the old one.

## Scope Lock

- **Approved by:** Dale, in session — "NOW REDESIGN THE WHOLE APP. MUST USE SHADCN UI AND REUI! APPLY GOLD
  STANDARD" and "REMOVE AI IN THE FEATURE"; choices: Adopt shadcn defaults, Add dark mode, Phased slices.
- **Date:** 2026-10-07
- **Branch:** feat/templates-ats-interop (working tree also holds Dale's uncommitted cover-letter work)
- **Deferred candidates:** ReUI `phone-input` for Malaysian numbers; density toggle; RTL.

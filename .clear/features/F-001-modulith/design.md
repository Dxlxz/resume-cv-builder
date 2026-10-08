# F-001 — Design

## Understand — measured, not recalled

| Claim the design relies on | Where it was stated | Measured how | Result |
| --- | --- | --- | --- |
| Packages are "strict module boundaries" | docs/architecture.md §1.4 | import graph of production files under `packages/` (script in the F-001 evidence) | **false**: cycles layout↔render, render↔templates, render↔styles, templates↔layout, templates↔styles |
| `src/` has module boundaries | docs/architecture.md §2 | import graph of `src/` | **false**: `store↔lib/storage`, `store↔features/ai`, `components/ui → store, features/ai` |
| Cycle-forming code is pure and movable | — | read each cycle edge: `layoutProfiles`, `spacingHelpers`, `blockVariants`, `pdfFontStyle` import only `@rb/themes`/`@rb/styles` types; `blockHints`, `headerMetaLines` import only `layout/pdfLayoutContext`/`styles` | true |
| `vi.mock` survives a file move | assumption | test run after the move | verified at T2/T4 |
| Entry chunk baseline | build output 2026-10-07 | `pnpm run build` | `index` 701.49 kB, `pdf` 482.27 kB, `renderDocumentToPdf` 1,435.59 kB |
| Test baseline | test output 2026-10-07 | `pnpm test` | 246 passed, 3 failed (`coverLetter.test.ts`, in-progress feature) |

## References

- **Self review:** independent review (fresh agent) at closure, against this design and the spec.
- **Gold standard:** not applicable — no resume content, layout or export behavior changes.
- **Industry / competitor:** not required — enforces a decision already recorded (architecture.md §1.4); no new pattern.

## Packages — target dependency order (each may import only packages to its left)

`core` → `themes` → `presets` → `styles` → `layout` → `render` → `templates` → `pipeline`;
`catalog` (core), `fixtures` (core), `validators` (top: may import `core`, `themes`, `presets`, `styles`, `layout`, `catalog`).

| Moves out of | To | What | Why |
| --- | --- | --- | --- |
| `templates/shared` | `styles` | `layoutProfiles.ts`, `spacingHelpers.ts` (+ test) | pure style data and helpers used by `styles`, `layout`, `render` |
| `render/blocks` | `styles` | `blockVariants.ts` (+ test) | `styles` needs `headerBandPaddingPt` |
| `render/fonts` | `styles` | `pdfFontStyle.ts` | `styles` needs the font style helpers |
| `templates/shared` | `render/blocks` | `blockHints.ts`, `headerMetaLines.tsx` | block-level PDF pieces used by `LayoutBlockPdf` |
| `layout/measure` | `render/measure` | `measureLayout.ts`, `MeasureRenderer.tsx`, `pxToPt.ts` | DOM measurement renders the HTML block; `layout` stays pure |
| `layout` | `pipeline` | `computeLayoutPlan.ts` | orchestrates compile + measure + plan |
| `render` | `pipeline` | `renderDocumentToPdf.tsx`, `reactPdfBackend.tsx` | dispatches to the template PDFs, so it sits above `templates` |
| `catalog/lint` | `validators` | `catalog-lint.ts` (+ test) | it returns `validators`' `LintIssue`; this breaks the `catalog` ↔ `validators` cycle |

Consumers update their imports (`@rb/layout/computeLayoutPlan` → `@rb/pipeline/computeLayoutPlan`, and so on).

## Application — modules under `src/`

`src/modules/<name>/index.ts` is the only door; `src/shared/**` is open to all; `src/app/` composes.

| Module | Holds | May import |
| --- | --- | --- |
| `shared` | UI primitives, `useMediaQuery`, `useAppRoute`, `AppShell`, `utils`, `scrollToSection` | — |
| `pdf` | `generatePdf`, `download`, `countPdfPages`, `pdfjsClient`, `renderPdfWithPdfJs` | shared |
| `document` | `documentStore`, draft persistence, JSON import/export, AI edit-plan application, schema test | shared |
| `catalog` | catalog pickers, `useCatalogBundle` | document, shared |
| `editor` | editor panel, section list, forms, `FormSection`, `sectionStatus` | document, catalog, ai, shared |
| `preview` | preview panel/shell, `PdfJsPreview`, `usePdfPreview` | document, pdf, shared |
| `toolbar` | toolbar, lint panel, PDF preview modal | document, pdf, shared |
| `landing` | landing page and sections, sample PDF | pdf, shared |
| `ats-check` | public ATS checker page | shared |
| `app` | `App`, `BuilderLayout`, `DocTypeSelector`, `RecoveryBanner`, `BrowserGuard` | every module |

Source of truth for both tables: `.clear/architecture/modules.json`; `scripts/check-modules.mjs` reads it.

## Failure and threat analysis

Not L3. Failure mode: a barrel pulls a lazy chunk into the entry chunk — AC-9/AC-10 detect it.

## Decisions

No ADR: nothing here is costly to reverse (files move back with git).

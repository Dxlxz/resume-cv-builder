# F-005 — Four more templates (Executive, Harbor, Slate, Minimal)

**Status:** Review PASS (2026-10-08), not yet committed · **Class:** L2 / U1 · **Owner:** Dale

## User, problem, and outcome

The gallery offered nine templates, most of them variations of one stacked page. Common styles from the template
galleries that job seekers compare against were missing: a dark full-height rail, headings on shaded bars, a formal serif
with dates in a gutter, and an airy minimal page. Outcome: four new templates, our own, built from layout knobs and proven
by the ATS extraction suite. Research: [templates-2026-10-08.md](../../../docs/research/templates-2026-10-08.md).

## In scope

- Template ids `executive`, `harbor`, `slate`, `minimal` (schema enum grows; older drafts still load).
- Layout knobs: decoration `shaded-bar`, `sectionTitleAlign`, `shadedBarPaddingPt`, `sidebarInverse`.
- `executive` pins the serif theme, like `ivy`.

## Non-goals

- No PDFx or other new dependency (see research note). No new theme, font, icon or photo.
- No change to preset-over-template precedence (a preset's resume density still wins).
- No change to existing templates.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | The registry, profiles, schema and renderer shall list the four new ids. | `packages/templates/src/registry.test.ts`, `packages/core/src/schema/templateIds.test.ts` | both pass | Pass |
| AC-2 | A `shaded-bar` title shall have the same tint and padding in the measured HTML and the PDF, readable at AA on every theme. | `packages/styles/src/shared/newTemplateStyles.test.ts` | passes | Pass |
| AC-3 | An inverse rail shall change colours only, and its text shall meet AA on the accent for every theme. | `packages/styles/src/shared/newTemplateStyles.test.ts` | passes (file: 8 tests) | Pass |
| AC-4 | `slate` shall measure each column at the width it draws. | `packages/styles/src/shared/columnGeometry.test.ts` | passes for sidebar, split, slate | Pass |
| AC-5 | Every template shall keep every field of the sample resume, CV and edge case extractable in reading order. | `packages/validators/src/ats-proof/atsProof.test.ts` | 59 passed | Pass |
| AC-6 | The new templates shall raise no error and no TYPE_* lint on the sample resume and CV. | `packages/validators/src/new-templates-lint.test.ts` | passes (14 cases) | Pass |
| AC-7 | Build, lint, modules:check pass; tests pass except the 3 `coverLetter.test.ts` baseline failures. | `pnpm run build`, `pnpm run lint`, `pnpm test` | built; lint clean; 387 passed, 3 failed (coverLetter baseline); no module violations | Pass |
| AC-8 | In the real app, each new template shall render cleanly in the gallery and the preview. | browser | gallery shows 13 thumbnails; Slate (2 pages, rail painted on both), Harbor, Executive, Minimal page 1 viewed via pdf.js | Pass |

## Scope Lock

- **Approved by:** Dale, in session — "Please continue to make the template popualted. there is many styles, go built-in browser and find inspirations andpply into our app. also there is shadcnpdf? should we use it?"
- **Date:** 2026-10-08
- **Branch:** feat/templates-ats-interop
- **Deferred:** a preset that lets a template keep its own density; rail bullet indent for undated items (shared with modern-rail).

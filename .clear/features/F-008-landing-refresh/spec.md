# F-008 — Landing refresh

**Status:** Review PASS (2026-10-08); not committed · **Class:** L2 / U2 · **Owner:** Dale

## User, problem, and outcome

The landing showed 3 of 13 templates, described features as plain text, had no FAQ, and rendered its sample PDFs live,
which with Typst as the engine would download the 7–11 MB compiler on a first visit. Outcome: all 13 templates shown,
three drawn highlights, an FAQ that answers the real ATS questions, and a landing that loads images only.

Reference: Shadcn Studio free blocks (MIT + Commons Clause), used as layout reference only (features grid, FAQ,
social-proof split, statistics strip); no block code or registry was added. Visual direction stays "paper desk"
(F-002 design): no gradients, glass, emoji or stock art; illustrations are drawn from the product.

## In scope

- Pre-rendered previews: `pnpm run landing:previews` renders the hero and one page per template with Typst
  (`scripts/landing-previews.test.ts`, gated) and rasterises them to WebP (`scripts/landing-previews.py`) into
  `public/landing/`.
- Sections: hero (image), facts strip, templates showcase, three highlights with inline-SVG illustrations, more
  features, how it works, FAQ (shadcn accordion), CTA, fuller footer; nav anchors to Templates and FAQ.
- Removed: live sample rendering (`samplePdf.ts`, `ExamplesSection.tsx`, `PdfSkeleton.tsx`).

## Non-goals

- New component registry, analytics, testimonials or invented numbers; copy for other languages.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | When the landing loads, no PDF engine code or WASM shall be fetched. | browser resource list | fresh load and full scroll: 14 landing images, no typst, wasm or react-pdf resource | Pass |
| AC-2 | The landing shall show every template in the registry. | browser; `src/modules/landing/TemplatesShowcase.tsx` maps `TEMPLATE_LIST` | 13 cards seen at 1400 px and 375 px | Pass |
| AC-3 | The landing shall have no axe violation. | `src/test/a11y.test.tsx` | a11y and design-system tests: 36 passed | Pass |
| AC-4 | At 320 px the landing shall not scroll sideways. | browser `scrollWidth` | 320 of 320 | Pass |
| AC-5 | The illustrations shall follow the light and dark themes. | browser screenshots | viewed at 1400 px light and 1100 px dark; paper stays white | Pass |
| AC-6 | Build, lint and modules:check pass; tests pass except the 3 cover-letter baseline failures. | gates | built (startup 480.8 kB, was 504.5); lint and modules clean; 472 passed, 3 failed, 1 skipped (the gated preview renderer) | Pass |

## Scope Lock

- **Approved by:** Dale, in session — "The landing page, how do you think we can improve the design. go to shadcn studio, use it landing page free components?", then "sure. do our own illustration?"
- **Date:** 2026-10-08
- **Branch:** feat/templates-ats-interop
- **Review:** PASS, no must-fix. Applied its notes: a test that every template has a preview image
  (`src/modules/landing/previews.test.ts`), a `<main>` landmark, the illustration page's lines kept inside its height,
  no `type` on anchor buttons, the facts strip as a plain list, the preview script without a shell (vitest via Node,
  `py`/`python3` or `PYTHON`) and stale template images removed before writing. Left as is: "Tagged PDF" names the
  default engine; the react-pdf fallback is untagged.


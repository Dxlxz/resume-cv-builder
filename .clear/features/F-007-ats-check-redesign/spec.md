# F-007 — ATS check redesign: readable vs polish

**Status:** Review PASS (round 2, 2026-10-08); not committed · **Class:** L2 / U2 · **Owner:** Dale
**Research:** [ats-checker-2026-10-08.md](../../../docs/research/ats-checker-2026-10-08.md)

## User, problem, and outcome

The "ATS Check" number (100 − 14·errors − 7·warnings − 2·infos) never read the PDF, and most of what it penalised was
style. Real ATSs do not reject on formatting; what hurts is a PDF a parser cannot read. Outcome: the check says whether
the exported PDF is **ATS readable** (proved by extracting it) and lists **polish tips** separately, with no
style-driven pass/fail number.

## In scope

- Levels mean one thing each: **error** = cannot export (name, email); **warning** = ATS risk (unreadable or missing
  text, wrong reading order, broken words, jobs without dates, personal details, hidden content); **info** = polish tip.
- Every typography, spacing, layout and length rule becomes a tip; duplicate pairs removed.
- Readability proof: the builder extracts its own preview PDF and checks every visible field survives, in order.
- New checks: experience without dates; personal details (marital status, religion, date of birth, age) for Malaysia.
- Metrics: one tip for the document, not one per role. Cover letters skip resume-only rules.
- Malaysia preset: bullet cap 3 → 5.
- UI: badge shows "ATS ready" / risk count plus tip count; the panel groups Must fix, ATS risks, Polish tips.

## Non-goals

- Keyword matching against a job ad; typo checking; changing the public /ats-check page.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | No typography, spacing, layout or length rule shall raise a warning or error. | `packages/validators/src/levels.test.ts` | levels.test.ts passes (5 style rule files; only BULLETS_HIDDEN_BY_PRESET allowed) | Pass |
| AC-2 | The summary status shall depend on errors and warnings only, never on tips. | `packages/validators/src/score.test.ts` | score.test.ts passes (25 tips stay ready) | Pass |
| AC-3 | When the exported PDF loses a visible field, puts fields out of order, or splits a word, the check shall raise an ATS risk. | `packages/validators/src/ats-proof/proveReadable.test.ts` | proveReadable.test.ts passes (an added role is reported once as PDF_TEXT_MISSING) | Pass |
| AC-4 | Hidden sections and bullets cut by the preset cap shall not count as lost text. | `packages/validators/src/ats-proof/proveReadable.test.ts` | proveReadable.test.ts passes (hidden sections; 8 bullets under the cap of 5) | Pass |
| AC-5 | A role without a start date shall raise an ATS risk. | `packages/validators/src/ats-lint.test.ts` | ats-lint.test.ts passes | Pass |
| AC-6 | On the Malaysia preset, a labelled marital status, religion, date of birth or age shall raise an ATS risk. | `packages/validators/src/regional/malaysia.test.ts` | malaysia.test.ts passes (5 labelled cases flagged; race-day, page 12, average age ignored) | Pass |
| AC-7 | Missing metrics shall raise at most one tip for the document. | `packages/validators/src/ats-lint.test.ts` | ats-lint.test.ts passes (one tip for 3 roles) | Pass |
| AC-8 | A cover letter shall raise no empty-section, page-length or metric tip. | `packages/validators/src/ats-lint.test.ts` | ats-lint.test.ts passes | Pass |
| AC-9 | The badge and the panel shall show readable status and tip count, with no 0–100 score; axe-clean in both themes. | `src/modules/toolbar/*.test.tsx`, `src/test/a11y.test.tsx` | Toolbar.test.tsx, LintPanel.test.tsx and a11y.test.tsx pass; app shows "ATS ready", 0 to fix, 0 ATS risks, 6 tips | Pass |
| AC-10 | Build, lint and modules:check pass; tests pass except the 3 cover-letter baseline failures; seen working in the app. | gates, browser | tsc, lint, modules:check clean; built; 463 passed, 3 failed (coverLetter baseline); seen in the app at 1400 px | Pass |
## Scope Lock

- **Approved by:** Dale, in session — "ATS CHECKER TU BETULKAH? TERLALU RIGID BARANGKALI? RESEARCH", then "yes build it".
- **Date:** 2026-10-08
- **Branch:** feat/templates-ats-interop
- **Found in passing:** the catalog near-match rule called any skill containing the letter "r" close to the language R (substring rule). Fixed with edit distance and a stricter substring rule; `packages/catalog/src/search.test.ts`.
- **Scope change (2026-10-08):** Dale, in session, during the build: "also find a way to make the render faster natively?".
  Added: with Typst the preview skips the react-pdf measure (plan `null`), a 150 ms debounce for Typst, and flicker-free
  canvas swaps (`src/modules/preview/usePdfPreview.ts`, `src/modules/pdf/PdfPageViewer.tsx`). Consequence: plan-based
  tips (spacing, length, last-page fill, preview drift label) are silent under Typst; D-004 updated.
- **Review:** round 1 FAIL (stale proof, unproved "ATS ready" wording, whitespace bullets, shared-rule tests, plus lows),
  all fixed; round 2 PASS. Found while measuring: `extractPdfText` used Node's `Buffer`, so the proof and the public
  /ats-check page failed in browsers; fixed. Residual: the proof stays "pending" if a document is replaced by one with
  the same `updatedAt`; the raw-data test covers react-pdf output only (Typst is proved in `packages/typst`).


# F-006 — Typst PDF engine

**Status:** Stage 1 done · review PASS (round 2, 2026-10-08); L3 still needs Dale or another model family · **Class:** L3 / U0 · **Owner:** Dale
**Decision:** [typst-engine.md](../../../docs/decisions/typst-engine.md)

## User, problem, and outcome

The react-pdf output had no tagged structure, no title metadata, needed our own page-measuring pipeline and rendered
slowly. Outcome: every PDF is typeset by Typst in the browser, proven by the same ATS suite, with react-pdf as a fallback
until it is retired.

## In scope (stage 1)

- `packages/typst`: layout IR → Typst source for every LayoutProfile knob; WASM compiler wrapper; new module in
  `modules.json` (`typst`, imported by `pipeline`).
- Typst is the default engine; `?engine=react-pdf` opts a browser out; any Typst failure falls back to react-pdf.
- Page counter reads only the page tree's `/Count` (Typst writes an outline `/Count` too).
- New dependencies, pinned: `@myriaddreamin/typst.ts` 0.7.0 and `@myriaddreamin/typst-ts-web-compiler` 0.7.0
  (Apache-2.0). Why the stack did not cover it: react-pdf cannot write tagged PDFs or typeset with Typst's quality.

## Non-goals (stage 1)

- Removing react-pdf, the measure → plan pipeline or the plan-based lints (stage 3).
- Fixing cover letters: they compile to no body because `isSectionEmpty` has no `letter` case
  (`packages/core/src/schema/shared.ts:97`, Dale's uncommitted work); this is the 3 baseline failures, engine-independent.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | Every template rendered by Typst shall keep every resume, CV and edge-case field extractable in reading order. | `packages/typst/src/typst.test.ts` | 39 ATS cases pass (13 templates × 3 documents) | Pass |
| AC-2 | User text and document metadata (title, author, keywords, language) shall never be read as Typst markup or code. | `packages/typst/src/typst.test.ts` | literal-characters and language-escaping tests pass; security review APPROVE | Pass |
| AC-3 | A line shall never break after an in-word hyphen. | `packages/typst/src/typst.test.ts` | unit test passes; the narrow-rail ATS cases failed before the fix ("in- house") | Pass |
| AC-4 | The PDF shall be tagged, with a language, a title and embedded fonts. | `packages/typst/src/typst.test.ts` | passes | Pass |
| AC-5 | Typst shall be the default engine, and a browser shall be able to opt out. | `src/modules/pdf/pdfEngine.test.ts` | passes; real app with no flag renders "Typst 0.14.2", tagged, "2 pages" | Pass |
| AC-6 | When Typst fails, the user shall still get a PDF, with Typst tried once per render. | `src/modules/pdf/typstFallback.test.ts` | passes (one warning) | Pass |
| AC-7 | The page count shall read the page tree, not an outline /Count. | `src/modules/pdf/countPdfPages.test.ts` | passes; old logic returns 8 (expects 2) and 1 on a nested dict (expects 3) | Pass |
| AC-8 | Startup scripts shall stay at most 520 kB and contain no Typst code. | `pnpm run build`, scripts in `dist/index.html` | 503.4 kB, no typst/wasm reference | Pass |
| AC-9 | Build, lint and modules:check pass; tests pass except the 3 cover-letter baseline failures. | `pnpm run build`, `pnpm run lint`, `pnpm test` | built; lint clean; no violations; 444 passed, 3 failed (coverLetter baseline) | Pass |
| AC-10 | Each template shall look right through Typst, long items on rail templates included. | rendered contact sheets of all 13 (resume, CV); a 30-bullet item on modern-rail | reviewed; fixed raised hyphenated words, education on one line, rail lead-in of a long item | Pass |
| AC-11 | The preview shall draw the exported PDF on canvas in every browser, with zoom, a current-page indicator and an Open-in-viewer link; `?pdf=native` shall restore the browser viewer. | `src/modules/preview/preview-export-parity.test.tsx`, `src/modules/pdf/preferCanvasPdf.test.ts` | both pass; real app at 1400 px (Fit, 150%, Page 1 → 2 of 2 on scroll) and at 375 px viewed | Pass |

## Failure analysis and recovery (L3)

- WASM not fetched (offline first use, blocked, host misconfigured): Typst throws, react-pdf renders; console warning.
- Typst compile error from unexpected content: same fallback. Content cannot inject code (AC-2).
- First-use download 7–11 MB compressed: preview waits on first use only; host must compress `.wasm`.
- Recovery: `?engine=react-pdf` per browser; flip the default in `src/modules/pdf/pdfEngine.ts`; remove
  `packages/typst` and its `modules.json` entry to roll back completely.

## Scope Lock

- **Approved by:** Dale, in session — "ok" (trial), then "okay i can see clearly typst better", "so fully adopt typst"; canvas preview: "PLEASE, I WANT TO TRY".
- **Date:** 2026-10-08
- **Branch:** feat/templates-ats-interop
- **Review:** round 1 FAIL (rail lead-in, language escaping, plus mediums), all fixed; round 2 PASS; security review APPROVE. Residual: a WASM hang that never yields cannot be timed out on the main thread (move the compiler to a Worker in stage 3); `blockSource` is ~80 lines.
- **Deferred:** stage 2 (per-template visual parity sign-off, CV contact sheet), stage 3 (retire react-pdf and the plan).

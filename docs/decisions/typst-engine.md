# Typst PDF Engine Decision

**Date:** 2026-10-08 · **Decided by:** Dale, in session · **Status:** Accepted
**Supersedes:** [layout-engine.md](layout-engine.md) (react-pdf with a measure → plan → hints pipeline)

## Decision

Rizzume renders PDFs with **Typst** (the open-source typesetter, Apache-2.0), compiled in the browser by
`@myriaddreamin/typst.ts` 0.7.0 (Typst 0.14.2, Apache-2.0). A new package, `packages/typst`, translates the same
layout IR the react-pdf engine draws into Typst source; every template is a set of LayoutProfile knobs and the
translator mirrors each knob, so all 13 templates render through Typst. react-pdf stays as an automatic fallback
(Typst failed or the browser opted out with `?engine=react-pdf`) until it is retired.

Dale's instruction, after a side-by-side trial: "okay i can see clearly typst better" then "so fully adopt typst".

## Why

| Measured (2026-10-08) | react-pdf | Typst |
| --- | --- | --- |
| Warm render of the sample resume | 107–512 ms (plus DOM measuring) | 6–13 ms |
| Embedded fonts | valid in browser exports | valid |
| Tagged PDF (structure tree, /Lang, bookmarks) | no | yes |
| Title and author metadata | no | yes |
| ATS proof, 13 templates × resume, CV, edge cases | pass | pass (39 cases) |
| Pagination | our own measure → plan pipeline | Typst's own, two columns included |

## Cost and how it is contained

- The compiler is a 28.3 MB WASM file (10.9 MB gzip, about 7.2 MB brotli). It is a separate asset fetched only when a
  PDF is first rendered; startup scripts stay at 503 kB (budget 520 kB) and contain no Typst code.
- Hosting must serve `.wasm` compressed (gzip or brotli) and cacheable; otherwise the first preview downloads 28 MB.

## Rules

- User text reaches Typst only as string literals (`typstString` / `typstText`), never as markup, so resume content
  cannot change formatting or run Typst code. A test prints markup and code characters and asserts they come out
  literally.
- Hyphenation and justification stay off, and a token with an in-word hyphen is an unbreakable box, because a line
  break after a hyphen splits the word for a text extractor ("in- house").
- Only our embedded families (Carlito, Source Serif 4) are loaded; Typst's default font download is disabled, so the
  output never depends on a CDN.

## Consequences and next steps

- Stage 2 (open): visual parity review of every template against its react-pdf version; lints that read the measured
  plan (page count, spacing) still use the react-pdf plan.
- Stage 3 (open): retire react-pdf and the measure → plan pipeline once nothing reads it; that removes the
  1.4 MB react-pdf chunk.
- Recovery: `?engine=react-pdf` per browser today; reverting the default is one line in `src/modules/pdf/pdfEngine.ts`.

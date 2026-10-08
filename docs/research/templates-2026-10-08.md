# Template styles research — 2026-10-08

**Reader:** whoever designs a Rizzume template · **Answers:** which common styles we still lacked, and whether PDFx helps.

Builds on [ats-templates-2026-10-07.md](./ats-templates-2026-10-07.md). Method: the in-app browser on FlowCV's public
template gallery (flowcv.com/resume-templates); GitHub and getpdfx.dev for PDFx.

## Styles seen that we lacked

| Pattern (gallery examples) | Our template | Notes |
| --- | --- | --- |
| Full-height dark rail, white name and contact (Atlantic Blue) | `slate` | colours only; reading order as `sidebar` |
| Heading text centered on a light shaded bar (Steady Form, Anna Field) | `harbor` | a fill, not a table or image |
| Serif, dates in a left column (Executive, Mercury Flow) | `executive` | single column, like modern-rail |
| Plain, airy, large name, no rules (Simple category) | `minimal` | |

Not taken: photos, icons, star ratings for skills (Mercury Flow, Executive) — they fail the gold standard's no-graphics
rule for core content.

## PDFx ("shadcn for PDFs")

github.com/akii09/pdfx, MIT, about 1.2k stars, copy-and-own components on @react-pdf/renderer (heading, text, badge,
table) with invoice and report blocks; no resume blocks. Decision: do not adopt. We already render with
@react-pdf/renderer through our own block renderer, whose measure-and-plan pagination, column geometry and ATS
extraction suite are the product; generic components would bypass all three. Revisit only for a non-resume document
(for example an invoice-like export) if one is ever in scope.

# Layout Engine Decision

**Date:** 2026-06-11  
**Decision:** Stay on `@react-pdf/renderer` v1 with a **measure → plan → hints** pipeline.

## Context

Spacing tokens and PDF.js preview parity were necessary but insufficient. react-pdf’s Yoga layout does not mirror CSS margins or line metrics, so we added a bbox layout engine in `src/layout/`.

## v1 architecture

```
ResumeDocument
  → compileLayout (IR)
  → measureLayout (hidden DOM bboxes)
  → planPages (pagination + widow rules)
  → buildBlockPdfHints
  → generatePdfWithPlan → LayoutBlockPdf walker (hints)
  → PDF iframe preview + layout inspector (plan-only debug)
```

## Why not Forme (yet)

| Criterion | react-pdf + layout engine | Forme |
|-----------|---------------------------|-------|
| Bundle / deps | Already shipped | New dependency + migration |
| Template investment | Existing JSX templates | Rewrite |
| ATS text PDF | Proven | Promising, less battle-tested here |
| Debug overlays | Custom SVG on preview | Built-in (future advantage) |
| Time to fix spacing | Days | Weeks |

**v2 candidate:** Re-evaluate Forme when we need Knuth–Plass paragraph breaking, native page boxes, or DOCX parity from the same IR.

## Definition of done (v1)

- [x] Measured bboxes per block
- [x] Page plan before PDF render
- [x] PDF page count within ±1 of plan
- [x] Layout debug overlay toggle
- [x] Layout lint rules wired to ATS check
- [x] ATS Strict consumes block hints

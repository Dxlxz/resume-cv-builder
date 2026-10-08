> **Superseded on 2026-10-07** by [shadcn-reui-design-system.md](shadcn-reui-design-system.md): the chrome now
> has a light and a dark theme. Kept for history.

# Light-Only Chrome Decision

**Date:** 2026-08-22
**Decision:** Rizzume's application chrome stays **light-only**. `.dark` and
`[data-contrast]` token layers remain vendored (they ship in UDS tokens.css)
but are deliberately unused.

## Context

UDS's `tokens.css` vendors light + `.dark` + `[data-contrast]` surfaces. The
README marks dark as "unused for now" — this record makes that a decision, not
an accident, and gives future work a testable bar.

- The product output (resume/CV document) is a **white page**: A4/letter PDFs
  render on white regardless of chrome theme. Dark chrome would frame a
  white document in inverse contrast — a visual-cost tradeoff with no
  document-side benefit.
- Theme surface ≠ document surface. The PDF has its own themes
  (`mono`, `navy-corporate`, `academic-serif`) in `packages/themes` — those
  are document concerns and untouched by this decision.
- Enabling dark would double contrast QA (WCAG AA on dark surface pairs),
  raise token-change risk, and complicate the semantic-token contract — for
  zero user value in a local-first, print-oriented tool.

## Consequences

- **Kept**: `.dark` / `[data-contrast]` layers in the vendored file (staying
  in sync with UDS source costs nothing; a future dark launch reuses them).
- **Banned until re-opened**: `dark:` variants, `[data-contrast]` usage, and
  component-level theme toggles in `src/` feature code.
- **Re-open triggers** (any one): user demand for night-mode chrome, a
  light-sensitive accessibility complaint, or a UDS dark release that the
  sync gate (scripts/sync-uds.mjs) pulls in — each warrants a new ADR update.

## Verification

- `grep -rn "dark:" src/` → no matches in feature code (locked by the
  eslint semantic-token rule if extended later).
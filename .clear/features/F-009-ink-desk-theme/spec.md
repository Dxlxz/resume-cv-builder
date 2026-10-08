# F-009 — Ink desk theme, logo and illustrations

**Status:** Review PASS (round 2, 2026-10-08); not committed · **Class:** L2 / U3 · **Owner:** Dale

## User, problem, and outcome

The theme was shadcn's stock neutral: a pure white page the same white as the resume paper, so the "paper desk"
direction (F-002) only worked inside grey panels, and a colourless dark mode unrelated to the brand blue. The logo was a
generic gradient document icon in colours off the brand hue. Outcome: neutrals tinted toward the brand hue, an off-white
page so the paper lifts, a static paper grain on the desk surfaces only, a new mark, and more drawn illustrations.

Research and options: [background study](https://claude.ai/artifact/CW3W6exVUdZRcQxkvj2Dwg) (option B chosen). Sources:
Radix palette composition (tint greys toward the accent), grain practice (static tile, low opacity, never behind text),
shader costs (battery, motion, shifting contrast).

## In scope

- Tokens (`src/shared/theme/tokens.css`): background, foreground, card, popover, secondary, muted, muted-foreground,
  border and input tinted to hue 264 in both themes; paper stays pure white; light destructive 0.54 → 0.52 L to keep AA
  on its tint over the off-white page.
- `desk-grain` utility: a feTurbulence tile in a data URI (no request, no animation), on the hero desk, template cards,
  illustration panels and the builder's preview desk.
- Logo: page with a folded corner and the Source Serif 4 Bold Italic "r" as a path (OFL), theme tokens in the app,
  matching `public/favicon.svg` with light and dark colours.
- Illustrations: three How-it-works steps; the ATS checker's drop area.

## Non-goals

- Shader or animated backgrounds, duotone, texture behind text, a new font.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | Every foreground and background token pair shall meet WCAG contrast in both themes. | `src/shared/ui/design-system.test.ts` | 16 passed (one failure found and fixed: destructive on its tint 4.43 → passes) | Pass |
| AC-2 | The page background shall differ from the paper so the page lifts in light mode. | browser | light hero: off-white page, tinted desk with grain, white paper | Pass |
| AC-3 | The grain shall sit only on desk surfaces and never animate. | code review of `desk-grain` uses | five uses: hero desk, template cards, highlight and step illustration panels, builder preview desk; the preview's loading text moved onto its own solid pill (`PdfPageViewer.tsx`), so no text sits on grain; static data-URI tile | Pass |
| AC-4 | The mark shall read at 16 px and in both themes. | browser | rendered at 16, 32, 64 and 220 px, light and dark | Pass |
| AC-5 | The new illustrations shall follow both themes. | browser | How it works viewed light and dark; ATS checker covered by a11y test only (pane throttled) | Pass |
| AC-6 | Build, lint and modules:check pass; tests pass except the cover-letter baseline. | gates | built; lint and modules clean; full suite 486 passed, 3 failed (coverLetter baseline), 1 skipped; a first run under load also timed out 3 Toolbar tests, which pass alone and on the rerun | Pass |

## Scope Lock

- **Approved by:** Dale, in session — "The background color or our theme might be wrong? … research", then "sure. but how about you make add on illustration, svg, our own. also make better logo?"
- **Date:** 2026-10-08
- **Branch:** feat/templates-ats-interop
- **Review round 1:** FAIL on evidence (AC-3 miscounted and missed the loading text on grain; AC-6 read before the rerun
  was recorded). Fixed: loading status on a solid surface, `theme-color` split light/dark, grain tiles moved into the
  main theme blocks the token test reads, unused badge field removed, `bg-paper` for preview pages, comment updated.
  Left: contrast-test pairs for inputs on `muted` (no input sits on a desk today).
- **Review round 2:** PASS. Residual: the phone `theme-color` follows the system setting, not the in-app theme toggle.


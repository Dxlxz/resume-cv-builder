# F-002 — Design

## Understand — measured, not recalled

| Claim the design relies on | Where it was stated | Measured how | Result |
| --- | --- | --- | --- |
| shadcn CLI works with this repo | assumption | `shadcn add button` in a scratch copy | needs `@/*` in the root `tsconfig.json` and `ignore-workspace-root-check`; then writes `src/shared/ui/button.tsx` |
| `radix-nova` is the right style | Gold Standard design/37 §1-2 | repo already uses Radix (`@radix-ui/react-*`) | existing Radix app: stay on Radix; CLI preset `nova`, base `radix` |
| ReUI items exist for this style | reui.io registry | `https://reui.io/r/radix-nova/registry.json`: 1,887 items, 79 primitives | `alert`, `badge`, `stepper`, `sortable`, `scrollspy` exist; `sortable` needs the `@dnd-kit/*` packages already installed |
| UDS-only utilities in use | src | script over `theme-inline.css` names vs `src` | `status-danger/warning/success/info(-foreground)`, `badge-*`, `header`, `overlay-surface`, `sidebar(-accent)`, `primary-hover`, `destructive-foreground`; `shadow-raised/menu/modal`, `duration-state`, `ease-*` |
| AI removal baseline | pnpm test | after T0 | 221 passed, 3 failed (`coverLetter.test.ts`); entry chunk 574.85 kB |

## References

- **Self review:** independent review (fresh agent) at the end of every slice that changes behavior, and at closure.
- **Gold Standard** (per `vendor/gold-standard` in earthdata-hub, read in place, not vendored; draft status v0.1.0):
  `hybrid-shadcn-reui` (design/37) — stack, ownership, tokens, §21 primitive containment, §24 manifest, §47 registry review;
  `anti-ai-slop` (design/23) §189 shadcn is the baseline, not the identity; `forms-editors` (design/28) single
  column, error ≠ colour only; `layout-patterns` (design/07) one scroll owner, 320 px reflow, 24 px minimum target;
  `a11y-inclusive` (design/32); `design-tokens`, `theming`, `states-catalogue`, `motion`.
  Resume content rules stay in `docs/RESUME_AND_CV_GOLD_STANDARDS.md` and are untouched.
- **Industry / competitor:** ReUI and shadcn documentation fetched 2026-10-07 (registry, install, `@reui` namespace);
  no competitor study needed because the visual direction below is derived from this product's own context.

## Visual direction (U4) — "paper desk"

The product is a document. The chrome recedes and the paper is the hero. Every choice below is explainable by that.

| Decision | Choice | Why |
| --- | --- | --- |
| Foundation | shadcn `radix-nova`, neutral base, OKLCH, one radius (`0.625rem`) | Dale chose shadcn defaults; nova's compact density suits data entry |
| Brand | one accent, hue 264 (the existing Rizzume blue) as `--primary`; neutral everything else | keeps recognition without a second palette; contrast-checked in both themes |
| Status | ReUI `info`, `success`, `warning`, `destructive` with text + icon, never colour alone | forms-editors §138; one vocabulary for ATS and lint results |
| Type | Geist Variable for UI; Source Serif 4 (already a dependency) for display headings on landing and chooser only | one sans, one display role (hybrid-shadcn-reui §10); the serif echoes the document |
| Builder layout | top app bar · left editor column (section nav with scroll-spy, then forms) · right "desk" with the paper centred on `bg-muted` | desk surface makes the white page read as paper; one scroll owner per pane (layout-patterns) |
| Mobile | tabs Edit / Preview, one pane at a time | already the app's pattern; reflow at 320 px |
| Theme | light, dark, system; toggle in the app bar; the paper stays white in both | document is print-oriented; dark frames it, which is the intended look |
| Motion | shadcn/tw-animate defaults, reduced-motion honoured | motion only for state change |
| Anti-slop | no gradient blobs, glass, emoji, stock illustration; real sample content in previews | anti-ai-slop tells list |

## ReUI use (each justified)

| Item | Where | Replaces |
| --- | --- | --- |
| `alert`, `badge` | ATS score, lint results, banners, section status | hand-built status chips |
| `stepper` | the two-step chooser (preset, then type) | ad-hoc "STEP 2 OF 2" text |
| `sortable` | section reorder in the editor | custom `@dnd-kit` wrapper in `SectionList` |
| `scrollspy` | editor section nav follows scroll | none (new, small) |

## Component map (all in `src/shared/ui/`, kebab-case files, provenance in `MANIFEST.json`)

shadcn: accordion, alert-dialog, button, card, checkbox, collapsible, dialog, dropdown-menu, field, input, label,
native-select, popover, progress, radio-group, separator, sonner, tabs, textarea, tooltip.
ReUI: alert, badge, scrollspy, sortable, stepper. Internal patterns: `brand`, `bullet-list-editor`, `confirm-dialog`,
`empty-hint`, `form-field`, `item-card`, `use-confirm`. Components installed and then not used (`command`, `select`,
`sheet`, `skeleton`, `switch`, `scroll-area`) were removed again so no unreviewed code ships.

## Migration mechanics

- Old files are deleted before shadcn files are added (case-insensitive file system); every import is rewritten
  to the lowercase path in the same slice.
- A temporary `src/shared/theme/legacy-tokens.css` maps the UDS-only names to shadcn/ReUI tokens so every
  slice renders; T5 deletes it and AC-5 proves nothing still needs it.
- Tokens live in `src/index.css`; the Carlito imports and the layout-measure note stay (documents depend on them).

## Failure and threat analysis

Not L3. Registry code is third-party source: each installed file is read before merge (Gold Standard §47); none
makes network calls or uses `dangerouslySetInnerHTML` (checked by grep in T1).

## Decisions

Recorded in [shadcn-reui-design-system.md](../../../docs/decisions/shadcn-reui-design-system.md).

# shadcn/ui + ReUI Design System Decision

**Date:** 2026-10-07 · **Decided by:** Dale, in session · **Status:** Accepted
**Supersedes:** the UDS vendoring contract (the vendored `packages/styles/src/uds/`, deleted) and [light-only-chrome.md](light-only-chrome.md).

## Decision

Rizzume's application chrome is built on **shadcn/ui** (style `radix-nova`, Radix primitives) with **ReUI**
(`@reui` registry) for components shadcn does not provide as primitives. Tokens are shadcn's OKLCH semantic
tokens plus ReUI's `info`, `success`, `warning` and `invert`. The chrome has a **light and a dark theme** that
share one set of token names. The document the user builds (the resume PDF) is unaffected: it has its own
themes in `packages/themes` and always renders on a white page.

Dale's instruction: "REDESIGN THE WHOLE APP. MUST USE SHADCN UI AND REUI! APPLY GOLD STANDARD", then chose
"Adopt shadcn defaults", "Add dark mode" and "Phased slices".

## Why

- UDS was vendored from a private monorepo and needed a sync script; shadcn/ReUI are copy-and-own and need none.
- Dark mode was ruled out only because it doubled contrast QA. The conformance tests in F-002 check contrast for
  every semantic pair in both themes, which removes that cost.
- Gold Standard `hybrid-shadcn-reui` (design/37): an existing Radix application stays on Radix, so the style is
  `radix-nova`, not a Base UI style; hybridize catalogs, not primitive engines.

## Rules (from the Gold Standard, made checkable)

- One canonical component set in `src/shared/ui/`. No second `Button`.
- Only `src/shared/ui/` imports `radix-ui` / `@radix-ui/*` (hybrid-shadcn-reui §21).
- Every file in `src/shared/ui/` has a provenance entry (`origin`: shadcn, reui or internal) in
  `src/shared/ui/MANIFEST.json` (§24).
- Status uses meaning (`variant="success"`), never palette names (§8). Product code uses semantic tokens only.
- Registry code is reviewed like a dependency before it merges (§47); a ReUI item enters only if the app needs it
  (§4, §48). Adopted: `alert`, `badge`, `stepper`, `sortable`, `scrollspy`. Considered and rejected for now:
  `phone-input` (adds a phone-number library), `date-selector` (adds a calendar library), `data-grid`, `filters`.
- shadcn is the implementation baseline, not the visual identity (anti-ai-slop): the direction is recorded in
  [F-002 design](../../.clear/features/F-002-shadcn-reui-redesign/design.md).

## Consequences

- Retired: `packages/styles/src/uds/`, `scripts/sync-uds.mjs`, the UDS motion/shadow tokens and the old `src/shared/ui/*` primitives.
- Kept: the ESLint rule that bans Tailwind palette utilities in JSX (it enforces §8 and §7).
- New dependencies, each needed by an approved component: `radix-ui`, `class-variance-authority`, `cn`,
  `lucide-react`, `tw-animate-css`, `shadcn` (CSS only), `@fontsource-variable/geist`, `sonner`, and `axe-core` (dev, accessibility tests).
- Re-open if shadcn changes its CLI/registry contract incompatibly or a ReUI item the app uses is withdrawn.

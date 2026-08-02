# UDS — vendored styling source

The app chrome is styled with the **Universal Design System** (UDS), Dale's
design-system monorepo at `C:\Users\Dale\Desktop\Universal Design System`
(tokens → CSS → Tailwind bridge → React facade; authority-modern: OKLCH
semantic tokens, 2/6/8 radii, motion tiers, status vocabulary).

UDS packages are private (`workspace:*` deps, CSS-only exports), so this app —
an npm project that must stay self-contained and deployable — **vendors the
two CSS files it needs** instead of installing them.

## Vendored files

| File | UDS source |
|------|-----------|
| `tokens.css` | `packages/tokens/src/tokens.css` (light + `.dark` + `[data-contrast]`) |
| `theme-inline.css` | `packages/tailwind/src/theme-inline.css` (`@theme inline` bridge) |

## Sync procedure

To pick up UDS changes, re-copy from source and re-verify:

```powershell
Copy-Item "..\..\..\Universal Design System\packages\tokens\src\tokens.css" .\tokens.css
Copy-Item "..\..\..\Universal Design System\packages\tailwind\src\theme-inline.css" .\theme-inline.css
npm test
```

## Deliberately NOT vendored

- `.uds-*` component class kit, foundation, motion, themes (this app is a
  React + Tailwind v4 consumer — the bridge utilities cover everything)
- Brand packs (the default blue brand at `--brand-h: 264` is used)
- `@uds/react` facade (the app has its own `components/ui/*` primitives,
  restyled to UDS semantics)

## App-local usage rules (UDS contract)

- Product UI uses **semantic tokens only** (`bg-background`, `text-foreground`,
  `bg-card`, `border-border`, `bg-primary`, `text-muted-foreground`, status
  tokens) — no primitive literals in feature components.
- Controls `rounded-sm` (2px), cards `rounded-md` (6px), large surfaces
  `rounded-lg` (8px). No `rounded-2xl`/`rounded-3xl` chrome.
- Status = text + color (+ icon where meaningful); never color alone, never
  emoji.
- Motion: instant (0ms) / chrome (100–150ms) / popover (200ms) / overlay
  (300ms) via `--duration-*` / `--ease-*`; `prefers-reduced-motion` honored.
- Focus: two-layer `--focus-ring` on `:focus-visible`.
- Dark mode: `.dark` tokens are vendored but unused for now (light-only app).

The document output (resume/CV PDF) has its own themes (`mono`,
`navy-corporate`, `academic-serif`) in `src/themes/` — unrelated to UDS.

# Rizzume

Rizzume is a browser-based resume and CV builder with live preview, templates, auto-save, and PDF export. No account required — drafts are stored in your browser.

## Features

- **Resume & CV** document types with tailored defaults
- **Regional presets** — Malaysia Corporate (ATS-strict, A4) and International Generic
- **Themes** — Monochrome and Navy Corporate accent tokens
- **ATS Check** — lint panel before PDF export (NRIC warning, contact validation, template hints)
- **Structured editor** for contact, summary, experience, education, skills, and projects
- **Live preview** with Classic, Academic, and ATS Strict templates
- **PDF export** via lazy-loaded client-side generation
- **Auto-save** to localStorage (schema v2, migrates v1 drafts)
- **JSON import/export** for backup and portability
- **Section reorder** (drag-and-drop + keyboard buttons) and visibility toggles

## Getting started

```bash
pnpm install
pnpm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server |
| `pnpm run build` | Typecheck + production build |
| `pnpm run preview` | Preview production build |
| `pnpm test` | Run unit tests |
| `pnpm run lint` | Run ESLint |
| `pnpm run modules:check` | Check module boundaries (also runs in `pnpm test`) |

## Package layout

Modular monolith (pnpm workspaces). The document engine is a set of packages under `packages/*`, consumed as TS
source by the application modules in `src/`. Every module declares what it may import in
[`.clear/architecture/modules.json`](.clear/architecture/modules.json); `pnpm run modules:check` (also part of
`pnpm test`) fails on a cycle, an unlisted import, or a deep import into another module.

```
packages/                  — engine, lowest layer first; each package imports only the ones above it in this list
                             (catalog and fixtures use core only; validators sits on top)
  core/        @rb/core      — ResumeDocument, zod schema, migration, selectors, interop, PDF import
  themes/      @rb/themes    — theme tokens: mono, navy-corporate, academic-serif
  presets/     @rb/presets   — document presets (Malaysia corporate, international)
  styles/      @rb/styles    — resolveDocumentStyles, page specs, layout profiles
  layout/      @rb/layout    — compile → plan → hints (pure: no DOM, no PDF)
  render/      @rb/render    — block views, DOM measurement, fonts, RenderBackend contract
  templates/   @rb/templates — template PDFs: classic / academic / ats-strict / modern-rail / banner
  pipeline/    @rb/pipeline  — computeLayoutPlan, renderDocumentToPdf
  catalog/     @rb/catalog   — versioned vocabulary bundles (edited in code)
  fixtures/    @rb/fixtures  — fictional sample documents for tests and demos
  validators/  @rb/validators— ATS lint, regional lint (Malaysia), catalog lint, ATS proof suite
src/
  app/                     — composition root: routing, builder layout
  shared/                  — UI primitives, app shell, hooks, utils
  modules/<name>/          — document · pdf · catalog · editor · preview · toolbar · landing · ats-check
                             (each entered only through its index.ts)
personal/                  — PRIVATE: Dale's profile pack + personal scripts (gitignored, dev-only alias)
```

The app imports packages via the `@rb/*` alias (tsconfig `paths` +
Vite `resolve.alias`); boundaries are enforced by `pnpm run modules:check` and, in the
editor, by ESLint (`no-restricted-imports`, generated from `modules.json`). Shipping builds never bundle `personal/` — a CI
leak check greps the repo and the bundle for personal markers on every push.

## Deploy

**Live demo:** <https://resume-cv-builder-bay.vercel.app/>

Deploy with Vercel (recommended): import this repo at vercel.com/new —
Vite + pnpm are auto-detected (`build: pnpm run build`, output `dist/`),
and the site redeploys on every push to `main`. The same `pnpm run build`
output also serves statically on Netlify, GitHub Pages, or any static host.

## Personal dev scripts

Scripts that regenerate Dale's actual CV/PDFs live in `personal/scripts/`
(private — they import the personal pack and write named PDFs):

```bash
pnpm vitest run personal/scripts   # regenerate CV + resume PDFs, PDF diagnostics
```

They are excluded from CI and from `pnpm test` (see vite.config.ts).

## Styling

The app chrome is built on [shadcn/ui](https://ui.shadcn.com) (style `radix-nova`, Radix primitives) with
[ReUI](https://reui.io) for `alert`, `badge`, `stepper`, `sortable` and `scrollspy`. It has a light and a dark theme
that share one set of OKLCH semantic tokens (`src/shared/theme/tokens.css`); the theme is chosen in the app bar
and follows the operating system by default. The resume PDF is separate: it has its own themes in
`packages/themes` and always renders on a white page.

- Components live in `src/shared/ui/` (lowercase file names). `src/shared/ui/MANIFEST.json` records where each
  came from (shadcn, reui or internal). Add one with `npx shadcn@latest add <name>` or `add @reui/<name>`, review the
  generated code, and add its manifest entry.
- Only `src/shared/ui/` imports `radix-ui`; feature code uses the components.
- Use semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`) and status variants
  (`<Badge variant="success-light">`), never palette utilities; ESLint enforces it.
- Decision and rules: [docs/decisions/shadcn-reui-design-system.md](docs/decisions/shadcn-reui-design-system.md).

## Docs

- **Architecture:** [docs/architecture.md](docs/architecture.md) — full system architecture (DFD, ERD, diagrams)
- Quick reference: [ARCHITECTURE.md](ARCHITECTURE.md)

## Specs & research

- **Doc index:** [docs/README.md](docs/README.md) — architecture, decisions, and references

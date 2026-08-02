# Resume & CV Builder

A browser-based resume and CV builder with live preview, templates, auto-save, and PDF export. No account required — drafts are stored in your browser.

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

## Package layout

Monorepo (pnpm workspaces): the document engine is a set of independently
versioned packages under `packages/*`, consumed as TS source by the thin
app shell in `src/`.

```
packages/
  core/        @rb/core      — ResumeDocument, zod schema, migration, selectors, utils
  layout/      @rb/layout    — compile → measure → plan → lint (no UI, no PDF)
  render/      @rb/render    — RenderBackend contract, react-pdf adapter, block views
  styles/      @rb/styles    — resolveDocumentStyles, page specs, UDS CSS tokens
  templates/   @rb/templates — template contract + classic / academic / ats-strict
  themes/      @rb/themes    — theme tokens: mono, navy-corporate, academic-serif
  validators/  @rb/validators— ATS lint + regional lint (Malaysia)
  presets/     @rb/presets   — document presets (Malaysia corporate, international)
  catalog/     @rb/catalog   — versioned vocabulary bundles, registry, admin logic
  fixtures/    @rb/fixtures  — fictional sample documents for tests and demos
src/                       — app shell: editor, toolbar, preview host, catalog admin UI
personal/                  — PRIVATE: Dale's profile pack + personal scripts (gitignored, dev-only alias)
```

The app shell imports packages via the `@rb/*` alias (tsconfig `paths` +
Vite `resolve.alias`); package boundaries are enforced by ESLint
(`no-restricted-imports`). Shipping builds never bundle `personal/` — a CI
leak check greps the repo and the bundle for personal markers on every push.

## Deploy

**Live demo:** <https://resume-cv-builder-bay.vercel.app/>

Deploy with Vercel (recommended): import this repo at vercel.com/new —
Vite + pnpm are auto-detected (`build: pnpm run build`, output `dist/`),
and the site redeploys on every push to `main`. The same `pnpm run build`
output also serves statically on Netlify, GitHub Pages, or any static host.

## AI assistance (optional)

Three opt-in features: improve the summary, improve a role's bullets, and
tailor the document to a job description (paste the JD, get a summary
rewrite, keywords to add, and bullet suggestions). Nothing is applied
automatically — every suggestion is reviewed, and the first use shows a
consent notice.

AI calls go through a small serverless proxy (`api/ai.ts`) so the API key
never ships in the client bundle. The upstream is OpenCode Go
(`deepseek-v4-flash`); per their policy, inputs are not used for training
and are retained for zero days.

Setup:

```bash
# local dev: copy the example and add your key
Copy-Item .env.example .env.local
```

For production, set `OPENCODE_GO_API_KEY` as a Vercel environment variable.
The key is only ever read server-side; the CI leak check fails any commit
that contains an `sk-` key.

## Personal dev scripts

Scripts that regenerate Dale's actual CV/PDFs live in `personal/scripts/`
(private — they import the personal pack and write named PDFs):

```bash
pnpm vitest run personal/scripts   # regenerate CV + resume PDFs, PDF diagnostics
```

They are excluded from CI and from `pnpm test` (see vite.config.ts).

## Styling

The app chrome follows the **Universal Design System (UDS)** — Dale's
design-system monorepo (`Universal Design System/` on the Desktop). The two
CSS files the app needs are vendored into `packages/styles/src/uds/` (tokens +
Tailwind bridge); see
[`packages/styles/src/uds/README.md`](packages/styles/src/uds/README.md)
for the sync procedure. UI code uses UDS semantic utilities
(`bg-background`, `text-foreground`, `bg-card`, `bg-primary`,
`text-muted-foreground`, status tokens) — no primitive literals.

The document output (resume/CV PDF) has its own themes in
`packages/themes/` (`mono`, `navy-corporate`, `academic-serif`) — unrelated
to the app chrome.

## Docs

- **Architecture:** [docs/architecture.md](docs/architecture.md) — full system architecture (DFD, ERD, diagrams)
- Quick reference: [ARCHITECTURE.md](ARCHITECTURE.md)

## Specs & research

- **Start here:** [`.kiro/README.md`](.kiro/README.md) — canonical spec index
- Research: [`.kiro/research/`](.kiro/research/)

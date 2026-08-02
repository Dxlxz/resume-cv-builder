# Resume & CV Builder — Architecture

> **Quick reference.** Full system architecture (DFD, ERD, flows, module map): [docs/architecture.md](docs/architecture.md)

**Style:** modular monolith (pnpm workspace — engine packages under `packages/*`, thin app shell in `src/`).

## Principle

> **Document → Layout (IR + plan) → RenderBackend → Blob**  
> Preview and debug are thin shells on top. They do not lay out content.

## Bounded contexts

| Module | Package / Path | Responsibility |
|--------|----------------|----------------|
| **core** | `@rb/core` (`packages/core/`) | `ResumeDocument`, schema, migration, selectors, utils |
| **layout** | `@rb/layout` (`packages/layout/`) | Compile IR, measure, plan, lint — **no UI, no PDF** |
| **render** | `@rb/render` (`packages/render/`) | Block views + `RenderBackend` adapters + react-pdf document adapter |
| **styles** | `@rb/styles` (`packages/styles/`) | `resolveDocumentStyles`, page specs, shared style types, UDS CSS tokens |
| **templates** | `@rb/templates` (`packages/templates/`) | Template entrypoints (thin) + shared block layout |
| **themes** | `@rb/themes` (`packages/themes/`) | Theme token definitions |
| **validators** | `@rb/validators` (`packages/validators/`) | ATS lint + regional lint (Malaysia) |
| **presets** | `@rb/presets` (`packages/presets/`) | Document presets |
| **catalog** | `@rb/catalog` (`packages/catalog/`) | Versioned vocabulary bundles + store (admin UI lives in `src/catalog/admin/`) |
| **fixtures** | `@rb/fixtures` (`packages/fixtures/`) | Fictional sample documents (tests, demos) |
| **app** | `src/components/`, `src/hooks/`, `src/renderers/` | Editor, preview host, toolbar, PDF.js preview, download |

**Personal pack:** `personal/` (gitignored, dev-only `@personal/profile` alias). Never imported by packages; shipping builds leave the import external and it rejects at runtime.

## Data flow

```
ResumeDocument
    │
    ▼
compileLayout() ──► LayoutDocument (blocks[])
    │
    ▼
measureLayout() ──► MeasuredLayout (bboxes)
    │
    ▼
planPages() ──► PagePlan + blockHints
    │
    ├─► layout-lint / ATS check
    │
    ▼
RenderBackend.render(layout, plan, styles) ──► Blob
    │
    ├─► PreviewHost (iframe — output only)
    └─► Export / download
```

## Layout IR is the single structure

Every vertical rhythm value is on the **block**:

- `spacingBeforePt` / `spacingAfterPt`
- `breakPolicy`
- Typed `content`

**Measure** and **PDF** both walk `layout.blocks[]` via shared block components:

- `LayoutBlockHtml` — DOM measure
- `LayoutBlockPdf` — react-pdf paint

Templates (e.g. ATS Strict) only choose **which compiler** runs and page size — not parallel JSX trees.

## Spacing rules

| Layer | Role |
|-------|------|
| `LayoutProfile` | Semantic intent (`nameToMetaPt`, `ruleToFirstSectionPt`, …) |
| `compileLayout` | Assign per-block spacing |
| Block renderers | Apply spacing once (`blockWrapperStyle`) |
| `resolveDocumentStyles` | Typography + colors; **section titles have `marginTop: 0`** (IR owns gaps) |
| react-pdf hints | Pagination only (`break`, `wrap`, `minPresenceAhead`) |

## Preview vs debug

| Feature | Correct model |
|---------|----------------|
| Live preview | iframe of PDF blob — WYSIWYG |
| Layout debug | **Inspector + schematic** from `LayoutPlanResult` — never pixel-synced to iframe |
| Parity CI | `plan.pageCount` ≈ `countPdfPages(blob)` |

## RenderBackend (v1 / v2)

```typescript
interface RenderBackend {
  id: string
  render(input: RenderInput): Promise<Blob>
}
```

- **v1:** `reactPdfBackend` — `@react-pdf/renderer` + block walker
- **v2 candidate:** Forme adapter — same `RenderInput`, swap backend

See [ENGINE_DECISION.md](./ENGINE_DECISION.md).

## Anti-patterns (avoid)

1. Parallel render trees (duplicate HTML preview + MeasureRenderer + PDF blocks — HTML preview removed)
2. Spacing margins on both IR blocks **and** section title CSS
3. SVG overlay on browser PDF plugin (opaque — cannot align)
4. Using DOM measure as proof of PDF spacing (Yoga ≠ CSS)

## File map (layout + render)

```
packages/layout/src/
  compile/compileStandardLayout.ts   # doc → blocks
  measure/measureLayout.ts           # blocks → bboxes (uses LayoutBlockHtml)
  plan/planPages.ts
  adapt/reactPdfPlan.ts              # hints only

packages/render/src/
  types.ts                           # RenderBackend contract
  reactPdfBackend.ts
  renderDocumentToPdf.tsx            # full-document react-pdf adapter
  blocks/
    blockSpacing.ts
    LayoutBlockHtml.tsx
    LayoutBlockPdf.tsx
```

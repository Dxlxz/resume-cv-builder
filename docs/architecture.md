# Full System Architecture

Rizzume - local-first, browser-based document editor with ATS-aware PDF export.

**Quick reference:** [../ARCHITECTURE.md](../ARCHITECTURE.md) · **Engine decision:** [decisions/layout-engine.md](decisions/layout-engine.md)

---

## Table of contents

1. [Part 1 - General](#part-1--general)
2. [Part 2 - Detailed](#part-2--detailed)
3. [Part 3 - Technical](#part-3--technical)

---

# Part 1 - General

## 1.1 Purpose

Rizzume is a **single-page application** that lets users create structured resumes and CVs without an account. Users edit content in a form-based editor, see a **live PDF preview**, run **ATS and regional lint checks**, and **export a text-selectable PDF** suitable for job portals (JobStreet, Maukerja, email applications).

Primary audiences:

- **Malaysia corporate** applicants - ATS-strict template, A4, navy accent, British English hints
- **International** applicants - classic template, US Letter, standard export profile

## 1.2 System constraints

| Constraint | Implication |
|------------|-------------|
| No backend | All state in browser; no sync across devices |
| Client-side only | PDF generation via `@react-pdf/renderer`; no server render farm |
| Privacy-first | Drafts and catalog customizations stay in `localStorage` |
| ATS-safe output | Single-column layouts, standard fonts, text-based PDF |
| Static deploy | `vite build` → `dist/` served by any static host |

## 1.3 Deployment model

```mermaid
flowchart LR
  Dev[Developer] -->|npm run build| Dist[dist/ static assets]
  Dist --> Host[Vercel / Netlify / GitHub Pages]
  Host --> Browser[User browser]
  Browser --> LS[(localStorage)]
```

| Layer | Technology |
|-------|------------|
| UI framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 + shadcn/ui and ReUI (light and dark themes) |
| State | Zustand |
| Validation | Zod (schema) + custom lint modules |
| PDF generation | `@react-pdf/renderer` |
| PDF preview | Browser native PDF viewer via iframe blob URL |
| Tests | Vitest + Testing Library |

## 1.4 Architectural style

**Modular monolith** - one deployable SPA with strict module boundaries. No microservices, no shared database. Modules communicate through typed interfaces and Zustand stores, not through a network layer.

## 1.5 Core principle

> **Document → Layout (IR + plan) → RenderBackend → Blob**

Preview and layout debug are **thin shells on top of the PDF output**. They do not lay out content independently.

```mermaid
flowchart LR
  Doc[ResumeDocument] --> Compile[compileLayout]
  Compile --> IR[LayoutDocument blocks]
  IR --> Measure[measureLayout]
  Measure --> Plan[planPages]
  Plan --> Hints[blockPdfHints]
  Hints --> Render[renderDocumentToPdf]
  Render --> Blob[PDF Blob]
  Blob --> Preview[iframe preview]
  Blob --> Export[download]
```

## 1.6 System context

```mermaid
flowchart LR
  User[User]
  App[ResumeCVBuilder SPA]
  LS[(localStorage)]
  PDFViewer[Browser PDF viewer]

  User -->|"edit, export, admin"| App
  App -->|"draft v2, catalog overrides"| LS
  LS -->|"load on init"| App
  App -->|"blob URL"| PDFViewer
```

External systems:

| Entity | Role |
|--------|------|
| **User** | Edits resume, runs ATS check, exports PDF, manages catalog vocabulary |
| **localStorage** | Persists resume draft (`resume-cv-builder-draft-v2`) and catalog overrides (`resume-cv-builder-catalog-v1`) |
| **Browser PDF engine** | Renders the same blob used for preview and export (WYSIWYG) |

There is no API server, authentication provider, or cloud storage in the current architecture.

---

# Part 2 - Detailed

## 2.1 Bounded contexts

The module map is [`.clear/architecture/modules.json`](../.clear/architecture/modules.json). It lists, for every
package and every application module, the modules it may import. `pnpm run modules:check` enforces it (it also
runs inside `pnpm test`), and ESLint reports the common violations in the editor.

**Engine packages** (`packages/*`, alias `@rb/*`). Packages sit in this order, lowest first, and each may import
only packages below it (to its left), so there are no cycles:

`core` → `themes` → `presets` → `styles` → `layout` → `render` → `templates` → `pipeline`

`catalog` and `fixtures` depend on `core` only; `validators` sits on top and may import `core`, `themes`, `presets`,
`styles`, `layout` and `catalog`.

| Package | Path | Responsibility |
|---------|------|----------------|
| **core** | `packages/core/src/` | `ResumeDocument` schema (v1/v2/v3), Zod parsing, selectors, JSON Resume interop, PDF import |
| **themes** | `packages/themes/src/` | Visual tokens - colors, typography scale, layout profile, font stacks |
| **presets** | `packages/presets/src/` | Regional defaults - template, theme, page size, validators, section labels |
| **styles** | `packages/styles/src/` | `resolveDocumentStyles`, page specs, template layout profiles, spacing helpers, block variants, PDF font styles |
| **layout** | `packages/layout/src/` | Compile IR, page plan, PDF hints - pure, **no DOM, no React, no PDF** |
| **render** | `packages/render/src/` | Block components (`LayoutBlockHtml`, `LayoutBlockPdf`), DOM measurement, fonts, `RenderBackend` contract |
| **templates** | `packages/templates/src/` | Template PDF entrypoints (classic, academic, ats-strict, modern-rail, banner) + shared block layout |
| **pipeline** | `packages/pipeline/src/` | `computeLayoutPlan` (compile + measure + plan) and `renderDocumentToPdf` (template dispatch) |
| **validators** | `packages/validators/src/` | ATS, typography, spacing, layout, pagination, regional and catalog lint; ATS proof suite |
| **catalog** | `packages/catalog/src/` | Bundled vocabulary, search, schema (edited in code, no admin) |
| **fixtures** | `packages/fixtures/src/` | Fictional sample documents (tests, demos) |

**Application modules** (`src/`). Each module under `src/modules/<name>/` is entered only through its `index.ts`
(`@/modules/<name>`); `src/shared/` is open to all; `src/app/` composes the modules.

| Module | Path | Responsibility | May import |
|--------|------|----------------|------------|
| **shared** | `src/shared/` | UI primitives, `AppShell`, `useAppRoute`, `useMediaQuery`, `utils`, `scrollToSection` | - |
| **pdf** | `src/modules/pdf/` | `generatePdf`, `downloadPdf`, `countPdfPages`, PDF.js client | shared |
| **document** | `src/modules/document/` | `documentStore` (Zustand), draft persistence, JSON import/export | shared |
| **catalog** | `src/modules/catalog/` | Catalog pickers, `useCatalogBundle` | document, shared |
| **editor** | `src/modules/editor/` | Editor panel, section list, forms, `FormSection`, section status | document, catalog, gallery, shared |
| **gallery** | `src/modules/gallery/` | Template gallery: live thumbnails of the open draft in every template | document, pdf, shared |
| **preview** | `src/modules/preview/` | Preview panel, `PdfJsPreview`, `usePdfPreview` | document, pdf, shared |
| **toolbar** | `src/modules/toolbar/` | Toolbar, lint panel, PDF preview modal | document, pdf, shared |
| **landing** | `src/modules/landing/` | Landing page and sample PDF previews | pdf, shared |
| **ats-check** | `src/modules/ats-check/` | Public ATS checker page | shared |
| **app** | `src/app/` | `App`, `BuilderLayout`, `DocTypeSelector`, `RecoveryBanner`, `BrowserGuard` | every module |
| **personal** | `personal/` (private) | Dale's profile pack - dev-only alias, never shipped | - |

To add a module: create `src/modules/<name>/index.ts`, add its entry to `modules.json`, and list what it may
import. A change to `modules.json` is a CLEAR change ([AGENTS.md](../AGENTS.md) section 5).

## 2.2 Preset, theme, and template

Three layers configure how a document looks and validates. They are stored independently on `document.meta` after the user picks a preset.

```mermaid
flowchart TB
  Preset[PresetDefinition] -->|"seeds defaults"| Meta[document.meta]
  Meta --> Theme[getTheme themeId]
  Meta --> Template[templateId + TEMPLATE_LAYOUTS]
  Theme --> Styles[resolveDocumentStyles]
  Template --> Styles
  Styles --> Compile[compileLayout]
  Styles --> Measure[measureLayout]
  Styles --> PDF[LayoutBlockPdf]
  Preset -->|"bundleIdForPreset"| Catalog[Catalog bundle]
```

| Layer | Owns | Example |
|-------|------|---------|
| **Preset** | Regional profile, default template/theme/page size, validators, section labels, catalog bundle | `malaysia-corporate` → ATS Strict + navy-corporate + A4 + portal-safe |
| **Theme** | Colors, typography sizes, layout profile gaps, font stacks | `navy-corporate` → Carlito, `#1F3864` accent |
| **Template** | Structural layout overrides merged onto theme at render time | `ats-strict` → tighter margins, uppercase section titles |

`themeForDocument()` auto-corrects theme when document type or template changes (e.g. academic CV → `academic-serif`).

## 2.3 Module dependencies

Arrows mean "may import".

```mermaid
flowchart BT
  subgraph Engine["Engine packages (arrow = may import)"]
    themes --> core
    presets --> themes
    styles --> presets
    layout --> styles
    render --> layout
    templates --> render
    pipeline --> templates
    catalog --> core
    fixtures --> core
    validators --> layout
    validators --> catalog
  end
  subgraph App["Application modules"]
    shared
    pdf --> shared
    document --> shared
    catalog_ui[catalog] --> document
    editor --> catalog_ui
    editor --> document
    editor --> gallery
    gallery --> pdf
    gallery --> document
    preview --> pdf
    preview --> document
    toolbar --> pdf
    toolbar --> document
    landing --> pdf
    atscheck[ats-check] --> shared
    app --> editor
    app --> preview
    app --> toolbar
    app --> landing
    app --> atscheck
  end
  pdf -.-> pipeline
```

## 2.4 Data flow diagram - Level 0

```mermaid
flowchart LR
  User((User))
  LS[(localStorage)]
  PDF((Browser PDF))

  subgraph system [Resume Builder System]
    Builder[SPA Application]
  end

  User -->|resume content settings| Builder
  Builder -->|read write draft catalog| LS
  Builder -->|display export| PDF
  User -->|view download| PDF
```

## 2.5 Data flow diagram - Level 1

```mermaid
flowchart TB
  User((User))

  subgraph processes [Processes]
    P1[P1 Edit Document]
    P2[P2 Compile Layout]
    P3[P3 Generate PDF]
    P4[P4 Preview Display]
    P5[P5 Validate]
    P6[P6 Persist]
    P7[P7 Admin Catalog]
  end

  subgraph stores [Data Stores]
    D1[(D1 Resume Draft)]
    D2[(D2 Catalog Overrides)]
    D3[(D3 Bundled Vocabulary)]
  end

  PDF((PDF Blob))

  User --> P1
  P1 --> D1
  D1 --> P2
  P2 --> P3
  P3 --> PDF
  PDF --> P4
  User --> P4
  D1 --> P5
  P2 --> P5
  P5 --> User
  D1 --> P6
  P6 --> D1
  User --> P7
  P7 --> D2
  D3 --> P7
  D2 --> P1
  D3 --> P1
```

| Process | Key code | Input → Output |
|---------|----------|----------------|
| P1 Edit | `EditorPanel`, form components | User input → `documentStore` |
| P2 Compile | `computeLayoutPlan()` | `ResumeDocument` → `LayoutPlanResult` |
| P3 Generate | `generatePdfWithPlan()` | Document + plan → `Blob` |
| P4 Preview | `PdfJsPreview`, `usePdfPreview` | Blob → iframe |
| P5 Validate | `runValidation()` | Document + layout plan → `LintIssue[]` |
| P6 Persist | `usePersistence`, `catalogStore` | State → localStorage |
| P7 Admin | `CatalogAdminPage` | CRUD on catalog overrides |

## 2.6 Entity-relationship - document model

```mermaid
erDiagram
  ResumeDocument ||--|| DocumentMeta : has
  ResumeDocument ||--|| ContactSection : has
  ResumeDocument ||--o| Summary : has
  ResumeDocument ||--|{ ExperienceItem : contains
  ResumeDocument ||--|{ EducationItem : contains
  ResumeDocument ||--|{ SkillGroup : contains
  ResumeDocument ||--|{ ProjectItem : contains

  DocumentMeta {
    int schemaVersion
    string documentType
    string presetId
    string templateId
    string themeId
    string exportProfile
    string locale
    string pageSize
    string sectionOrder
    string hiddenSections
    string updatedAt
  }

  ContactSection {
    string fullName
    string email
    string phone
    string location
    string linkedIn
    string website
  }

  ExperienceItem {
    string id
    string title
    string company
    string location
    string startDate
    string endDate
    bool present
    string bullets
  }

  EducationItem {
    string id
    string institution
    string degree
    string field
    string startDate
    string endDate
    string honors
  }

  SkillGroup {
    string id
    string name
    string items
  }

  ProjectItem {
    string id
    string name
    string url
    string description
    string bullets
  }
```

Schema versions: v1 drafts are migrated to v2 on load (`migrateV1ToV2`). v2 adds `presetId`, `themeId`, `exportProfile`, and `locale`.

## 2.7 Entity-relationship - catalog model

Catalog entries are **suggestions**. The resume document stores plain label strings, not catalog IDs.

```mermaid
erDiagram
  CatalogBundle ||--|{ CatalogEntry : contains
  CatalogOverrideState ||--o{ CatalogEntry : patches
  CatalogBundle ||--|| CatalogBundleManifest : has

  CatalogBundleManifest {
    string id
    string name
    string version
    string locale
    string presetIds
    string updatedAt
  }

  CatalogEntry {
    string id
    string catalogType
    string label
    string aliases
    string categoryId
    string locale
    bool active
    int sortOrder
  }

  CatalogOverrideState {
    int schemaVersion
    string bundleId
    string entries
    string customEntries
    string updatedAt
  }
```

Catalog types: `skill`, `skill-category`, `language`, `language-proficiency`, `occupation`, `industry`, `institution`, `degree-type`, `location`, `certification`, `action-verb`.

Bundles: `malaysia-default` (preset `malaysia-corporate`), `international-default` (all other presets).

## 2.8 Application routing and onboarding

Hash-based routing - no React Router.

```mermaid
flowchart TD
  Start[App mount] --> Init[documentStore.init + catalogStore.init]
  Init --> Guard[BrowserGuard]
  Guard --> Route{hash route?}

  Route -->|"#/admin"| Admin[CatalogAdminPage]
  Route -->|default| Started{hasStarted?}

  Started -->|no| Wizard[DocTypeSelector]
  Wizard --> Step1[Pick preset]
  Step1 --> Step2[Pick resume or CV]
  Step2 --> StartDoc[startDocument]
  StartDoc --> Builder

  Started -->|yes| Builder[BuilderLayout]
  Builder --> Toolbar[Toolbar]
  Builder --> Editor[EditorPanel]
  Builder --> Preview[PreviewPanel]
```

| Route | Hash | Screen |
|-------|------|--------|
| Builder | `""` or `#/` | Editor + preview |
| Admin | `#/admin` | Catalog vocabulary CRUD |

## 2.9 UI component hierarchy

```mermaid
flowchart TB
  App[App.tsx]
  App --> Guard[BrowserGuard]
  Guard --> Admin[CatalogAdminPage]
  Guard --> DocSel[DocTypeSelector]
  Guard --> Layout[BuilderLayout]

  Layout --> TB[Toolbar]
  TB --> Lint[LintPanel]
  TB --> Modal[PdfPreviewModal]

  Layout --> EP[EditorPanel]
  EP --> SL[SectionList]
  EP --> Forms[FormSection x N]
  Forms --> CF[ContactForm]
  Forms --> SF[SummaryForm]
  Forms --> EF[ExperienceForm]
  Forms --> EdF[EducationForm]
  Forms --> SkF[SkillsForm]
  Forms --> PF[ProjectsForm]

  Layout --> PP[PreviewPanel]
  PP --> Shell[PreviewShell]
  Shell --> PdfPrev[PdfJsPreview]
  Shell --> Debug[LayoutDebugInspector]

  CF --> Picker[CatalogPicker]
  EF --> Picker
  SkF --> Multi[CatalogMultiPicker]
  SkF --> Lang[LanguageLevelPicker]
```

Forms write strings into `documentStore`. Catalog pickers resolve labels via `catalogStore.resolveLabel()` but never store catalog IDs on the document.

---

# Part 3 - Technical

## 3.1 Layout intermediate representation

Every piece of rendered content becomes a **`LayoutBlock`** in `packages/layout/src/types.ts`:

| Field | Purpose |
|-------|---------|
| `id` | Stable key for measure, plan, and PDF hints |
| `type` | `header`, `sectionTitle`, `paragraph`, `bullet`, `skillGroup`, `experienceItem`, … |
| `breakPolicy` | `auto` \| `keep` \| `keepWithNext` - pagination behavior |
| `spacingBeforePt` / `spacingAfterPt` | Vertical rhythm owned by IR, not CSS margins |
| `content` | Typed discriminated union (`kind: 'header'`, `kind: 'bullet'`, …) |

`LayoutDocument` adds `contentWidthPt`, `contentHeightPt`, and `templateId`.

After measurement, each block gains a **`bbox`** (`{ x, y, width, height }` in pt). `PagePlan` assigns blocks to virtual pages with orphan-title avoidance and keep-together rules.

## 3.2 Layout pipeline

Orchestrator: `computeLayoutPlan()` in `packages/pipeline/src/computeLayoutPlan.ts`.

```mermaid
flowchart TB
  Doc[ResumeDocument] --> Compile[compileLayout]
  Compile --> Std[compileStandardLayout]
  Std --> Layout[LayoutDocument blocks]

  Doc --> Resolve[resolveDocumentStyles]
  Resolve --> Styles[ResolvedStyles]

  Layout --> Measure[measureLayout]
  Styles --> Measure
  Measure --> Hidden[Hidden DOM MeasureRenderer]
  Hidden --> Html[LayoutBlockHtml per block]
  Html --> Measured[MeasuredLayout bboxes]

  Measured --> Plan[planPages]
  Layout --> Plan
  Plan --> PagePlan[PagePlan slices breaks fillRatio]

  PagePlan --> Adapt[buildBlockPdfHints]
  Measured --> Adapt
  Styles --> Adapt
  Adapt --> Result[LayoutPlanResult]

  Result --> Lint[layout-lint spacing-lint]
  Result --> Ctx[runWithLayoutPlan context]
  Ctx --> PdfGen[renderDocumentToPdf]
  PdfGen --> Blocks[LayoutBlockPdf per block]
  Blocks --> Blob[PDF Blob]
```

### Stage details

| Stage | File | Notes |
|-------|------|-------|
| Compile | `packages/layout/src/compile/compileStandardLayout.ts` | Walks `getVisibleSections()`; emits header + section blocks with spacing from `LayoutProfile` |
| Measure | `packages/render/src/measure/measureLayout.ts` | Off-screen DOM; reads `getBoundingClientRect()`; SSR fallback uses line-count heuristic |
| Plan | `packages/layout/src/plan/planPages.ts` | Virtual pagination; orphan section titles; `keep` / `keepWithNext` breaks |
| Adapt | `packages/layout/src/adapt/reactPdfPlan.ts` | Maps plan → `BlockPdfHints` (`wrap`, `breakBefore`, `minPresenceAhead`) |
| Render | `packages/templates/src/shared/BlockLayoutPdf.tsx` | Single react-pdf `<Page wrap>`; all blocks via `LayoutBlockPdf` |

### Spacing ownership

| Layer | Role |
|-------|------|
| `LayoutProfile` (theme) | Semantic intent - `nameToMetaPt`, `ruleToFirstSectionPt`, bullet gaps |
| `compileLayout` | Assigns per-block `spacingBeforePt` / `spacingAfterPt` |
| `blockSpacing.ts` | Applies spacing once in HTML and PDF wrappers |
| `resolveDocumentStyles` | Typography + colors; **section titles have `marginTop: 0`** |
| react-pdf hints | Pagination only - not spacing |

## 3.3 Preview and export sequence

Preview and export share the **same PDF generation path** (`generatePdfWithPlan`). The legacy HTML `*Preview` stack was removed.

```mermaid
sequenceDiagram
  participant User
  participant Form as EditorForm
  participant Store as documentStore
  participant Hook as usePdfPreview
  participant Plan as computeLayoutPlan
  participant Gen as generatePdfWithPlan
  participant Render as renderDocumentToPdf
  participant Iframe as PdfJsPreview
  participant TB as Toolbar

  User->>Form: edit field
  Form->>Store: updateSection
  Store->>Hook: contentKey changes
  Note over Hook: debounce 400ms
  Hook->>Plan: computeLayoutPlan doc
  Plan-->>Hook: LayoutPlanResult
  Hook->>Store: setLayoutPlan
  Hook->>Gen: generatePdfWithPlan doc plan
  Gen->>Render: runWithLayoutPlan then renderDocumentToPdf
  Render-->>Gen: Blob
  Gen-->>Hook: Blob
  Hook->>Store: setPreviewPdfBlob setPreviewPageCount
  Hook->>Iframe: blob URL
  Iframe->>User: WYSIWYG preview

  User->>TB: Export PDF
  TB->>Gen: generatePdf doc
  Gen-->>TB: Blob
  TB->>TB: countPdfPages vs previewPageCount
  TB->>User: download or drift warning
```

| Concern | Implementation |
|---------|----------------|
| Preview fidelity | Same blob for iframe and export |
| Page drift | `paginateDriftIssue()` warns if export pages differ from preview by more than 1 |
| Layout debug | `LayoutDebugInspector` reads `LayoutPlanResult` - schematic only, not pixel-synced to iframe |
| Debounce | `usePdfPreview` 400ms; `useLayoutPlan` 300ms |

## 3.4 RenderBackend contract

Defined in `packages/render/src/types.ts`:

```typescript
interface RenderInput {
  layout: LayoutDocument
  plan: PagePlan
  styles: ResolvedStyles
  pageSize: 'A4' | 'LETTER'
}

interface RenderBackend {
  readonly id: string
  render(input: RenderInput): Promise<Blob>
}
```

**Production path** does not call `reactPdfBackend` directly. It flows through template PDF components → `BlockLayoutPdf`, which reads the active layout plan from `runWithLayoutPlan()` context.

| Backend | Status | Path |
|---------|--------|------|
| react-pdf + block walker | **v1 (shipped)** | `renderDocumentToPdf` → `BlockLayoutPdf` |
| `reactPdfBackend` | Pluggable adapter | `packages/pipeline/src/reactPdfBackend.tsx` |
| Forme | v2 candidate | Not implemented - see [decisions/layout-engine.md](decisions/layout-engine.md) |

### Font registration

`navy-corporate` theme embeds **Carlito** (Calibri metric substitute) via `packages/render/src/fonts/registerPdfFonts.ts`, called before `pdf()` in `renderDocumentToPdf.tsx`. Preview CSS uses `@fontsource/carlito`.

## 3.5 State management and persistence

```mermaid
flowchart TB
  subgraph zustand [Zustand Stores]
    DS[documentStore]
    CS[catalogStore]
  end

  subgraph ls [localStorage]
    Draft["resume-cv-builder-draft-v2"]
    Catalog["resume-cv-builder-catalog-v1"]
  end

  DS -->|"usePersistence 500ms debounce"| Draft
  Draft -->|"init on load"| DS

  CS -->|"save on mutation"| Catalog
  Catalog -->|"init on load"| CS

  DS -->|"layoutPlan previewBlob lint"| Preview[Preview + Validators]
  CS -->|"search resolve"| Pickers[Catalog Pickers]
```

### documentStore (key fields)

| Field | Purpose |
|-------|---------|
| `document` | Current `ResumeDocument` |
| `layoutPlan` | Latest `LayoutPlanResult` from pipeline |
| `previewPdfBlob` / `previewPageCount` | Cached preview for toolbar export |
| `lintIssues` | Results from ATS check |
| `layoutDebug` | Toggle layout inspector |

### catalogStore (key actions)

| Action | Purpose |
|--------|---------|
| `init` / `syncBundleForPreset` | Load overrides; switch bundle when preset changes |
| `getEntries` / `search` / `resolveLabel` | Picker vocabulary |
| `upsertEntry` / `deleteEntry` / `importPack` | Admin CRUD + import/export |

## 3.6 Validation pipeline

Orchestrator: `runValidation()` in `packages/validators/src/ats-lint.ts`.

| Module | File | Examples |
|--------|------|----------|
| Export schema | Zod + inline | `CONTACT_NAME_REQUIRED`, `CONTACT_EMAIL_REQUIRED` |
| Typography | `typography-lint.ts` | `TYPE_SIZE_TOO_SMALL`, `TYPE_LOW_CONTRAST` |
| Spacing | `spacing-lint.ts` | `SPACE_MARGIN_TIGHT`, `PAGE_1_DEAD_ZONE` |
| Layout | `layout-lint.ts` | `LAYOUT_ORPHAN_TITLE`, `LAYOUT_PAGE_1_DEAD_ZONE` |
| Pagination | `paginate-lint.ts` | `PAGINATION_OVERFLOW_RISK`, `PAGINATION_PAGE_COUNT_DRIFT` |
| Regional | `regional/malaysia.ts` | `IC_NUMBER_DETECTED`, `LOCATION_EMPTY` |
| Catalog | `catalog-lint.ts` | Vocabulary consistency |

Layout and spacing validators read `documentStore.layoutPlan`, so the compile → measure → plan pipeline must have run (via `usePdfPreview` or `useLayoutPlan`) before those rules produce results.

Preset `validators` array filters which regional rules run (e.g. `malaysia-regional` only on Malaysia preset).

## 3.7 Tech stack summary

| Concern | Package / module |
|---------|------------------|
| UI | React 19, Tailwind v4 |
| Forms | react-hook-form, `@hookform/resolvers` |
| Drag-and-drop | `@dnd-kit` |
| State | Zustand |
| Schema | Zod v4 |
| PDF write | `@react-pdf/renderer` |
| PDF read | `pdfjs-dist` (debug layout only) |
| Fonts | `@fontsource/carlito`, bundled woff for PDF |
| Test | Vitest, Testing Library, jsdom |

## 3.8 Anti-patterns

Avoid these - they caused spacing and parity bugs in earlier iterations:

1. **Parallel render trees** - duplicate HTML preview JSX alongside measure renderer + PDF blocks (legacy HTML preview removed 2026-06-11)
2. **Double spacing** - margins on both IR blocks and section title CSS
3. **SVG overlay on browser PDF plugin** - opaque canvas; cannot align with blob
4. **DOM measure as PDF proof** - Yoga layout ≠ CSS; use plan vs `countPdfPages` for parity

## 3.9 File map

```
packages/                       # engine, alias @rb/*  (core > themes > presets > styles > layout > render > templates > pipeline)
├── core/src/                   # types/document.ts, schema/, selectors/, interop/, import-pdf/
├── themes/src/                 # mono, navy-corporate, academic-serif
├── presets/src/                # malaysia-corporate, international-generic
├── styles/src/shared/          # resolveDocumentStyles, layoutProfiles, spacingHelpers, blockVariants, pdfFontStyle
├── layout/src/                 # compile/, plan/, adapt/, pdfLayoutContext.ts, types.ts
├── render/src/                 # types.ts (RenderBackend), blocks/, measure/, fonts/
├── templates/src/              # classic/, academic/, ats-strict/, modern-rail/, banner/, shared/ (BlockLayoutPdf, ColumnLayoutPdf)
├── pipeline/src/               # computeLayoutPlan, renderDocumentToPdf, reactPdfBackend
├── validators/src/             # ats-lint orchestrator, lint modules, catalog-lint, ats-proof/
├── catalog/src/                # bundles, search, schema
└── fixtures/src/               # sample documents
src/
├── main.tsx
├── app/                        # App, BuilderLayout, DocTypeSelector, RecoveryBanner, BrowserGuard
├── shared/                     # ui/, hooks/, layout/AppShell, lib/
└── modules/                    # each module is entered through its index.ts
    ├── document/               # documentStore, storage/
    ├── pdf/                    # generatePdf, download, countPdfPages, pdfjsClient
    └── catalog/  editor/  preview/  toolbar/  landing/  ats-check/
```

## 3.10 Extension points

| Extension | Approach | Status |
|-----------|----------|--------|
| New render backend | Implement `RenderBackend`; swap in generate path | Forme candidate |
| DOCX export | New `renderers/docx/` from same `ResolvedStyles` + document | Future spec |
| JSON Resume import | `adapters/jsonResume.ts` | Future spec |
| Content coach | `coaches/` module - STAR, verb picker | Future spec |
| Regional presets v2 | New preset definitions + bundles | Future spec |
| New template | Add `TEMPLATE_LAYOUTS` entry + thin `*Pdf.tsx` delegating to `BlockLayoutPdf` | Supported today |
| New theme | `createTheme()` + registry entry | Supported today |

## 3.11 Related documents

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | One-page pipeline cheat sheet |
| [decisions/layout-engine.md](decisions/layout-engine.md) | Why v1 stays on react-pdf + measure/plan |
| [packages/catalog/src/README.md](../packages/catalog/src/README.md) | Catalog module notes |

---

*Last updated: 2026-06-11 - reflects as-built codebase (schema v2, layout engine v1, Carlito PDF fonts).*

# Rizzume — Phased Build Plan

Status: draft, 2026-08-22. Supersedes nothing; complements
`open-source-resume-generators-research.md` (the field research) and
`RESUME_AND_CV_GOLD_STANDARDS.md` (the content bar).

Sizes are relative (S / M / L), not calendar estimates. Each phase ends with a
verification gate — if the gate is red, the phase is not done.

---

## Decision needed before Phase 4

**Is Rizzume willing to be AGPL-3.0?**

The two highest-leverage gaps in the research doc — PDF import (#2) and a public
ATS parser (#3) — exist only in **OpenResume, which is AGPL-3.0**. AGPL's network
clause means that shipping any of its code in a product served over a network
(you deploy via `vercel.json`) obliges you to publish all of Rizzume under AGPL.

- **Answer "no"** (assumed default): Phases 4 and 5 are written clean-room. The
  *approach* is public knowledge and freely usable; the code is not. Cost: real
  implementation work instead of a port.
- **Answer "yes"**: Phases 4 and 5 shrink to a port plus adaptation, and Rizzume
  becomes AGPL.

Everything else in this plan draws on MIT-licensed sources and is unaffected.

---

## Phase 0 — Land what is already built

**Goal.** Get the working tree committed. Nothing here is new development; it is
all written, typechecked, and green.

**Why first.** ~28 modified files and 10 untracked paths are uncommitted, plus two
stashes. Every later phase compounds on top of this. Reviewing it as one blob
later is worse than splitting it now.

**Work.**

- Split into reviewable commits along natural seams:
  1. Font path — `packages/render/src/fonts/**` (Carlito restored, Source Serif 4
     added, hyphenation disabled), `packages/themes/src/academic-serif.ts`.
  2. Duplicate resolver removed — `packages/styles/src/index.ts` is now a barrel
     over `shared/resolveDocumentStyles.ts`.
  3. New templates — `modern-rail`, `banner`, plus the `LayoutProfile` knobs and
     both block renderers.
  4. Idrizz feature flag — `src/features/ai/enabled.ts` and its two call sites.
- Resolve the two stashes (`helvetica-revert-wip*`). They revert Carlito to
  Helvetica; the evidence says that revert was based on a false signal. Drop them
  unless you disagree.
- Decide on `vitest.personal.config.ts` (untracked, at repo root): keep it — the
  main vitest config excludes `personal/**`, so nothing under it can run without
  this file.
- Pre-existing dirty files not touched this session —
  `packages/layout/src/{plan/planPages,compile/compileStandardLayout,adapt/reactPdfPlan}.ts`
  and `.cursor/rules/personal-profile.mdc` — need a decision from you; they were
  already modified when the session started.

**Gate.** `npx tsc --noEmit` clean · `npx vitest run` green (45 files / 194 tests)
· `npx vite build` clean · working tree empty except deliberate exclusions.

**Size.** S. **Risk.** Low, but the pre-existing dirty files are unknown to me.

---

## Phase 1 — ATS proof suite

**Goal.** Turn "ATS-safe" from a claim into a test. Known ground truth → render →
extract text → assert every field survived, across every template and document
type.

**Why now.** It is the cheapest phase with the highest guard value, and it must
precede the template and parser work so those land against a real safety net.

The technique is RenderCV's (MIT — `scripts/ats_proof/`, documented in
`docs/ats_compatibility.md`). Their Layer 1 (text extraction vs ground truth) is
portable and free. Their Layer 2 submits to paid commercial parsers
(Affinda / Extracta / Klippa via Eden AI) — out of scope.

**Evidence this pays for itself.** The shipped master CV was exporting
`coursera.org/veri-` + `fy/KUV9ZOIPSDEV` — a verification URL split by
hyphenation. Found by hand this session; a Layer 1 assertion catches it
automatically. Nothing currently stops `modern-rail`'s date gutter from silently
breaking date extraction either.

**Work.**

- Corpus with known ground truth: reuse `packages/fixtures/src/sampleDocuments.ts`
  and add edge cases — diacritics, a very long single bullet, a URL, an entry with
  no end date.
- Render each corpus document × every id in `TEMPLATE_IDS` (now 5) × both
  document types.
- Extract with `pdfjs-dist` (already a dependency; the harness pattern exists from
  this session's diagnostics).
- Assertions: every ground-truth field present in extracted text · no
  mid-word hyphen splits · no glyph-less pages · reading order is
  top-to-bottom (dates must not interleave into the wrong entry — the real risk
  in `modern-rail`) · contact details appear in the body text layer.
- Runs under `@vitest-environment node`. **This is mandatory** — under the project
  default jsdom, react-pdf resolves registered font files through a browser code
  path that corrupts the embedded subset, and pdf.js then renders a blank page.
  That trap cost real time this session; the reason is documented in
  `packages/render/src/fonts/registerPdfFonts.test.ts`.

**Gate.** Suite green across all templates × doc types; deliberately break one
template's reading order locally and confirm the suite goes red.

**Size.** M. **Risk.** Low. **Depends on.** Phase 0.

---

## Phase 2 — JSON Resume interop

**Goal.** Import and export the JSON Resume schema, so a Rizzume document can
enter and leave the ecosystem's shared vocabulary.

**Why now.** Cheapest item on the research doc's gap map (#1, "high — cheap,
standard"), entirely MIT, and it makes the data portability story real rather
than aspirational.

**Sources (both MIT, reusable with attribution).**

- `tmp/upstream/resume-schema/schema.json` — 499 lines, the standard itself.
  Sections: `basics, work, volunteer, education, awards, certificates,
  publications, skills, languages, interests, references, projects, meta`.
- `tmp/upstream/Reactive-Resume/packages/import/src/json-resume.tsx` — 435 lines
  plus 167 lines of tests. A solved mapping with the edge cases already found.

**Work.**

- Bidirectional mapping `ResumeDocument` ↔ JSON Resume. Rizzume's sections map
  cleanly onto most of the standard; `volunteer`, `certifications`, `projects`
  and `references` already exist.
- Decide the lossy edges explicitly and document them: Rizzume's `meta`
  (templateId, themeId, presetId, sectionOrder, sectionGuides) has no home in the
  standard, and JSON Resume's `awards`, `publications`, `interests` have no home
  in Rizzume yet.
- Validate imports with zod before they touch the store; reuse the strictness
  posture of `packages/core/src/schema/v3.ts`.
- Round-trip test: Rizzume → JSON Resume → Rizzume preserves everything the
  mapping claims to preserve.
- Attribution: retain Reactive Resume's MIT notice for any reused code.

**Gate.** Round-trip test green · a real third-party JSON Resume file imports and
renders · lossy fields documented in the mapping module's docblock.

**Size.** M. **Risk.** Low. **Depends on.** Phase 1 (so imports are ATS-checked).

---

## Phase 3 — Sidebar template + column-aware pagination

**Goal.** Ship the sidebar layout (mockup M2) — the one the mockups showed and
the only one that could not be landed with the current engine.

**Why now.** It is the largest architectural change in the plan and it touches the
pagination core, so it wants the Phase 1 safety net underneath it.

**The actual problem.** Everything else so far worked because
`packages/layout/src/measure/measureLayout.ts` measures the HTML blocks in a
hidden DOM and `planPages` lays them out in **one** vertical flow. The rail,
accent bars and skills grid are *within-block* changes, so pagination never had
to know about them. A sidebar is not: it is two independent block streams whose
page breaks are unrelated. In the mockup, the sidebar ran out on page 1 and left
a full-height blank tinted strip down page 2.

**Work.**

- Layout IR gains a column concept: `compileStandardLayout` emits N streams with a
  column assignment rather than one list.
- `measureLayout` measures each column at its own content width.
- `planPages` becomes column-aware: plan each column independently against the
  same page height, then reconcile page count (the taller column decides).
- Renderers paint a background for the sidebar column that spans the full page
  height, independent of how much content the column holds — this is what fixes
  the blank strip.
- Add `columns` to `LayoutProfile` alongside the existing knobs, and a
  `sidebar` template entry.
- Keep `ats-strict` strictly single-column regardless.

**ATS note.** The evidence on two-column parsing is genuinely split — an
`atsverification.com` 2026 benchmark scored a two-column layout 100 → 85 and
flagged it critical, while Enhancv's own test measured 98% vs 95% *in favour* of
two columns. Both agree the mechanism is **reading order**, and Textkernel
reports column-separator detection took their clean-render rate from 62% → 90%.
So: sidebar holds short items only (contact, links, tools, languages), the main
column keeps all chronology, and Phase 1's reading-order assertion becomes the
arbiter.

**Gate.** Phase 1 suite green for the sidebar template, including reading order ·
no blank sidebar column on any page of a 5-page CV · preview and export agree on
page count.

**Size.** L. **Risk.** Medium-high — it is the pagination core. **Depends on.**
Phase 1.

---

## Phase 4 — PDF import (clean-room)

**Goal.** Upload an existing resume PDF, get the form filled. The research doc
calls this "the biggest onboarding unlock".

**Licensing.** OpenResume is **AGPL-3.0**. Unless the decision at the top of this
document says otherwise, this is written from scratch. The pipeline *shape* is
public knowledge and is described in their docs; their 1,294 lines of
implementation are not to be copied.

**Work.**

- `pdfjs-dist` text items (already a dependency) → group into lines by y-position
  → group lines into sections by heading detection → extract fields per section.
- Feed the result through the same zod validation as any import.
- A review step before the parsed content replaces anything — never silently
  overwrite a document.
- Expect this to be the least reliable feature in the product; design the UI so
  partial extraction is useful rather than an all-or-nothing failure.

**Gate.** Round-trips its own exports: a Rizzume-generated PDF imports back with
every field recovered (this is Phase 1's ground-truth corpus reused as parser test
data — the two phases share a corpus) · degrades gracefully on a hostile PDF.

**Size.** L. **Risk.** High — heuristic by nature. **Depends on.** Phase 1,
plus the AGPL decision.

---

## Phase 5 — Public ATS checker

**Goal.** A page where anyone can drop any PDF and see what a parser sees. Trust
builder, and the research doc rates it "high — cheap, trust-building".

**Why after 4.** It is mostly Phase 4's extractor plus Phase 1's assertions with a
UI on top. Built earlier it would duplicate both.

**Work.** Reuse the Phase 4 extraction pipeline · report extracted text, detected
sections, and which expected fields are missing · no upload to a server; keep it
in-browser, consistent with the product's no-account posture.

**Gate.** Correctly flags a known-bad PDF (text-as-image, or a two-column file
with interleaved reading order) and passes a known-good one.

**Size.** M. **Risk.** Low. **Depends on.** Phase 4.

---

## Phase 6 — Cover letters

**Goal.** Cover letters as a document type, using the existing engine.

**Why last.** Lowest architectural risk and least dependency; it is a new preset
plus a section set, not new machinery. Reactive Resume and Awesome-CV both ship
it.

**Work.** New `documentType` alongside `resume` / `cv` · a section set (recipient,
date, salutation, body, sign-off) · one or two templates · schema migration.

**Gate.** Renders in every template · Phase 1 suite extended to cover it.

**Size.** M. **Risk.** Low. **Depends on.** Phase 0.

---

## Dependency order

```
Phase 0 ─┬─> Phase 1 ─┬─> Phase 2
         │            ├─> Phase 3
         │            └─> Phase 4 ──> Phase 5
         └─> Phase 6
```

Phases 2, 3 and 6 are mutually independent and can run in any order once their
prerequisite is met. Phase 4 additionally waits on the AGPL decision.

---

## Deliberately not in this plan

- **Application tracker** — the research doc rates it low priority with explicit
  scope-creep risk. Agreed.
- **Thumbnails / document cards** — low leverage until there are enough documents
  per user to need them.
- **Read-only share links** — real value (#6, medium), but it is the first feature
  that needs server-side storage and therefore changes the product's privacy
  posture. It deserves its own decision, not a line in a build plan.
- **Re-enabling Idrizz** — currently flagged off by `VITE_IDRIZZ_ENABLED`. The
  research found Rizzume's approval-flow design already matches the market
  leader's; re-enabling is a product call, not a build task.

# Open-Source Resume / CV Generators — Field Research (n = 8)

**Date:** 2026-08-22 · **Method:** Live web scrape of primary sources (GitHub repos, official sites) via Firecrawl · **Scope:** the 8 canonical open-source resume/CV generators by adoption and influence

This doc answers: *What open-source PDF resume/CV generators exist, what features do they ship, and how do they differ from each other — and from Rizzume?*

---

## 1. Executive summary

The open-source resume-generator space splits into **four architectural camps**:

| Camp | Philosophy | Canonical examples |
|---|---|---|
| **WYSIWYG web builders** | Form + live preview in the browser; PDF generated client-side (react-pdf) or in-app | Reactive Resume, OpenResume, E-Resume, Visiky |
| **Code-driven generators** | Data is text (JSON/YAML), rendering is deterministic; designed for version control | JSON Resume (resume-cli), RenderCV |
| **LaTeX / typesetting templates** | Markup → typeset PDF; typography-first, academic/engineering aesthetic | Awesome-CV, Resumake (retired), ModernCV* |
| **GitHub-profile readers** | Scaffold a resume from your GitHub data | GitHub Resume, OhMyCV (adjacent) |

Two of the eight are **retired or archived** (Resumake — retired June 2026; resume-cli — archived June 2026, development moved into the jsonresume.org monorepo and revived for Node 18+). The churn matters: three of the eight projects are dormant (OpenResume, Visiky, resume-cli legacy repo), which is a common failure mode in this niche — the projects that survive are the ones with a hosting story (Reactive Resume, RenderCV) or a standard behind them (JSON Resume).

**Headline findings relevant to Rizzume:**

1. **Reactive Resume is the reference implementation for a hosted, full-featured builder** — 41.5k★, MIT, an AI agent workspace, application tracker, PWA, 83k+ resumes made. Its feature surface is the competitive bar.
2. **RenderCV owns the "CV-as-code" niche** — YAML → Typst → pixel-perfect PDF with strict validation and 9 themes. Reproducibility is its killer feature: "your CV is just text."
3. **OpenResume proves privacy is a feature** — 100% client-side, no accounts, works offline, and remains popular (8.9k★) despite being dormant since late 2024.
4. **ATS-friendliness is now a first-class feature, not a bullet point** — OpenResume ships a resume *parser* to test ATS readability; Reactive Resume and RenderCV both added ATS concerns to their engines; Rizzume's ATS check aligns with the market leader.
5. **PDF engines that matter:** react-pdf (Reactive Resume, OpenResume), Typst (RenderCV), XeLaTeX (Awesome-CV, Resumake), browser print (Visiky). Rizzume already uses a react-pdf-based render backend — the same stack as the two biggest WYSIWYG builders.

---

## 2. The canonical 8 — profiles

### 2.1 Reactive Resume — *the most complete open-source builder*

- **Repo:** github.com/amruthpillai/reactive-resume · **Stars:** ~41.5k · **Forks:** ~4.6k · **License:** MIT · **Status:** very active (v5.2.7, Aug 2026; 5,753 commits)
- **Stack:** pnpm monorepo — React SPA + Hono API, Postgres, react-pdf-based PDF generation (uses `@react-pdf/textkit` patches), Zustand, semantic CSS design system, Crowdin i18n (dozens of locale catalogs)
- **Hosting:** freemium at rxresu.me ("no ads, no paywall"); self-host via Docker (`amruthpillai/reactive-resume:latest`, ghcr.io) — the standard self-host path
- **Features:**
  - Form-based editor with live preview; **multi-page layouts** and easy layout management
  - **Rich-text (WYSIWYG) content** normalized for PDF output (handles `<mark>`, lists, paragraph spacing)
  - **AI agent workspace** (added 2026): server-side AI providers with *encrypted* credentials, chat threads, tool-call repair, **HITL (human-in-the-loop) patch approvals** — AI edits apply as reviewable diffs, signed base-revision checks, revert/version-conflict handling. Idrizz in Rizzume is the same pattern.
  - **Application tracker** with REST *and* MCP parity
  - Resume **thumbnails**, JSON import/export, PWA, translation sync
- **Notes:** The single most complete OSS resume app. Its design system, patch-approval AI flow, and application tracker are the most sophisticated features found in any of the 8.

### 2.2 RenderCV — *CV-as-code for academics & engineers*

- **Repo:** github.com/rendercv/rendercv · **Stars:** ~17.4k · **Forks:** ~1.3k · **License:** MIT · **Status:** active (largely 2025–2026 work)
- **Stack:** Python 3.12+, Pydantic validation, **Typst** typesetting engine (with bundled typst-fontawesome for offline icons), CLI + hosted web at rendercv.com, Docker
- **Workflow:** `pip install "rendercv[full]"` → `rendercv new "John Doe"` → edit YAML → `rendercv render John_Doe_CV.yaml` → PDF
- **Features:**
  - **9 built-in themes:** classic, engineeringresumes, sb2nov, moderncv, engineeringclassic, harvard, ink, opal, ember — each with distinct fonts/palettes (EB Garamond, Lato, Gentium Book Plus, crimson accents…)
  - **Strict validation with zero surprises:** Pydantic schema, JSON Schema published for editor autocompletion/inline docs
  - **Full design control in YAML:** page size (US letter / A4), margins, per-element colors (name, headline, section titles, links, footer…), line spacing, alignment, font family
  - **Locale system for any language** (incl. recent Hungarian); date/degree phrase localization
  - **Reproducible:** the same YAML always yields the same PDF — designed for git
  - **ATS compatibility testing suite** in-repo (renders PDFs, analyzes text extraction, reports vs ground truth) — evidence-based ATS work, not vibes
  - **AI agent skill** (`npx skills add rendercv/rendercv-skill`) — auto-generated SKILL.md so coding agents can create/edit CVs, evaluated with promptfoo against its own validation pipeline
- **Notes:** The purest "content/design separation" in the field. If Rizzume ever wants a CLI/headless mode, this is the model. RenderCV also *borrows* ModernCV's look (theme), which itself is a famous LaTeX CV class.

### 2.3 OpenResume — *privacy-first, ATS-verified*

- **Repo:** github.com/xitanggg/open-resume · **Stars:** ~8.9k · **Forks:** ~1.0k · **License:** AGPL-3.0 · **Status:** dormant (last commit Oct 2024)
- **Stack:** NextJS 13, React, TypeScript, Redux Toolkit, Tailwind; **PDF.js** (parse) + **react-pdf** (render); Docker
- **Features:**
  - **100% client-side:** no signup, no data leaves the browser, works with the internet disconnected
  - **Real-time UI update** — the PDF preview updates as you type
  - One modern professional design, "adheres to U.S. best practices," **ATS-friendly against Greenhouse and Lever**
  - **Import from an existing resume PDF** (parses it back into the form)
  - **Resume parser** as a standalone page — upload any PDF, see how an ATS would extract it; algorithm deep-dive published
- **Notes:** The AGPL license is a real constraint for commercial derivatives (copyleft). Its parser + builder combo is the strongest ATS story of the 8, and it validates Rizzume's ATS-check direction.

### 2.4 Awesome-CV — *the classic LaTeX template*

- **Repo:** github.com/posquit0/Awesome-CV · **Stars:** ~28.3k · **Forks:** ~5.3k · **License:** LPPL-1.3c · **Status:** maintained (Aug 2026 commit)
- **Stack:** LaTeX (XeLaTeX), FontAwesome 6 icon package, Roboto + Source Sans Pro fonts, Makefile + Docker (texlive image), Overleaf one-click templates for résumé and cover letter
- **Features:**
  - One elegant template for **CV, résumé, and cover letter** — clean semantic markup, easy to customize
  - Typography-first output (the LaTeX advantage: justified text, proper hyphenation, PDF/A reliability)
  - Social/contact icon set incl. recent WhatsApp click-to-chat support
- **Notes:** A *template*, not a builder — no editor, no data format. The 28k★ show demand for "designer-grade, hand-tuned" output. LaTeX output is famously not ATS-machine-readable unless kept simple; original ~10-year-old codebase with active dependabot-only maintenance.

### 2.5 JSON Resume — *the standard, not the app*

- **Repos:** github.com/jsonresume/resume-cli (archived **June 12, 2026**; dev moved to github.com/jsonresume/jsonresume.org `packages/cli`; npm name `resume-cli` unchanged, **revived for Node 18+ in 2026**) · **Stars:** ~4.7k (CLI) · **License:** MIT · **Status:** ecosystem alive, CLI historically under-maintained (README: "recommended to use third-party clients… e.g. Resumed")
- **Concept:** an **open JSON schema standard** (`resume.json`, schema at jsonresume.org/schema). Data is portable across any client; presentation is a separate theme layer.
- **CLI:** `resume init` → `resume validate` → `resume export [--format pdf|html] [--theme even]` → `resume serve` (live-reload local preview). Inputs: JSON, YAML, quaff directories, stdin.
- **Ecosystem:** **400+ npm theme packages** (`jsonresume-theme-*`) plus a growing set of official themes (Even, Flat, Kendall, Macchiato, Professional, Stack Overflow, Desert Modern, plus 30+ new official designs); hosted rendering at registry.jsonresume.org (`?theme=` URL pattern); theme-development guide.
- **Notes:** The only *data standard* in the field. Its data model (basics / work / education / skills / projects… with dates, highlights, keywords) is effectively the field's shared vocabulary — Reactive Resume and OpenResume both import/export JSON resume-adjacent shapes. For Rizzume: JSON Resume compatibility is the closest thing to an interop moat.

### 2.6 Resumake — *retired LaTeX generator*

- **Repo:** github.com/saadq/resumake.io · **Stars:** ~3.6k · **Forks:** ~515 · **Status:** **retired June 2026** — repo now serves a static farewell page (`resumake.io`); original app preserved on the `v2` branch
- **Was:** free, open-source LaTeX resume generator — no ads, no accounts, no data collection; React frontend + Node backend compiling **pdflatex**; "helped tens of thousands of people"
- **Why it matters:** (1) It proves a *managed LaTeX* builder can be mainstream; (2) its retirement after years of zero monetization is a cautionary tale — free hosting + LaTeX compute costs eat projects in this niche; (3) its farewell README is unusually candid about lifecycle.

### 2.7 E-Resume (sadanandpai/resume-builder) — *single-page focused*

- **Repo:** github.com/sadanandpai/resume-builder · **Stars:** ~1.2k · **Forks:** ~482 · **License:** MIT · **Status:** active (May 2026)
- **Stack:** NextJS 15, MUI (Material), Tailwind, Zustand; Docker; live at e-resume.vercel.app
- **Features:**
  - **Single-page professional resume** builder with templates + theme colors
  - No sign-up; "your data never leaves your device" (with a disclosed caveat: user interactions are shadowed to improve the product)
  - New: **section layout management with drag-and-drop**
  - UX published as a design case study (uxplanet.org)
- **Notes:** Smallest feature surface of the active builders; closest in spirit to Rizzume's single-document, no-account model. Its "data never leaves your device" claim is weakened by interaction shadowing — a nuance worth learning from (be precise about what leaves the device).

### 2.8 Visiky Resume — *GitHub-hosted, bilingual (zh/en)*

- **Repo:** github.com/visiky/resume · **Stars:** ~3.2k · **Forks:** ~776 · **License:** MIT · **Status:** dormant (last commit May 2023)
- **Stack:** Gatsby + React + antd, TypeScript, react-intl/formatjs i18n
- **Features:**
  - **3 templates** (default, simple, simple2 for multi-page); **custom theme colors**, customizable section titles
  - **Online preview/edit → PDF download** (visiky.github.io/resume)
  - **Novel data flow:** export a `resume.json` into your own GitHub special repo, then render via URL params — `?user={user}&template={t}&branch={b}&mode=edit&lang=zh-CN` → read-only or edit mode
  - Full **中/英 bilingual** UI
- **Notes:** The most distinctive *sharing* model of the 8 (resume-as-URL from your own repo). Dormant, but the URL-driven read-only resume link pattern is still ahead of most builders.

---

## 3. Feature & difference matrix

Verified from primary sources, Aug 2026. ★= shipped feature; ○ = partial/limited; — = absent. Data as scraped (stars rounded).

| Dimension | Reactive Resume | RenderCV | OpenResume | Awesome-CV | JSON Resume | Resumake | E-Resume | Visiky |
|---|---|---|---|---|---|---|---|---|
| **Identity** | | | | | | | | |
| Stars / forks | 41.5k / 4.6k | 17.4k / 1.3k | 8.9k / 1.0k | 28.3k / 5.3k | 4.7k / 393 | 3.6k / 515 | 1.2k / 482 | 3.2k / 776 |
| License | MIT | MIT | **AGPL-3.0** | LPPL-1.3c | MIT | (retired) | MIT | MIT |
| Activity (as of Aug 2026) | very active | active | dormant since 10/24 | maintained | archived→moved, revived | **retired 06/26** | active | dormant since 05/23 |
| Hosted instance | rxresu.me | rendercv.com | open-resume.com | Overleaf | registry.jsonresume.org | — | e-resume.vercel.app | visiky.github.io/resume |
| Self-host path | Docker | Docker / pip | Docker / npm | Docker / TeX | npm | — | Docker | pnpm build |
| **Authoring** | | | | | | | | |
| WYSIWYG form editor | ★ | ○ (JSON-schema-guided YAML) | ★ | — | — | ★ | ★ | ★ |
| Live preview | ★ | ○ (VS Code setup) | ★ | — | ★ (`serve`, live-reload) | ★ | ★ | ★ |
| Data format | app data + JSON import/export | **YAML** | app data + PDF import | LaTeX markup | **JSON standard** | app data | app data | **JSON in your GitHub repo** |
| Templates / themes | multiple + designs | **9 themes** | 1 (fixed) | 1 + customize | **400+ npm themes** | multiple LaTeX | several | 3 |
| **Output** | | | | | | | | |
| PDF engine | react-pdf | **Typst** | react-pdf | XeLaTeX | theme-dependent | pdflatex | browser/react | browser/print |
| Export formats | PDF, JSON | PDF (+PNG/markdown via ecosystem) | PDF | PDF | HTML/PDF (theme-dependent) | PDF | PDF | PDF |
| Cover letter | ★ | — | — | ★ | ○ (schema) | — | — | — |
| Multi-page | ★ | ★ | — (single) | ★ | theme-dependent | — | — (single, focused) | ★ (template 3) |
| **ATS posture** | | | | | | | | |
| ATS-aware design | ★ (claimed high) | ★ (testing suite in repo) | ★★ (parser + Greenhouse/Lever verified) | — (LaTeX caveats) | ○ (theme-dependent) | — | — | — |
| Resume parser / ATS check | ○ (AI analyze) | ○ (proof suite) | ★ (public parser) | — | — | — | — | — |
| **Privacy & accounts** | | | | | | | | |
| No-account editing | ★ (hosted + self-host) | ★ | ★★ (data never leaves browser) | n/a | n/a | ★ | ★ (with shadowing caveat) | ★ |
| **AI** | ★★ AI agent w/ HITL approvals, encrypted keys | ○ AI skill for coding agents | — | — | — | — | — | — |
| **Distinctive** | application tracker (REST+MCP), PWA, thumbnails, 40+ locales | reproducibility, strict validation, any-language locales | offline-capable, PDF import | typography, Overleaf | **data standard / portability** | (retired) | section drag-and-drop | URL-param resume sharing, zh/en |

---

## 4. Synthesis — how the field actually works

### 4.1 PDF generation: four engines, two philosophies

- **Client-side DOM/PDF libraries (react-pdf)** — Reactive Resume, OpenResume. Render in the browser from the same React components that draw the preview → preview-export parity, zero server compute, offline-friendly. Costs: pagination/typography control is limited vs a typesetter; rich-text → PDF normalization is real work (Reactive Resume has dedicated HTML-normalization code for it).
- **Typesetters (Typst / XeLaTeX / pdflatex)** — RenderCV, Awesome-CV, Resumake. Professional typography (alignment, hyphenation, spacing) and deterministic output; requires a compilation step (local toolchain or server). RenderCV's Typst choice is notably modern: fast, scriptable, easier to deploy than TeX.
- **Browser print** — Visiky. Simple, but page-break control and fidelity are weakest.

**Takeaway for Rizzume:** react-pdf is the winning choice for a browser builder (2 of the 3 biggest WYSIWYG engines use it — same family Rizzume's `@rb/render` adapts). Type-quality limits (widows, justification) are the accepted trade-off of the category.

### 4.2 Content/design separation is the field's big idea

- JSON Resume: separation by *standard* (schema + 400 themes).
- RenderCV: separation by *pipeline* (YAML content + theme parameters + design config).
- Visiky: separation by *storage* (data in your repo, rendering elsewhere).

All three prove the same lesson: **users want their resume data to outlive the app**. Rizzume's JSON import/export + versioned document schema already occupies this ground; adding a JSON-Resume import/export mapping would plug directly into the field's shared vocabulary.

### 4.3 ATS is now an engineering discipline, not marketing

- OpenResume: parser that reproduces what ATS extractors see (featured, public, documented).
- RenderCV: automated ATS-compat test suite with text-extraction analysis vs ground truth.
- Reactive Resume: AI-assisted resume analysis.

Rizzume's ATS check (lint panel before export) is the right shape; the differentiation opportunity is *verifying* claims the way RenderCV does, not just asserting them.

### 4.4 Privacy positioning correlates with staleness

Post-2023, the two "zero-account, zero-exfiltration" success stories (OpenResume, E-Resume) both went quiet. Meanwhile the active projects monetize hosting (Reactive Resume freemium, RenderCV hosted). Lesson: **privacy is a feature users love and a business model they don't pay for** — sustainable projects pair privacy with a hostable core.

### 4.5 AI features are converging on the same safety pattern

Reactive Resume's AI agent (2026) and Rizzume's Idrizz independently implement: typed JSON edit plans → **review before apply** → version-conflict guarding → server-side credentials. Pattern confirmed by the market leader; Rizzume is already ahead of every other builder in this list.

### 4.6 The lifecycle problem

Resumake retired after ~8 years; resume-cli archived (then revived in a monorepo); OpenResume/Visiky dormant. Half of the canonical 8 are not actively developed. For a *new* project (Rizzume), that's space — the field rewards whoever keeps shipping.

---

## 5. Gap map vs Rizzume

Where the canonical 8 have things Rizzume doesn't (today), ranked by leverage:

| # | Capability | Seen in | Suggested priority |
|---|---|---|---|
| 1 | **JSON Resume schema import/export** (portability into the ecosystem) | JSON Resume | high — cheap, standard |
| 2 | **Import from an existing PDF** (resume parser → form fill) | OpenResume | high — biggest onboarding unlock |
| 3 | **Public ATS parser page** (let users test any PDF) | OpenResume | high — cheap, trust-building |
| 4 | **ATS compat test suite** for own templates (render → extract → diff vs ground truth) | RenderCV | medium — automates Rizzume's ATS claims |
| 5 | **Cover letter documents** | Reactive Resume, Awesome-CV | medium — same engine, new preset |
| 6 | **Read-only share links** (URL or hosted) | Reactive Resume, Visiky, registry.jsonresume.org | medium |
| 7 | Thumbnails / document cards | Reactive Resume | low-medium |
| 8 | Application tracker | Reactive Resume | low (scope creep risk) |

**Where Rizzume already leads:** AI assistant with approval flow (only Reactive Resume matches, and it added it in 2026), regional presets (nobody in the 8 has Malaysia Corporate-style local compliance), lint/validation before export (RenderCV validates, Rizzume lints *and* warns), no-account + deterministic client PDF.

---

## 6. Sources & freshness

All primary-source scrapes performed 2026-08-22 via Firecrawl (live, `maxAge: 0`):

- github.com/amruthpillai/reactive-resume
- github.com/rendercv/rendercv
- github.com/xitanggg/open-resume
- github.com/posquit0/Awesome-CV
- github.com/saadq/resumake.io
- github.com/jsonresume/resume-cli + jsonresume.org/themes
- github.com/sadanandpai/resume-builder
- github.com/visiky/resume

Secondary context: rxresu.me, rendercv.com, open-resume.com, e-resume.vercel.app search snippets, r/selfhosted thread on Reactive Resume v3 (83k+ resumes), ResuFit 2024 comparison post, dev.to "5 Open-Source Resume Builders" post.

Star counts and activity status reflect the scrape date and will drift; license and architecture facts are stable.
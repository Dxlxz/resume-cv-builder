# Resume & CV Builder — Requirements Document

> **Project Name:** MYGradResume — Personal Career Document & Portfolio Hub  
> **Author:** Dale Jeffrey Gilimon  
> **Version:** 1.1  
> **Last Updated:** 2026-06-09  
> **Stack:** Single-page HTML + Vanilla JS + TailwindCSS CDN (client-side only)

---

## 1. Project Overview

A **single-page, client-side web application** that lets users fill in their career data through form fields and instantly see a live A4 document preview. The app supports two output modes — a concise **Resume** (1-page target) and a comprehensive **Academic CV** (multi-page). Documents can be exported as PDF. All data stays on the user's machine.

### 1.1 Target Users

- Fresh graduates and early-career professionals
- Users who need both a Resume and a CV from the same data
- Non-technical users who want a fast, no-signup builder

### 1.2 Core Value Proposition

- **Zero backend / zero signup** — everything runs in the browser
- **Live preview** — what you type is what you get on the A4 page
- **Dual mode** — toggle between Resume and CV without re-entering data
- **ATS-optimized output** — clean, parseable PDF structure

---

## 2. Functional Requirements

### 2.1 Data Entry (Left Panel — Edit Pane)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | **Contact Information** — Full Name, Headline/Title, Email, Phone, Location, LinkedIn URL, GitHub URL | Must Have |
| FR-02 | **Profile Photo Upload** — Accept image file, display thumbnail, toggle show/hide on PDF, remove photo option | Must Have |
| FR-03 | **Professional Summary** — Free-text textarea, ≤400 characters recommended (ATS check warns if exceeded) | Must Have |
| FR-04 | **Skills Matrix** — Two comma-separated text fields: Hard/Technical Skills and Professional Capacities (Soft Skills) | Must Have |
| FR-05 | **Work Experience** — Repeatable entries: Employer, Job Title, Date Range, Bullet-point achievements (one per line) | Must Have |
| FR-06 | **Education** — Repeatable entries: Institution, Degree, Date Range, Additional Meta (GPA, coursework, activities) | Must Have |
| FR-07 | **Key Projects** — Repeatable entries: Project Title, Tech Stack, Bullet-point descriptions | Must Have |
| FR-08 | **Certifications** — Repeatable entries: Single text field per credential | Must Have |
| FR-09 | **Publications & Thesis** (CV mode only) — Repeatable entries: Title, Journal/Conference, Date, Link | Must Have |
| FR-10 | **Professional Referees** (CV mode only) — Repeatable entries: Name, Designation, Organization, Contact Details | Must Have |
| FR-10a | **Languages** — Repeatable entries: Language, Proficiency (dropdown: Native, Fluent, Professional Working, Conversational, Basic) | Must Have |
| FR-11 | **Add / Remove** buttons on every repeatable section | Must Have |

### 2.2 Document Preview (Right Panel — Preview Pane)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-12 | **Live A4 Preview** — Real-time rendering of all form data into a white A4-sized container (210mm × 297mm) | Must Have |
| FR-13 | **Zoom Controls** — Scale the preview up/down with persistent zoom indicator | Must Have |
| FR-14 | **Section Visibility** — Automatically hide empty sections (no empty headings in output) | Must Have |
| FR-15 | **Page Break Avoidance** — Prevent breaking inside bullet groups and entry blocks (`break-inside: avoid`) | Must Have |

### 2.3 Mode Switching (Resume vs. CV)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-16 | **Resume Mode** — Hides Publications and References sections. Shows "single-page goal" indicator. | Must Have |
| FR-17 | **CV Mode** — Shows all sections including Publications and References. Shows "multi-page permitted" indicator. | Must Have |
| FR-18 | **Shared Data** — Switching modes preserves all entered data; only section visibility changes | Must Have |

### 2.4 Template & Styling

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-19 | **3 Typography Templates** — Classic (Lora Serif), Modern (Inter Sans), Executive (Inter with muted borders) | Must Have |
| FR-20 | **Accent Color Picker** — 4 preset color options (Slate, Blue, Emerald, Indigo) that tint headings and section borders | Must Have |
| FR-21 | **Photo Layout Adaptation** — Template-specific photo placement (side-by-side classic, centered modern, rounded executive) | Should Have |

### 2.5 PDF Export

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-22 | **Client-Side PDF Generation** — Using html2pdf.js (html2canvas + jsPDF). A4 format, portrait. | Must Have |
| FR-23 | **Dynamic Filename** — `Resume_FirstName_LastName_2026.pdf` or `CV_FirstName_LastName_2026.pdf` based on active mode | Must Have |
| FR-24 | **High-Fidelity Output** — 2.5x canvas scale for crisp text, CORS-enabled for photo embedding | Must Have |



### 2.7 ATS Compliance Checker

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-31 | **Real-Time ATS Score** — Percentage badge (0-100%) updated on every preview refresh | Must Have |
| FR-32 | **Check: Linear Structure** — Always passes (clean single-column layout) | Must Have |
| FR-33 | **Check: Photo Warning** — Deducts 10% if photo is enabled in Resume mode | Must Have |
| FR-34 | **Check: Summary Length** — Deducts 15% if summary exceeds 400 characters | Must Have |
| FR-35 | **Check: Skill Density** — Deducts 15% if fewer than 4 hard skills listed | Must Have |
| FR-35a | **Check: Privacy / Sensitive Data** — Deducts 10% if sensitive data (IC/MyKad patterns, marital status, race, religion) is present | Must Have |
| FR-35b | **Check: Quantified Metrics** — Deducts 10% if fewer than 25% of experience bullets contain numbers/percentages | Must Have |
| FR-35c | **Check: Language Section Populated** — Deducts 5% if language entries are empty | Must Have |

### 2.8 UI/UX Features

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-36 | **Toast Notifications** — Slide-up alerts for save/load/export/error feedback | Must Have |
| FR-37 | **Confirmation Modal** — "Are you sure?" dialog before clearing all data | Must Have |
| FR-38 | **Load Default Data** — Pre-populate with Dale Jeffrey's sample career profile | Must Have |
| FR-39 | **Mobile Responsive** — Toggle between Edit and Preview panes on small screens | Must Have |
| FR-40 | **Dark Mode Editor UI** — The editor uses a dark theme (slate/indigo palette); the PDF preview stays white | Must Have |

---

## 3. Non-Functional Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-01 | **No Backend** | Entire application runs client-side. No server, no API calls for core features. |
| NFR-02 | **No User Accounts** | No authentication, no sign-up, no cloud sync. |
| NFR-03 | **Single HTML File** | All HTML, CSS (via TailwindCSS CDN), and JavaScript in one self-contained `.html` file. |
| NFR-04 | **CDN Dependencies** | TailwindCSS, Google Fonts (Inter, Lora, JetBrains Mono), FontAwesome 6.4, html2pdf.js 0.10.1 — all loaded via CDN. |
| NFR-05 | **Browser Support** | Modern evergreen browsers (Chrome, Edge, Firefox, Safari). No IE11 support needed. |
| NFR-06 | **Performance** | Live preview updates must feel instant (<100ms perceived latency for form input changes). |
| NFR-07 | **Print Fidelity** | PDF output must closely match the on-screen A4 preview in layout and typography. |
| NFR-08 | **Privacy** | All user data stays in the browser. No data leaves the device. |
| NFR-09 | **A4 Standard** | Preview and PDF must conform to A4 page dimensions (210mm × 297mm) with appropriate margins. |
| NFR-10 | **ATS Readability** | Output must use clean HTML text (no tables-for-layout, no image-based text) for ATS parsing. |

---

## 4. Data Model

### 4.2 Repeatable Entry Structures (stored as JSON arrays)

| Section | Fields |
|---------|--------|
| Experience | `id`, `company`, `role`, `dates`, `bullets` |
| Education | `id`, `school`, `degree`, `dates`, `meta` |
| Projects | `id`, `title`, `tech`, `bullets` |
| Certifications | `id`, `title` |
| Publications | `id`, `title`, `journal`, `dates`, `link` |
| References | `id`, `name`, `title`, `org`, `contact` |
| Languages | `id`, `language`, `proficiency` |

---

## 5. Constraints & Boundaries

> [!IMPORTANT]
> These constraints keep the project realistic and prevent scope creep.

- **No multi-user support** — this is a personal tool, not a SaaS platform
- **No cloud storage** — no Firebase, Supabase, or server-side database
- **No AI content generation** — the app does not write resume content for the user
- **No drag-and-drop section reordering** — sections follow a fixed order
- **No multiple saved profiles** — one Resume draft and one CV draft at a time
- **No custom template creation** — limited to the 3 built-in templates
- **No internationalization (i18n)** — English-only interface and output
- **No offline-first PWA** — requires CDN access for external libraries

---

## 6. External Dependencies

| Dependency | Version | Purpose | Loaded Via |
|------------|---------|---------|------------|
| TailwindCSS | CDN (latest) | Responsive utility styling | `<script>` tag |
| Google Fonts | — | Inter, Lora, JetBrains Mono typefaces | `<link>` tag |
| FontAwesome | 6.4.0 | Icons for UI and PDF contact row | `<link>` tag |
| html2pdf.js | 0.10.1 | Client-side PDF generation | `<script>` tag |


---

## 7. Acceptance Criteria

1. ✅ User can enter all contact info and see it reflected in the A4 preview in real time
2. ✅ User can add/remove multiple work experience, education, project, and certification entries
3. ✅ Switching between Resume and CV modes shows/hides Publications and References
4. ✅ Changing template (Classic/Modern/Executive) visibly changes fonts and border styles in preview
5. ✅ Changing accent color tints the name and section headers in the preview
6. ✅ PDF download produces a properly formatted A4 document matching the preview
7. ✅ Save Draft persists all data; Load Draft restores it exactly
8. ✅ ATS score updates dynamically as content changes
9. ✅ Clear All shows a confirmation modal and resets all fields when confirmed
10. ✅ App works on desktop (side-by-side panels) and mobile (toggled panels)

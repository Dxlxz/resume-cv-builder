# End-to-end experience plan

**Date:** 2026-10-07 · **Status:** Proposed, nothing built yet · **Owner:** Dale
**Goal:** a first-time job seeker, on a phone or a laptop, gets from the landing page to a PDF they trust to send, without
confusion, data loss or dead ends. This plan turns that into ordered work with a check for each item.

## How this plan was made

I walked the real app in a browser as a first-time user: landing → chooser → blank start → export with nothing filled in →
fill in → preview → 375 px phone view → reload. Items are labelled **Observed** (seen or measured), **Code-read** (found by
reading the code, not yet reproduced) or **Unverified** (a risk I cannot confirm on this machine, usually a real device).

## Baseline (observed, desktop dev server)

| Step | Result |
| --- | --- |
| Landing load | DOM ready in about 240 ms; 507 kB of scripts at startup |
| Landing → builder with a blank draft | 3 clicks, preview iframe present after about 0.8 s |
| Typing → preview refresh | about 470 ms |
| Reload | draft restored, onboarding does not return |

## Research that shaped this plan

Firecrawl research on 2026-10-07 is saved in [research/e2e-experience-2026-10-07.md](research/e2e-experience-2026-10-07.md)
with a certainty grade per claim (most sources are vendor blogs). Short version:

- Phone PDF embedding is unreliable on iOS Safari and Android Chrome (confirmed by several sources); pdf.js on iOS has canvas size
  and memory limits, so render few pages at a time and cap the pixel ratio at 2.
- Leading builders guide people step by step with a progress bar and a live score; the criticism of live scores is that people
  optimise for the number, so ours must read as guidance with ticks, not a pass mark.
- Resume.io's free tier is unusable and its billing draws the loudest complaints; Rizzume being free with no account is a real
  advantage to state on the first screen.
- Malaysian norms are disputed between sources (photo and IC number); treat Malaysian local fields as optional, and test with real
  applicants.
- Playwright's own guidance: user-facing locators, isolated small tests, include WebKit, Linux CI.

## Findings

### Observed defects

| ID | Finding | Why it hurts |
| --- | --- | --- |
| F1 | The first-run welcome alert collapses to a one-word-wide column at desktop width (it is built for a different layout than the editor column) | The first thing every blank-start user sees is broken; the form is pushed below the fold |
| F2 | After "Start blank" focus lands on the page body, not the Full name field | Keyboard and screen-reader users must tab through the toolbar to start typing; everyone loses the "start typing now" cue |
| F3 | Exporting an empty resume opens the full ATS dialog (score 50, 3 errors, 4 suggestions) over the form; Full name appears as "required" and Email as both "required" and "not valid" | The fix is behind a modal; one problem is reported twice; a new user reads it as failure |
| F4 | The toolbar ATS score badge keeps the old number (50) after the user fixes the errors | Looks like the fixes did nothing |
| F5 | A **Letter** section and "0 of 10 sections" appear on a plain Resume | Confusing count and a section most users do not need (cover-letter work is in progress) |
| F6 | The Document popover picks template and theme from plain selects with no picture | The most visual decision in the product is blind |

### Code-read or unverified risks

| ID | Finding | Why it matters |
| --- | --- | --- |
| R1 | The live preview is the browser's built-in PDF viewer in an iframe | Phone browsers (Android Chrome, iOS Safari) often cannot embed multi-page PDFs; the phone user may see nothing or one page. **Unverified: needs real devices.** The pdf.js renderer already exists in `modules/pdf` |
| R2 | The preview shows the browser's own chrome in the dark theme | Looks foreign in dark; cannot be themed |
| R3 | No undo or redo, no per-field history | One bad paste or a removed role is permanent after the confirm dialog |
| R4 | Export is a single blocking click with no "what will I get" step (page count, file name, template) | Users export, open the file, then discover a page-3 spill |
| R5 | No offline signal; if a lazy chunk fails the user now gets a reload card, but nothing explains the PWA-style "works offline" promise | Trust gap for a "local-first" product |
| R6 | Copy and checks are Malaysia-first (good) but there is no language setting and some in-app text mixes tones | Inconsistent voice |

## Principles

1. **Never lose the user's work.** Autosave, undo, confirmations, recoverable removals.
2. **One obvious next step on every screen.** The page tells you what to do first and what is left.
3. **Show, then ask.** Visual choices (template, theme) are shown, not named.
4. **Errors are fixed in place.** No modal between the user and the field they must change.
5. **Works on the device in the user's hand.** Phone is a first-class target, not a squeezed desktop.
6. **Fast and calm.** No layout jumps, no stale numbers, no unexplained waiting.

## Workstreams, in order

Each item has an acceptance check that a person or a test can run. Size: S under a day, M one to three days, L more.

### P0 — Fix what a first-time user hits in the first minute (about one week)

| # | Work | Fixes | Size | Done when |
| --- | --- | --- | --- | --- |
| 1 (done, F-003) | Rebuild the first-run guide as a compact card (one line plus an inline "How this works" disclosure), not a tall alert; remove the layout bug | F1 | S | At 375, 768 and 1440 px the guide is one readable block and the Full name field is visible without scrolling |
| 2 (done, F-003) | After starting, move focus to Full name (blank) or to the preview/first section (sample); announce the new page | F2 | S | A keyboard-only run: Start blank → typing goes into Full name; axe and a focus test pass |
| 3 (done, F-003) | Replace "export opens the ATS dialog" with an inline **fix list**: a banner above the form listing what blocks export, each item jumps to and focuses its field; the ATS dialog stays for the full report | F3 | M | Exporting an empty draft shows the banner, focuses Full name, never a modal; one message per field |
| 4 (done, F-003) | Make the ATS check live: recompute while editing (debounced), show a checklist with a tick per fixed suggestion, and label the number as guidance ("recruiters do not see this score") | F4 | S | Fixing the three blocking errors changes the badge and ticks the items within one second; the copy never implies a pass mark |
| 5 (done, F-003) | Decide Letter's place: show it only for documents that are letters (or behind "Add section") and fix the section count | F5 | S | A blank Resume shows "0 of 9 sections" without Letter |
| 6 (done, F-003) | Phone preview path: use the existing pdf.js page renderer when the browser cannot embed PDFs (feature-detect `navigator.pdfViewerEnabled` and touch devices). Rules from the research: cap the pixel ratio at 2, render one or two pages at a time, release canvases when pages scroll away | R1 | M | On a real iPhone and a real Android phone the Preview tab shows every page, zoomable, within 2 s, with no blank page after a 20-edit session; the fallback is tested in Playwright WebKit and checked on devices |

### P1 — Make decisions easy and mistakes cheap (about two weeks)

| # | Work | Fixes | Size | Done when |
| --- | --- | --- | --- | --- |
| 7 (done, F-004) | **Template and theme gallery**: a visual picker (rendered thumbnails of the user's own content) replacing the selects | F6 | M | Changing template is two clicks with a live thumbnail; keyboard operable; no new dependency |
| 8 | **Undo and redo** for document edits (Ctrl/Cmd+Z, and buttons) with a bounded history in memory | R3 | M | Removing a role then undoing restores it with its bullets; history cleared on "Start fresh" |
| 9 | **Pre-export review step**: a small dialog or panel showing page count, template, file name, blocking issues and warnings, then Download | R4 | M | The user sees "2 pages, A4, aisyah-rahman-resume.pdf" before the download starts; a page-3 spill is flagged with the fix |
| 10 | Inline writing help: per-field hints that appear after typing (metric missing in a bullet, summary too long), the same rules as the ATS check | F3, F4 | M | The ATS dialog's suggestions appear next to the field as they apply |
| 11 | Reorder roles and bullets by drag and keyboard (the Sortable component is already in the app) | — | M | A role moves up with Alt+Up; order shows in the preview |
| 11b | Switching template or preset keeps every piece of content (the leading builders advertise this); show it as a promise and test it | — | S | A journey test changes template three times and compares the extracted PDF text |
| 11c | Malaysian local-format extras, all optional and off by default: SPM results, CGPA out of 4.00, notice period, expected salary, photo. Sources disagree on photo and IC number, so no field is required | — | M | Dale's decision 6; fields appear only when chosen; the ATS proof suite still passes; the preset never prints the IC number |

### P2 — Polish, trust and reach (about two weeks)

| # | Work | Fixes | Size | Done when |
| --- | --- | --- | --- | --- |
| 12 | Make the preview feel native: themed frame, page thumbnails, zoom, "fit width", page count that matches export | R2 | M | Dark theme preview has no foreign chrome; page count equals the exported PDF (existing parity test stays green) |
| 13 | A real offline story: service worker for the app shell and fonts; an honest "works offline" indicator | R5 | M | The built app opens and edits with the network off after one visit |
| 14 | Content pass: one voice, plain English first, Bahasa Malaysia for labels where the Malaysia preset is chosen (decide scope first) | R6 | M | A copy review finds no mixed tone; strings live in one place |
| 15 | Keyboard shortcut sheet (save is automatic; undo, export, ATS check, jump to section) | — | S | `?` opens a list; each shortcut is tested |
| 16 | Empty-state and first-sample polish: "See a sample" explains how to clear it and keeps a one-click "Start fresh" visible | — | S | A sample user can reach a clean draft in two clicks without hunting |

### P3 — Measure it (starts in week one, runs forever)

| # | Work | Done when |
| --- | --- | --- |
| 17 | **End-to-end journey tests** in a real browser (Playwright), following its official practices: locators by role and label, a fresh browser context per test, small single-purpose journeys, Chromium plus WebKit plus a phone profile, Linux CI, only the needed browsers installed. Journeys: first-time blank start, sample start, import JSON and PDF, export blocked then fixed, reload keeps the draft, theme switch, template switch keeps content | Eight journeys pass in Chromium and WebKit, plus phone emulation, in under 5 minutes; a failing journey blocks merge |
| 18 | Real-device pass before each release: iPhone Safari, Android Chrome, desktop Firefox, desktop Safari (checklist in the repo) | Checklist signed by Dale for the release |
| 19 | Experience budgets as checks: startup scripts at most 520 kB, builder route at most 200 kB, preview refresh under 600 ms, no layout shift on first paint | `pnpm run build` and a Playwright timing step fail when exceeded |
| 20 | Local-only quality notes: an optional "how did that go?" after the first export, stored in the browser and exportable, no tracking | Decision needed from Dale (see below) |

## Success measures (what "very good" means here)

- A new user reaches a downloaded PDF in **under 10 minutes** with no help (tested with five real people).
- **Zero** modal dialogs between a user and the field they must fix.
- **Zero** lost drafts across reloads, tab crashes and storage-full (existing recovery plus undo).
- Phone: all journeys complete on iPhone Safari and Android Chrome with every page of the preview visible.
- Accessibility: axe clean in both themes on every screen and every open overlay (extend the existing tests), keyboard-only
  completion of every journey.

## Order of work

Week 1: items 1–5 and the first four journey tests (17), then item 6 with a device check. Weeks 2–3: items 7–11.
Weeks 4–5: items 12–16. The journey tests and budgets (17–19) grow with each item rather than waiting for the end.
Each group is an L2 change under CLEAR lite with its own packet and an independent review.

## Decisions I need from Dale

1. **Phone preview:** is "pages rendered by pdf.js on phones, native viewer on desktop" acceptable, or should every device
   use the pdf.js view for consistency (costs about 480 kB of lazy-loaded script, which is already in the app)?
2. **Letter:** should cover letters stay inside this builder (and then need their own start path) or wait until the
   cover-letter feature is finished and be hidden for now?
3. **Language:** English only, or Bahasa Malaysia labels for the Malaysia preset?
4. **Feedback (item 20):** a local-only note after export, or nothing at all?
5. **Test people:** can you line up five real job seekers for the 10-minute test after week 3? Include applicants from Malaysia
   who would use the local format, since the public sources disagree on photo and IC number.
6. **Malaysian local fields (item 11c):** add optional SPM, CGPA, notice period, expected salary and photo, or keep the
   preset international-style only?

## Not in this plan

Accounts, cloud sync, collaboration, AI writing help (removed on purpose), new document types, and any change to the PDF
engine or the document schema.

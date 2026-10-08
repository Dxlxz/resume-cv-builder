# F-003 — The first minute: P0 of the E2E experience plan

**Status:** Closed · **Class:** L2 / U2 · **Owner:** Dale · **Closed:** 2026-10-07

## User, problem, and outcome

A first-time job seeker starts a blank resume and must reach a first export without confusion. The walkthrough in
[E2E_EXPERIENCE_PLAN.md](../../../docs/E2E_EXPERIENCE_PLAN.md) found six problems in that minute. Outcome: items 1-6 of the plan are done
and verified: a working first-run guide, focus where the user types, an export-blocked flow that never covers the form, a
live ATS check with ticks, no stray Letter section, and a preview that works on phones.

## In scope

- Plan items 1-6, exactly as written there (and the research rules for item 6).
- Tests and browser checks for each.

## Non-goals

- Plan items 7 onward (template gallery, undo, pre-export review, and so on).
- No change to the document schema, the PDF output, the layout engine or the cover-letter feature's behavior. The Letter
  section is hidden in the editor for resumes and CVs; nothing is removed from saved documents.
- No new dependency.
- No change to the ATS rules themselves, except that one field never reports two messages.

## Actors, permissions, and business rules

One actor, the browser user; nothing leaves the browser. Choosing the canvas preview is automatic (feature detection) and
needs no user setting.

## Primary flow, and edge, failure and recovery behaviour

Start blank → guide and focus on Full name → type → live ATS check updates → Export. Export with a blocking error shows a fix
list in the editor, focuses the first invalid field and opens no dialog. Edge: on a touch device the page does not
auto-focus (it would open the keyboard); if the PDF library fails to load on a phone, the preview shows an error with a
Download link instead of a blank pane. Recovery: `git checkout` the listed files.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | When a blank Resume is opened, the editor shall list nine sections and no Letter. | `src/modules/editor/EditorPanel.test.tsx` | EditorPanel.test.tsx passes; browser: 9 form sections, no Letter | Pass |
| AC-2 | If a Resume holds letter content, then the editor shall still list the Letter section. | `src/modules/editor/EditorPanel.test.tsx` | EditorPanel.test.tsx passes | Pass |
| AC-3 | When the first-run guide is shown, it shall be one block no wider than the editor column at 375, 768 and 1440 px. | browser measurement at three widths | Browser: guide is one block, 343 px at 375, 721 px at 768, 520 px at 1440 (equal to the Contact form column); no horizontal scroll | Pass |
| AC-4 | When the user starts a blank document with a fine pointer, focus shall move to the Full name field. | `src/app/BuilderLayout.test.tsx` | BuilderLayout.test.tsx passes; browser: focus on contact-full-name after Start blank | Pass |
| AC-5 | When the pointer is coarse, the builder shall not move focus automatically. | `src/app/BuilderLayout.test.tsx` | BuilderLayout.test.tsx passes; browser at 375 px with coarse pointer: focus stays on body | Pass |
| AC-6 | When Export PDF is pressed with a blocking error, the app shall not open a dialog. | `src/modules/toolbar/Toolbar.test.tsx` | Toolbar.test.tsx passes; browser: no dialog after Export PDF on empty draft | Pass |
| AC-7 | When Export PDF is pressed with a blocking error, focus shall move to the first invalid field. | `src/modules/toolbar/Toolbar.test.tsx` | Toolbar.test.tsx passes; browser: focus stays on/returns to contact-full-name | Pass |
| AC-8 | When validation runs, each field shall report at most one error message. | `packages/validators/src/contact-errors.test.ts` | contact-errors.test.ts passes (3 tests) | Pass |
| AC-9 | When a blocking error is fixed, the toolbar ATS badge shall update within one second. | `src/modules/toolbar/Toolbar.test.tsx` | Toolbar.test.tsx passes; browser: tick shown 159 ms after typing | Pass |
| AC-10 | When an issue is fixed, the fix list and the ATS panel shall show it with a tick. | `src/shared/hooks/useTrackedIssues.test.ts` and `src/modules/toolbar/LintPanel.test.tsx` | useTrackedIssues.test.ts, LintPanel.test.tsx, Toolbar.test.tsx pass; browser shows (fixed) and Ready line | Pass |
| AC-11 | The ATS panel shall describe the score as guidance that recruiters do not see. | `src/modules/toolbar/LintPanel.test.tsx` | LintPanel.test.tsx passes; badge aria-label reads ATS guidance score | Pass |
| AC-12 | When the browser reports no inline PDF viewer or a coarse pointer, the preview shall use the canvas renderer. | `src/modules/pdf/preferCanvasPdf.test.ts` | preferCanvasPdf.test.ts passes (4 tests) | Pass |
| AC-13 | The canvas renderer shall cap the pixel ratio at 2 and keep at most three page canvases drawn. | `src/modules/pdf/PdfPageViewer.test.tsx` | PdfPageViewer.test.tsx passes; browser canvas 638 px for 319 px CSS at dpr 2 | Pass |
| AC-14 | At 375 px with a touch device profile, the Preview tab shall show a drawn canvas for every page. | browser at 375 px | Browser at 375 px, coarse pointer, 2-page sample: 2 canvases drawn (638 px for 319 px CSS at dpr 2), no iframe | Pass |
| AC-15 | When `pnpm test` runs, every baseline test shall pass except the 3 baseline failures in `coverLetter.test.ts`. | `pnpm test` vs baseline (262 passed, 3 failed) | 303 tests: 300 passed, 3 failed (the coverLetter baseline) | Pass |
| AC-16 | When `pnpm run modules:check` and `pnpm run lint` run, both shall exit 0. | both commands | tsc, lint and modules:check clean | Pass |
| AC-17 | When the accessibility tests run, the fix list, the first-run guide and the canvas preview shall have no axe violation in both themes. | `src/test/a11y.test.tsx` | a11y.test.tsx 18 passed (guide, fix list, canvas viewer; both themes) | Pass |
| AC-18 | When `pnpm run build` runs, the scripts loaded at startup shall total at most 520 kB. | `pnpm run build`, scripts in `dist/index.html` | 510 kB at startup (dist/index.html scripts) | Pass |

Review fixes (independent review, round 1): B1 fix list reset on new document, B2 pdf.js document leak, N1 focus return, N2 issue identity, N4 fresh tracking per opening, N5 badge text, N6 heading role, N9 lazy load when hidden, NB1 pages chosen by distance from the screen (`pickLivePages`); both blockers have regression tests that fail when reverted.

Excluded, and residual risk: no real iPhone or Android phone is available here, so AC-14 is checked in the browser pane's
touch emulation only; the plan keeps a real-device pass (item 18) for that.

## Risks and assumptions

- Assumption: `navigator.pdfViewerEnabled` is false on Android Chrome and true on iOS Safari, so touch detection is needed
  as well (the research note says iOS iframes show only the first page).
- Risk: pdf.js canvases use memory on iOS. Mitigation: pixel ratio cap of 2, at most three canvases drawn, release off-screen.
- Risk: live linting on every edit costs CPU. Mitigation: 500 ms debounce, same cost as the existing 400 ms preview debounce.

## Scope Lock

- **Approved by:** Dale, in session — "START P0 ITEMS 1-6 FROM THE PLAN"
- **Date:** 2026-10-07
- **Branch:** feat/templates-ats-interop (working tree also holds Dale's uncommitted cover-letter work)
- **Deferred candidates:** plan items 7 onward; Dale's open decisions 1 (phone preview approach is taken as the plan states it) and 2 (Letter is hidden for resumes and CVs, not removed).

# F-004 — Template gallery and three new templates

**Status:** Closed · **Class:** L2 / U3 · **Owner:** Dale · **Closed:** 2026-10-07

## User, problem, and outcome

A job seeker picks a template from a plain dropdown of names, so they cannot see what each one does to their own content,
and the set lacks the layouts the best-known ATS-friendly resumes use (a dense one-pager, a Harvard-style serif page, a
main column with a narrow right rail). Outcome: a gallery of live thumbnails of the user's own resume, and three new
templates designed here, each proven by the ATS extraction suite.

Research and visual review: [ats-templates-2026-10-07.md](../../../docs/research/ats-templates-2026-10-07.md).

## In scope

- Plan item 7: a template gallery opened from the Document menu, replacing the Template select.
- Three new templates: `ivy` (serif, centered, ruled), `compact` (dense one-pager) and `split` (main column with a right rail).
- The document schema's template list grows by three values; saved drafts keep loading.
- Module map: a new `gallery` module; `editor` may import it.

## Non-goals

- No copied template. Layouts are our own, informed by the research; no third-party artwork, fonts or code.
- No photo, icon or text-box features. Every template keeps real text in a controlled reading order.
- No new theme colours or fonts beyond the three existing themes; no new dependency.
- The existing six templates keep their look (a review of their weaknesses may be recorded, not fixed here).

## Actors, permissions, and business rules

One actor, the browser user. Nothing leaves the browser: thumbnails are made on the device from the open draft.

## Primary flow, and edge, failure and recovery behaviour

Document menu → "Browse templates" → a dialog shows one card per template, each with a thumbnail of the user's page 1
→ choose a card → the template (and its matching theme) applies and the dialog closes. Edge: thumbnails appear one at a
time, so the dialog opens at once with placeholders; if one fails, its card shows its name and a note, and can still be
chosen. Empty draft: thumbnails show the template's structure with the user's (possibly empty) content. Recovery:
`git checkout` the listed files; drafts that name a new template id would not load in an older build.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | When the user opens Browse templates, the gallery shall list every template in the registry. | `src/modules/gallery/TemplateGallery.test.tsx` | TemplateGallery.test.tsx passes | Pass |
| AC-2 | The gallery shall draw each card's thumbnail from the user's own document. | `src/modules/gallery/TemplateGallery.test.tsx` | TemplateGallery.test.tsx and useTemplateThumbnails.test.ts pass; headless Chrome: 9 canvases drawn from the sample resume | Pass |
| AC-3 | When the user chooses a card, the app shall set that template and close the dialog. | `src/modules/gallery/TemplateGallery.test.tsx` | TemplateGallery.test.tsx passes | Pass |
| AC-4 | The gallery shall be operable with the keyboard alone, with arrow keys moving between cards. | `src/modules/gallery/TemplateGallery.test.tsx` | TemplateGallery.test.tsx passes (arrow keys, current marked) | Pass |
| AC-5 | While the gallery is closed, the app shall not generate any thumbnail. | `src/modules/gallery/useTemplateThumbnails.test.ts` | useTemplateThumbnails.test.ts passes | Pass |
| AC-6 | The app shall generate thumbnails one at a time. | `src/modules/gallery/useTemplateThumbnails.test.ts` | useTemplateThumbnails.test.ts passes (peak concurrency 1) | Pass |
| AC-7 | When a thumbnail fails, its card shall stay selectable. | `src/modules/gallery/TemplateGallery.test.tsx` | TemplateGallery.test.tsx passes | Pass |
| AC-8 | The template list shall include `ivy`, `compact` and `split`, and a saved draft with an older template id shall still load. | `packages/core/src/schema/templateIds.test.ts` | registry.test.ts and templateIds.test.ts pass (every id parses; unknown id rejected); migrate tests unchanged and green | Pass |
| AC-9 | When each template renders the sample resume and the sample CV, every field shall be extractable in reading order. | `packages/validators/src/ats-proof/atsProof.test.ts` | atsProof.test.ts passes for ivy, compact, split on resume, CV and edge cases (rendered without a layout plan: tests run in node; paginated output checked in the real app) | Pass |
| AC-10 | When the `split` template renders, the main column's text shall come before the rail's text in the extracted PDF. | `packages/validators/src/ats-proof/atsProof.test.ts` | atsProof.test.ts passes; the same assertion fails on the left-rail sidebar template (mutation check) | Pass |
| AC-11 | The new templates shall pass the existing error and type lints (contrast, size, line height, font count) on the sample resume and CV. | `packages/validators/src/new-templates-lint.test.ts` | new-templates-lint.test.ts passes (6 cases, now also asserts no TYPE_* issue); layout lints need a DOM plan and were checked by eye in the real app | Pass |
| AC-12 | When the gallery is open, it shall have no axe violation in both themes. | `src/test/a11y.test.tsx` | a11y.test.tsx 20 passed (gallery, both themes) | Pass |
| AC-13 | When all tests run, every baseline test shall pass except the 3 baseline failures in `coverLetter.test.ts`. | `pnpm test` vs baseline (300 passed, 3 failed) | 354 tests: 351 passed, 3 failed (the coverLetter baseline) | Pass |
| AC-14 | When `pnpm run modules:check` and `pnpm run lint` run, both shall exit 0. | both commands | tsc, lint and modules:check clean | Pass |
| AC-15 | When `pnpm run build` runs, the scripts loaded at startup shall total at most 520 kB. | `pnpm run build`, scripts in `dist/index.html` | 512.2 kB at startup | Pass |
| AC-16 | In the browser, each new template shall look clean on page 1 and on page 2 of the sample, at the size a reader sees. | screenshots reviewed by the author and the reviewer | Rendered the three templates to PNG (resume and CV) and viewed them; headless Chrome of the real app shows Split on a 2-page CV | Pass |
| AC-17 | When a two-column template is laid out, the planner shall measure each column at the width the renderer draws it. | `packages/styles/src/shared/columnGeometry.test.ts` | columnGeometry.test.ts passes (padding plus text equals outer widths; plan widths equal geometry for sidebar and split); real app: Split wraps at the planned widths | Pass |

Excluded, and residual risk: no real recruiter or parser vendor is available, so "ATS-friendly" means the repo's own
extraction suite (pdf.js reading order and field coverage), not a vendor's parser. Sources on two-column parsing disagree;
`split` is therefore marked as a multi-column template and `ats-strict` stays the portal choice.

## Risks and assumptions

- Assumption: the layout engine's column mode can place the rail on the right with a small option, without a second planner.
- Risk: thumbnails cost CPU (one PDF render each). Mitigation: only while the dialog is open, one at a time, cached per
  document revision, page 1 only.
- Risk: three more templates widen what the lint and measure code must handle. Mitigation: they only set existing profile
  options plus one new option (rail side); the ATS suite loops every template id.

## Scope Lock

- **Approved by:** Dale, in session — "okay,, implement. also there are much better page tempalte of ats friendly resume and cv. research firecrawls, use tasb, see vision, and make our own."
- **Date:** 2026-10-07
- **Branch:** feat/templates-ats-interop (working tree also holds Dale's uncommitted cover-letter work)
- **Deferred candidates:** plan items 8 onward (undo, pre-export review, ...); redesigning the six existing templates; DOCX export; themes beyond the three existing.

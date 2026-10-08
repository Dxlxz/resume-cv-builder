# F-003 — Tasks

## Slices

- [x] **T1 — Guide, focus, Letter** (plan items 1, 2, 5) · covers AC-1..AC-5
  - Test that fails first: `EditorPanel.test.tsx` expects nine sections; `BuilderLayout.test.tsx` expects focus
  - Evidence: EditorPanel/SectionList/BuilderLayout tests pass; browser checked
- [x] **T2 — Fix list and live ATS** (items 3, 4) · covers AC-6..AC-11
  - Test that fails first: `Toolbar.test.tsx`, `contact-errors.test.ts`, `useTrackedIssues.test.ts`
  - Evidence: Toolbar, LintPanel, useTrackedIssues, contact-errors tests pass; browser checked
- [x] **T3 — Phone preview** (item 6) · covers AC-12..AC-14
  - Test that fails first: `preferCanvasPdf.test.ts`, `PdfPageViewer.test.tsx`
  - Evidence: preferCanvasPdf and PdfPageViewer tests pass; browser canvas at 375 px
- [x] **T4 — Gates, accessibility, review** · covers AC-15..AC-18
  - Evidence: All gates green; startup scripts 510 kB; a11y 18 passed

## Harden

| Defect class that came back | Kind | Check added | Where |
| --- | --- | --- | --- |
| A new state (banner, canvas viewer) not covered by axe | Detect | states added to the accessibility test | `src/test/a11y.test.tsx` |
| One field, two messages | Detect | per-field uniqueness test over the validators | `packages/validators/src/contact-errors.test.ts` |

## Closure — the last tasks, so nothing outlives the change

- [x] Every AC row in `spec.md` has a result and linked evidence.
- [x] Durable outcomes promoted: plan items 1-6 marked done in `docs/E2E_EXPERIENCE_PLAN.md`; AGENTS.md if a rule changed.
- [x] Independent review PASS recorded (L2+): round 3, 2026-10-07.
- [x] Set `spec.md` **Status: Closed** and `Closed: <date>`, then remove this folder in the same commit.

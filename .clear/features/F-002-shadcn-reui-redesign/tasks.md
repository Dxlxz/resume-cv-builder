# F-002 — Tasks

## Slices

- [x] **T0 — Remove the AI feature** · covers AC-1, AC-16..AC-19 baseline
  - Surfaces: `src/modules/ai`, `api/`, `document` (edit plans, store state), `FormSection`, `EditorPanel`, `BuilderLayout`, `vite.config.ts`, env typings, docs, `modules.json`, `react-markdown`
  - Test that fails first: grep for `Idrizz|/api/ai|react-markdown` found 100+ hits
  - Evidence: grep returns no hit; build, lint, modules:check pass; 221 passed + 3 baseline failures; entry chunk 574.85 kB
  - Recovery: `git checkout` the listed paths
- [x] **T1 — Foundation** · covers AC-2..AC-11, AC-16..AC-19
  - Surfaces: `components.json`, root `tsconfig.json`, `package.json`, `src/index.css`, `src/shared/ui/*`, `src/shared/theme/*`, `design-system.test.ts`, `MANIFEST.json`
  - Test that fails first: `design-system.test.ts` (fails on the UDS tree)
  - Evidence: `design-system.test.ts` and `ThemeProvider.test.tsx`; contrast test fails when a token is lightened; registry code reviewed, two lint and two accessibility defects fixed at the source
  - Recovery: `git checkout` the listed paths and `pnpm install`
- [x] **T2 — Shell, landing, chooser** · covers AC-12..AC-14, AC-21
  - Evidence: landing and chooser viewed in light and dark; browser axe 0 violations; 320 px reflow checked (one overflow fixed)
- [x] **T3 — Builder frame, preview, toolbar** · covers AC-12..AC-14, AC-21
  - Evidence: builder viewed at 1440, 768 and 375; native confirm and alert replaced by dialogs and toasts
- [x] **T4 — Editor, forms, pickers** · covers AC-15, AC-12..AC-14, AC-21
  - Evidence: `SectionList.test.tsx` and `EditorPanel.test.tsx`; accordion clipping at 320 px fixed
- [x] **T5 — Overlays, ATS checker, retire UDS and the compat layer** · covers AC-5, AC-6, AC-12..AC-21
  - Evidence: UDS and the compat layer deleted; `a11y.test.tsx`; full gates green; initial scripts 507.08 kB

## Harden

| Defect class that came back | Kind | Check added | Where |
| --- | --- | --- | --- |
| Primitive engine imported by feature code, or a second component set | Detect | AC-3, AC-4 in `design-system.test.ts` | `src/shared/ui/design-system.test.ts` |
| Token missing in dark theme, or low contrast | Detect | AC-7..AC-9 | same |
| Inaccessible screen | Detect | axe over every screen in both themes | `src/test/a11y.test.tsx` |
| Palette utilities in JSX | Prevent | existing ESLint `no-primitive-tailwind` | `eslint.config.js` |

## Closure — the last tasks, so nothing outlives the change

- [x] Every AC row in `spec.md` has a result and linked evidence (AC-21 recorded as Partial).
- [x] Durable outcomes promoted to their owners: design system → `docs/decisions/shadcn-reui-design-system.md` and `docs/architecture.md`; README Styling section; `AGENTS.md` hard rules; debt D-003 in `.clear/debt-register.md`.
- [ ] Independent review PASS recorded (L2+).
- [ ] Set `spec.md` **Status: Closed** and `Closed: <date>`, then remove this folder in the same commit; the commit
      message carries `Promoted:` and `Evidence:`. Git keeps the history.

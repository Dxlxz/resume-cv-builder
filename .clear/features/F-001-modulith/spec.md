# F-001 — Modulith: enforced module boundaries

**Status:** Ready for Dale (not committed) · **Class:** L2 / U0 · **Owner:** Dale · **Closed:** (set at closure — see tasks.md)

## User, problem, and outcome

Rizzume calls itself a modular monolith ([architecture.md §1.4](../../../docs/architecture.md)), but the boundaries
are not enforced and have eroded. Measured on 2026-10-07 (production files only, tests excluded):

- the `@rb/*` packages contain import cycles: `layout ↔ render`, `render ↔ templates`, `render ↔ styles`,
  `templates ↔ layout`, `templates ↔ styles`;
- `src/` is layered by file type (`components/`, `lib/`, `store/`, `hooks/`, `features/`), not by module, with
  cycles `store ↔ lib/storage`, `store ↔ features/ai` and a shared UI file (`components/ui/FormSection`) that imports
  the store and the AI feature.

Outcome: every part of the repository is a module with a declared public entry and a declared list of modules it may
depend on, and a check that fails when either is violated. Behavior, UI, saved-draft format and exported PDFs stay
byte-for-byte compatible in test evidence.

## In scope

- Break every package cycle by moving pure code to the lower package that owns it; add one new package
  `@rb/pipeline` for the two orchestrators that sit above every other package.
- Reorganize `src/` into `src/modules/<module>/` (each with an `index.ts` public API), `src/shared/` and `src/app/`
  (composition root).
- Declare the module map in `.clear/architecture/modules.json`, enforce it with `scripts/check-modules.mjs`, run by
  `pnpm run modules:check` and by `pnpm test`.
- Update the import paths in the private `personal/` scripts that the moves break (specifiers only).
- Update `README.md`, `ARCHITECTURE.md`, `docs/architecture.md` to the new layout.

## Non-goals

- No change to behavior, UI, document schema, persistence format or PDF output.
- No new runtime dependency.
- No encapsulation of deep imports inside a package (`@rb/render/blocks/...` stays legal); recorded as debt D-001.
- No change to the in-progress cover-letter work (`LetterForm`, `coverLetter.test.ts`), including its 3 failing tests; the only edit to those files is the import specifiers the move rewrites.
- No rename of the `@rb` scope or of existing packages other than the new one.

## Primary flow, and edge, failure and recovery behaviour

Each slice is a mechanical move plus import rewrite, verified green on its own. A slice that leaves the suite worse
than the baseline is reverted with `git checkout`/`git mv` back; nothing is committed until the whole change is green.

## Acceptance

| ID | Criterion | Check | Evidence | Result |
| --- | --- | --- | --- | --- |
| AC-1 | When `pnpm run modules:check` runs, the production import graph between `@rb/*` packages shall contain zero cycles. | `pnpm run modules:check` exits 0 | `modules:check — no violations` (was 2 cycle groups, 17 edge violations before T2) | Pass |
| AC-2 | When `pnpm run modules:check` runs, every production import between packages shall appear in the package allow-list of `.clear/architecture/modules.json`. | `pnpm run modules:check` exits 0 | same run | Pass |
| AC-3 | When `pnpm run modules:check` runs, every import in `src/` that crosses a module boundary shall resolve to `@/modules/<module>` or `@/shared/**`. | `pnpm run modules:check` exits 0 | same run (was 54 deep-import violations before the entries existed) | Pass |
| AC-4 | When `pnpm run modules:check` runs, the dependency graph between `src/` modules shall be acyclic and contained in the module allow-list. | `pnpm run modules:check` exits 0 | same run | Pass |
| AC-5 | If a file imports a package or module that is not in its allow-list, then `scripts/check-modules.mjs` shall report the file and the import, and exit non-zero. | `pnpm test scripts/check-modules.test.ts` injected-violation cases | 18 tests pass: rules P1, P2, P3, M1, M2, M3, M4, M5, relative cross-package and relative cross-module imports; ESLint rule probe fired on an injected deep import and an injected package import | Pass |
| AC-6 | When `pnpm test` runs, every test that passed on the baseline shall pass. | `pnpm test` passed count vs baseline (246 passed) | 264 passed = 246 baseline + 18 new checker tests | Pass |
| AC-7 | When `pnpm test` runs, the only failing tests shall be the 3 baseline failures in `coverLetter.test.ts`. | `pnpm test` failed list vs baseline | the same 3 tests fail, no others | Pass |
| AC-8 | When `pnpm run build` runs, it shall exit 0. | `pnpm run build` exit code | `tsc -b && vite build` built in 2.05s | Pass |
| AC-9 | When `pnpm run build` runs, the output shall contain separate lazy chunks for `pdf` and `renderDocumentToPdf`. | `pnpm run build` chunk list vs baseline | `pdf-*.js` 482.27 kB and `renderDocumentToPdf-*.js` 1,435.59 kB, identical sizes to baseline | Pass |
| AC-10 | When `pnpm run build` runs, the entry chunk shall be at most 715.5 kB (baseline 701.49 kB plus 2%). | `pnpm run build` chunk sizes | `index-*.js` 701.44 kB | Pass |
| AC-11 | When `pnpm run lint` runs, it shall exit 0. | `pnpm run lint` exit code | no problems (baseline needed `tmp` added to the ESLint ignores) | Pass |
| AC-12 | After the change, the current docs shall name no moved path that no longer exists. | `rg` for each moved path in `README.md`, `ARCHITECTURE.md`, `docs/` returns no hit | grep for every moved path returns no hit; reviewer re-ran it independently | Pass |
| AC-13 | When the app is started, the builder page shall load the editor and a live preview and log no console error beyond the 2 `flushSync` errors present on `HEAD`. | browser: `pnpm run dev`, `/` then Malaysia Corporate then See a sample | editor with 9 inputs and 10 sections, preview iframe holding a `%PDF-1.3` blob of 25,175 bytes; the only console errors are the same `flushSync` pair that a pristine `HEAD` copy logs | Pass |
| AC-14 | When Export PDF is pressed, the app shall download a PDF. | browser: press Export PDF | not run: a download needs Dale's approval; `generatePdf` (what the button calls) is covered by `modules/pdf/pdf.test.ts` | Not run |

Excluded, and residual risk: browser behavior is checked once at the end, not per slice; AC-14 was not clicked
through; the 3 baseline failures are the in-progress cover-letter feature and stay failing until that work lands;
the two `flushSync` console errors predate this change (reproduced on a pristine `HEAD`).

## Risks and assumptions

- Assumption: vitest `vi.mock` targets resolve by file path, so moved files keep their mocks working once the mock
  specifier is rewritten (verified by the test run).
- Risk: a barrel (`index.ts`) can pull a lazy chunk into the entry chunk. Mitigation: AC-9 and AC-10 compare chunks.
- Risk: the new package changes `pnpm-lock.yaml`. Mitigation: regenerate with `pnpm install`, confirm the diff is one
  importer entry, keep `--frozen-lockfile` passing.

## Scope Lock

- **Approved by:** Dale, in session — "APPLY CLEAR LITE INTO THIS REPO. ORGANIZE THIS REPO INTO BETTER MODULAR
  MODULITH. AND ENSURE MUST ORGANIZE USING MODULES"
- **Date:** 2026-10-07
- **Branch:** feat/templates-ats-interop (working tree also holds Dale's uncommitted cover-letter work)
- **Deferred candidates:** package deep-import encapsulation (D-001); splitting `documentStore.ts` (560 lines).

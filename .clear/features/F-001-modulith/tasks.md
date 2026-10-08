# F-001 — Tasks

## Slices

- [x] **T1 — Boundary checker with the target map, failing on today's tree** · covers AC-1..AC-5
  - Surfaces: `.clear/architecture/modules.json`, `scripts/check-modules.mjs`, `scripts/check-modules.test.ts`, `package.json` script
  - Test that fails first: `pnpm run modules:check` reports the known cycles and `src` violations
  - Evidence: checker failed on the old tree (17 P1, 2 P3); 11 injected-violation cases passed
  - Recovery: delete the three files
- [x] **T2 — Break package cycles; add `@rb/pipeline`** · covers AC-1, AC-2, AC-6..AC-8
  - Surfaces: `packages/*`, `tsconfig.app.json`, `vite.config.ts`, `pnpm-lock.yaml`, `personal/scripts`
  - Test that fails first: T1's package cycle report
  - Evidence:
  - Recovery: `git checkout -- packages` plus removing `packages/pipeline`
- [x] **T3 — Move `src/` into modules, shared and app** · covers AC-3, AC-4, AC-6..AC-10
  - Surfaces: `src/**`, `personal/scripts`, `vite.config.ts`
  - Test that fails first: T1's `src` violation report
  - Evidence:
  - Recovery: `git checkout -- src`
- [x] **T4 — Lint enforcement and docs** · covers AC-11, AC-12
  - Surfaces: `eslint.config.js`, `README.md`, `ARCHITECTURE.md`, `docs/architecture.md`, `AGENTS.md`
  - Evidence:
  - Recovery: `git checkout` the files
- [x] **T5 — Browser check and independent review** · covers AC-13
  - Evidence:

## Harden

| Defect class that came back | Kind | Check added | Where |
| --- | --- | --- | --- |
| Package or module cycle / boundary erosion | Detect | `modules:check` plus its test in `pnpm test` | `scripts/check-modules.mjs` |
| Deep import into another module's internals | Detect | same checker, rule "cross-module imports use the entry" | `scripts/check-modules.mjs` |

## Closure — the last tasks, so nothing outlives the change

- [x] Every AC row in `spec.md` has a result and linked evidence (AC-14 recorded as not run).
- [ ] Durable outcomes promoted to their owners: module map → `.clear/architecture/modules.json` and `docs/architecture.md`; check → `AGENTS.md` §2; debt D-001 → `.clear/debt-register.md`.
- [ ] Independent review PASS recorded (L2+).
- [ ] Set `spec.md` **Status: Closed** and `Closed: <date>`, then remove this folder in the same commit; the commit
      message carries `Promoted:` and `Evidence:`. Git keeps the history.

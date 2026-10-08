# F-004 — Tasks

## Slices

- [x] **T1 — Gallery** (plan item 7) · covers AC-1..AC-7, AC-12
  - Test that fails first: `TemplateGallery.test.tsx`, `useTemplateThumbnails.test.ts`
  - Evidence: gallery tests (9) and a11y pass; headless Chrome shows nine drawn thumbnails
- [x] **T2 — Three templates** · covers AC-8..AC-11, AC-16
  - Test that fails first: `atsProof.test.ts` over the new ids; `document.test.ts` for the id list
  - Evidence: atsProof, registry, templateIds, columnGeometry and lint tests pass; PNGs viewed; Split viewed in the real app
- [x] **T3 — Gates and review** · covers AC-13..AC-15
  - Evidence: gates re-run after review round 1; see spec

## Harden

| Defect class that came back | Kind | Check added | Where |
| --- | --- | --- | --- |
| A template id added in one place and missing in another (schema, registry, renderer, profiles) | Prevent | the v3 schema enum is built from `TEMPLATE_IDS`, the renderer switch is exhaustive (a type error otherwise), and tests cover registry, profile and a parse round-trip per id | `packages/templates/src/registry.test.ts`, `packages/core/src/schema/v3.ts`, `packages/core/src/schema/templateIds.test.ts`, `packages/pipeline/src/renderDocumentToPdf.tsx` |

## Closure — the last tasks, so nothing outlives the change

- [x] Every AC row in `spec.md` has a result and linked evidence.
- [x] Durable outcomes promoted: plan item 7 marked done in `docs/E2E_EXPERIENCE_PLAN.md`; `docs/architecture.md` module list.
- [x] Independent review PASS recorded (L2+): round 3, 2026-10-07.
- [x] Set `spec.md` **Status: Closed** and `Closed: <date>`, then remove this folder in the same commit.

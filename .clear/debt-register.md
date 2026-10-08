# Debt Register

**Reader:** contributors · **Answers:** which compromises are accepted, and when are they repaid?

A `CLEAR-DEBT:` code marker needs a row here (see [minimal-change](../.agents/skills/minimal-change/SKILL.md)).

| ID | Category | Compromise | Consequence | Containment | Owner | Repayment trigger or deadline | Exit condition | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-001 | Architecture | Packages are enforced as a dependency graph only; deep imports such as `@rb/render/blocks/LayoutBlockPdf` between packages stay legal | A package's internal file layout can still be coupled to by other packages | `modules:check` fixes the package graph; F-001 moved the cycle-forming files | Dale | The next restructure of a package's internals | Each package has an `index.ts` public entry and `modules:check` rejects other packages' deep `@rb/<pkg>/**` imports | Open |
| D-002 | Architecture | Test files (and everything under `src/test/`) are exempt from `modules:check`; several integration tests live in a lower package and import upward (for example `packages/core/src/types/coverLetter.test.ts` renders through `@rb/pipeline`) | A lower package's tests cannot run without the packages above it | Production imports are enforced; tests are not shipped | Dale | When tests are next reorganized | Integration tests live in a top-level location (`src/test/` or a `tests/` package) and `modules:check` includes tests | Open |
| D-003 | Data | `meta.sectionGuides` stays in the document schema, types and JSON export although the AI feature that used it was removed | Saved drafts and JSON exports carry an empty, unused field | Field is optional-valued and ignored by the app | Dale | The next document schema version bump | The field is dropped from `packages/core` schema v4 with a migration | Open |
| D-004 | Architecture | With Typst as the PDF engine (F-006), the preview still computes the react-pdf measure → plan on every edit and stores it; the plan-based lints (page count, spacing) judge react-pdf's page breaks, not the Typst PDF the user sees | A lint can report a page break or count that differs from the Typst PDF; each edit does a DOM measure Typst does not need | The preview's page label uses the real PDF's page count (`countPdfPages`); react-pdf remains the fallback, so its plan is still meaningful | Dale | F-006 stage 3 (retire react-pdf) | Lints read the Typst PDF (page count, extracted positions) and the measure → plan pipeline is removed | In progress: since F-007 the Typst preview skips the measure, so plan-based tips are silent under Typst rather than wrong; they still need Typst-based replacements |

## Status rules

- **Open:** accepted and still present.
- **In progress:** repayment work is approved and active.
- **Resolved:** exit condition has evidence.
- **Accepted permanent:** owner explicitly accepts the consequence; a review date remains when risk can change.

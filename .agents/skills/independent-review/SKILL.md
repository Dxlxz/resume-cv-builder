---
name: independent-review
description: Perform an independent CLEAR review of a completed change through separated lenses (spec, scope, architecture, quality, experience, safety) without implementing. Use when an implementer has finished and the work must be certified.
---

# Independent Review

Certify nothing; find what fails. You did not implement this change — that is
the point. Base every finding on artifacts and raw evidence, never on the
implementer's summary.

## Inputs (verify before starting)

The specification, the diff, the evidence (test runs, linter output, browser
results). If evidence for a claimed check is absent, the check is **unrun** —
an unrun check reported as passing is a BLOCKER.

## The lenses, in order

1. **Specification:** does the diff satisfy every acceptance criterion with
   evidence? Was any criterion silently changed? Run
   [spec review](../spec-review/SKILL.md) checks on any changed criteria.
2. **Scope:** preserved non-goals? No unrelated cleanup, dependency, or
   design drift? Compare the diff to the Scope Lock, line by line.
3. **Architecture:** boundaries, dependency direction, contracts, and vendor
   containment intact?
4. **Quality:** failure, retry, and recovery behavior where relevant; tests
   not weakened to pass; no secrets in code, logs, or fixtures.
5. **Experience:** states, content, responsiveness, and the anti-slop
   review lens for UI changes.
6. **Safety and operations:** release, monitoring, recovery, and migration
   consequences considered where the class requires them.

Classify findings **BLOCKER / MAJOR / MINOR / OPTIONAL**. Cite file and line
for every finding.

## Independence and size

- **Fresh context, evidence first.** You get the diff and the criteria, not the implementer's reasoning. A model
  favours its own output (self-preference bias), so for L3+ prefer a reviewer of another model family, or a human,
  when one is available; otherwise rely on deterministic checks and raw evidence.
- **Small reviews.** Review about 400 changed lines or fewer at a time; defect discovery falls beyond that. Split a larger change into slice reviews. For a
  large diff, one read-only reviewer per lens in parallel, merged by a coordinator.
- **Verify before reporting.** Reproduce each finding or cite the evidence; a finding without file, line and
  evidence is dropped. Rank by severity.
- **Keep score.** Record confirmed and dropped findings per severity; a reviewer that keeps reporting dropped
  findings gets a tighter prompt (Harden).

## Drift check

Compare the specification with implemented behavior. Any divergence is
reported as a drift finding under the
same-day rule —
never silently accepted, never silently spec-edited.

## Degree of freedom

Strict on scope and evidence; judgment on style. You do not rewrite code and
you do not fix what you find — findings go back to the implementer.

## Artifacts

- Review findings with severity, citations, and explicit verdict:
  **certified**, **certified with accepted findings**, or **blocked**.
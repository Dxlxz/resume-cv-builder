---
name: spec-review
description: Run the CLEAR specification quality scorecard on acceptance criteria and return lock-readiness findings. Use when acceptance criteria are drafted, changed, or about to lock, or when the user asks whether a spec is ready.
---

# Spec Review

Review acceptance criteria against the ten-rule scorecard and report
lock-readiness. This is a strict procedure: run the checks, report findings,
never soften a fail.

## Procedure

1. **Run the linter.**

   ```bash
   python scripts/spec-lint.py <spec files> [--glossary <glossary.md>]
   ```

   If Python is unavailable, apply the rules manually and record the linter as
   an unrun check.

2. **Check the ten rules** on every criterion, in order:
   singular · verifiable · implementation-free · one interpretation ·
   active/owned · bounded negation · defined terms · machine-readable form ·
   self-check named · complete set.

   Full conditions: spec quality scorecard.
   Express business rules as decision tables; state transitions as
   event → next-state; criteria in EARS or Given/When/Then.

3. **Classify each finding.**

   - Tier D rules (2 verifiable, 4 one-interpretation, 9 self-check) fail
     lock-readiness for L2+ work.
   - Tier G findings are improvement notes, not blockers.

4. **Report.** For each finding: rule number, the criterion quoted, the
   defect pattern (use the scorecard's gallery names), and the specific fix.

## Degree of freedom

Strict. Do not propose rewritten criteria unless asked; a reviewer rewrites
nothing — findings and fixes only.

## Artifacts

- Findings list mapped to scorecard rules; explicit verdict:
  **lock-ready** or **not lock-ready** with the blocking rules named.
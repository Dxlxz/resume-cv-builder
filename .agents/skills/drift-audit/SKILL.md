---
name: drift-audit
description: Audit whether implemented behavior has diverged from the accepted specification and report drift for same-day correction. Use when a spec may be stale, after behavioral changes, or on schedule during maintenance.
---

# Drift Audit

Find where reality and the specification disagree, classify each divergence,
and route the correction. A drifted spec confers false confidence; the same-day
rule makes correction a defect class, not a backlog item.

## Procedure

1. **List the surfaces to audit** — from the spec's affected surfaces, the
   packet, or the maintenance target.
2. **Compare behavior to criteria.** For each acceptance criterion: run the
   named check if it exists; otherwise inspect the implemented behavior. The
   check evidence is the verdict — reading code and calling it verified is
   not.
3. **Classify each divergence:**
   - *spec defect* — the code is right, the spec is wrong;
   - *implementation defect* — the spec is right, the code is wrong;
   - *undocumented behavior* — real behavior with no criterion at all;
   - *stale scope* — the spec describes retired behavior.
4. **Route corrections.**
   - Spec defects: draft the revision, mark it rev N, and submit to the spec
     owner for same-day approval. Do not edit the spec silently.
   - Implementation defects: file as BLOCKER findings to the implementer.
   - Undocumented behavior: propose criteria or classify as new scope.
   - Stale scope: archive the section with a tombstone note, owner-approved.
5. **Report** every divergence with: criterion, observed behavior, source of
   truth compared, classification, proposed correction, and owner.

## Degree of freedom

Strict procedure. The audit changes no code and edits no spec — it reports
and drafts. Approval is the owner's.

## Artifacts

- Drift report; revised criteria drafts (rev-marked) awaiting owner decision;
  tombstone notes where scope was retired.
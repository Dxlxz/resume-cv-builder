---
name: feature-packet
description: Assemble or audit a CLEAR feature packet (spec, design, tasks) for L2+ work, enforcing size budgets and the no-repetition rule. Use when a feature is entering Scope Lock or a packet needs review for completeness.
---

# Feature Packet

Assemble the packet from existing artifacts, or audit one for Scope Lock
readiness. Do not invent content that requires owner decisions.

## Assembly (when artifacts exist but are scattered)

1. Collect: intent brief or restated intent, spec and acceptance, contracts
   (API/data/UI where boundaries change), implementation plan, tailoring
   record.
2. Compose the packet in one folder of **three files**: `spec.md` (with the
   acceptance table and the classification header: L-class, U-class, owner,
   date), `design.md` (UI and data sections only where they apply) and
   `tasks.md` (slices and the closure tasks). A packet ends: at closure its
   durable outcomes are promoted to their owners and the folder is removed.

   Templates: [feature packet](../../../.clear/templates/feature-packet/README.md).

3. Enforce the **no-repetition rule**: a fact lives in one artifact; others
   cross-reference it. Merge duplicated rules into their authoritative home.
4. Enforce **size budgets**: core artifact ≤ 1 page, packet ≤ 4 pages. Depth
   belongs in linked topic documents, not the packet.

## Audit (when a packet exists)

- [ ] Classification states L-class, U-class, owner, accepted date.
- [ ] Spec passes [spec review](../spec-review/SKILL.md).
- [ ] Contracts exist for every changed boundary; none restate spec rules.
- [ ] Tasks sequence slices with a test that fails first, per-slice evidence and stop conditions, and end with the closure tasks.
- [ ] Non-goals present and unchanged from Intent Lock.
- [ ] Tier D controls (verifiable, one-interpretation criteria; Scope Lock with
      approver and date; no unrun check reported as passing) satisfied or
      recorded N/A with reason.
- [ ] No artifact exceeds its size budget; no rule stated twice.

## Degree of freedom

Flexible on wording, strict on the audit list. A missing Tier D item is a
blocking finding, not a suggestion.

## Artifacts

- Assembled packet folder, or an audit report naming each failed check with
  the owning artifact.
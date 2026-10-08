---
name: scope-change
description: Evaluate discovered work against the active Scope Lock and produce a scope-change proposal for material expansion. Use when implementation uncovers necessary work outside the lock, or when adjacent improvements are tempting.
---

# Scope Change

Discovery is not authorization. This skill is the only sanctioned path from
"we found something" to "we may work on it."

## First: is it actually outside the lock?

Check the lock's non-goals and affected surfaces before proposing anything:

- **Inside:** implement within the current slice; no proposal needed.
- **Required for safe implementation:** a reasonable local refactor or defect
  fix touching only the changed surface — implement, record in the plan.
- **Outside:** propose. Do not start.

## Proposal procedure

1. **State the discovery** in one paragraph: what was found, where, and why it
   matters now.
2. **Classify** against the drift and scope rules:
   - spec defect → route to [drift audit](../drift-audit/SKILL.md);
   - new capability or strategic refactor → scope-change proposal;
   - improvement that can wait → [debt register](../../../.clear/debt-register.md)
     with impact, owner, trigger, exit condition.
3. **Draft the proposal** using the
   [scope-change template](../../../.clear/templates/scope-change.md): the addition, its
   consequence, options with trade-offs, impact on locks, contracts, and plan,
   and the requested decision.
4. **Stop.** No response is not approval. Continue unaffected work only when
   it is safe to do so.

## Degree of freedom

Strict on the boundary: the skill never implements the proposed scope. The
only choice it makes is which route (drift, proposal, or debt) a discovery
takes.

## Artifacts

- Classification note; scope-change proposal or debt-register entry; a
  statement of what continues unaffected.
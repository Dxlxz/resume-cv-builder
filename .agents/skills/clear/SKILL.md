---
name: clear
description: Apply the CLEAR product-engineering operating system when a repository explicitly adopts CLEAR or the user asks to plan, implement, review, or ship work under CLEAR. Do not invoke merely because a task involves software development in a repository that has not adopted CLEAR.
---

# CLEAR Delivery

Use CLEAR to turn accepted product intent into bounded, evidenced delivery.

## Establish authority

Read the repository's governing instructions first. When present, read
`.clear/PROJECT.md`, the active feature packet, applicable architecture
constitution and ADRs, `DESIGN.md`, contracts, and test guidance.

Where the repository carries a governance plane, it binds this run:
`.clear/ai/autonomy.yaml` (what autonomy applies to the paths being touched —
the lowest matching value wins), `.clear/ai/risk-policy.yaml` (sensitive paths,
paths excluded from model context, diff limits),
`.clear/architecture/boundaries.yml` (which package types may depend on which),
and `.github/CODEOWNERS` (who must review). Do not edit any of these as a side
effect of another task; a change there changes agent behavior repository-wide,
so propose it and let the owner decide.

Resolve conflicts in this order:

1. product intent and business requirement;
2. accepted feature specification;
3. security, privacy, legal, and compliance constraints;
4. architecture invariants and accepted ADRs;
5. interface and data contracts;
6. experience direction and design system;
7. acceptance criteria;
8. repository conventions;
9. accepted plan;
10. generated code.

Report a material conflict; do not choose silently.

## Understand first

Before classifying, measure. A document says what was true when it was written,
and a name in a file may not mean what the owner means by it. Check any claim the
plan rests on against the code or the running system, and label the rest as an
assumption. Ask the owner about the unknowns once, in one batch, and default and
record the rest. The flow is: understand, plan, execute, verify, review, record —
and, when the work is a loop, iterate and harden (below).

## Classify before acting

Use delivery class L0–L4 and UI fidelity U0–U4 from the adopted project
profile. Increase controls with consequence and uncertainty. Keep L0/L1 work
compact. Use the full feature packet for L2+ work. L3/L4 requires explicit
threat, failure, rollout, recovery, and human-review treatment. Default down
when class is uncertain; escalate when a trigger appears.

Some controls are strict and checkable (tier D in the repository's controls
manifest): acceptance criteria that are singular, verifiable, and one-reading;
Scope Lock with approver and date; no unrun check reported as passing. Others
are guidance (tier G): apply them with judgment.

Before implementation, make sure the record is sufficient for the class:

- user, problem, outcome, constraints, and success;
- user-stated facts separated from inference, recommendation, and unknowns;
- acceptance criteria and non-goals;
- affected surfaces and representative risks;
- architecture, contracts, and design intent where affected;
- vertical slices and evidence;
- Intent Lock and Scope Lock.

If the user has already supplied an unambiguous, testable boundary and explicitly
asked for implementation, treat that as the lock. Do not add ceremony by asking
them to approve their own exact words again.

For business logic without a machine-readable specification, use the two-pass
draft: produce the structured specification (decision tables, EARS criteria,
state transitions) and have the owner review *the specification* before any
implementation. For existing behavior, pin it with characterization tests
first; the green suite is the contract. Keep the specification aligned with
accepted reality — when code diverges from the spec, fix or retire it the same
day, with the owner's approval.

## Implement

- Work one coherent vertical slice at a time.
- Preserve existing conventions and unrelated changes.
- Stabilize contracts before independent or parallel work.
- Keep domain rules, vendor details, and design-system concerns in their owned
  boundaries.
- ASCII layout sketches are recommended for rapid alignment — in chat and
  in documents (label low fidelity, never approval evidence); rendered
  diagrams preferred where a diagram communicates structure better.
- Use selective TDD for high-correctness rules; use browser and interaction
  evidence for UI behavior.
- Add only required or reasonable local refactoring. Strategic refactoring is
  separate scope.
- Do not add dependencies, infrastructure, product behavior, or design direction
  outside the lock.
- When a material expansion is required, stop that portion and submit a
  scope-change proposal.
- Keep the diff small enough to be verified meaningfully. A large opaque change
  reviewed as "CI is green" is not reviewed.

## Verify and review

Map every acceptance criterion to a check and actual result. Use the cheapest
reliable layer, adding integration, browser, security, accessibility,
performance, and operational evidence according to risk.

Never report an unrun check as passing. Do not weaken a legitimate check to
obtain a pass. Evidence is the command run and its result line, not an
assertion; run a focused check per slice while executing and the full gate
before done; a fix's test must fail when the fix is reverted.

Keep review lenses separate:

- specification and acceptance;
- scope;
- architecture and contracts;
- code quality and failure behavior;
- experience, content, responsive behavior, and accessibility;
- security, privacy, data integrity, operations, and recovery.

The implementer does not certify its own implementation. Use another reviewer or
a deliberately isolated review pass where a separate person or agent is not
available.

## Deliver

Report:

- changed scope and preserved non-goals;
- acceptance evidence and exact checks;
- review findings and resolutions;
- untested areas, limitations, and visible debt;
- migration, configuration, release, monitoring, and recovery actions; and
- candidate next work kept outside the delivered scope.

For an autonomous or substantial AI-authored change, attribute it: the agent
and the authorizing human or session record, and a run record under
`.clear/ai/runs/` where the repository keeps them. No anonymous significant AI
change.

After release, compare observed behavior with the intended outcome. Classify new
findings before updating scope, then update durable specifications and decisions.

## Iterate and harden

For a loop (a walk, an audit, a sweep), state the exit rule, the budget (stop starting
new slices at 80%) and the early-stop conditions (divergence; a slice that fails
twice) before the first pass, and keep the state in a ledger file so
a resume loses nothing. After each fix re-check what it touched plus a sample of
what it did not. When a defect class comes back, turn it into a check, a test, a
lint rule or a template line and record the "lesson → check" row; a reminder in
prose is not a fix. Prefer the strongest form that fits: **Prevent** (a type or
lint rule that makes the defect impossible), then **Detect** (a test or ratchet
that fails), then **Mitigate** (a doc). Ship the check with the fix.

## Degree of freedom

Flexible in method, strict in gates. You choose the slicing, the checks, and
the order of work; you do not choose whether Intent Lock and Scope Lock bind,
whether evidence is required, or whether the implementer may certify itself.

This skill composes the others rather than replacing them: `clarify-hard` when
a request reads more than one way, `spec-review` at Lock, `feature-packet`
before Scope Lock, `minimal-change` before writing implementation,
`independent-review` at Review, `drift-audit` at Review and Learn,
`scope-change` whenever discovery exceeds the lock.

## Artifacts

- The class-appropriate artifacts named in the
  artifact map.
- Intent Lock and, for L2+, Scope Lock with an approver and a date.
- An acceptance-to-evidence table with actual results.
- A delivery report, and a debt-register row for every accepted compromise.


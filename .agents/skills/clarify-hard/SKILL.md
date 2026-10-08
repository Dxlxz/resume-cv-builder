---
name: clarify-hard
description: Interrogate the requester one decision at a time until intent, scope, and acceptance criteria are unambiguous, then produce a lock-ready intent brief. Use before L2+ implementation, when a request has more than one reasonable reading, or when the user asks to be grilled. User-invoked; do not trigger this on your own for small or already-specified work.
---

# Clarify Hard

CLEAR's first-response contract asks for a restated intent. That is satisfiable
by confidently restating a **wrong** understanding in the correct format — which
is the most expensive failure in the whole lifecycle, because everything
downstream inherits it.

This skill closes that hole. Do not produce one summary and wait. Interview,
one fork at a time, until the design tree has no unresolved branches.

## Procedure

1. **Explore before you ask.** If a question can be answered from the
   repository — existing patterns, contracts, schemas, prior decisions, the
   [debt register](../../../.clear/debt-register.md) — answer it there and
   state the answer as a finding, not a question. Asking what the code already
   says wastes the requester's attention, which is the scarce resource.

2. **Build the decision tree, then walk it.** List the decisions this work
   requires and order them by dependency: a decision that constrains others
   comes first. Do not ask leaf questions while the root is open.

3. **Ask one decision at a time**, and with each question:
   - **propose your own answer and your reasoning** — a question with a
     recommendation attached costs the requester seconds instead of minutes;
   - state what it depends on and what it will unlock;
   - state the consequence of each option, including the one you did not pick.

   Expect this to take many questions. Complex work commonly needs dozens.
   Stopping early because the requester seems satisfied is the failure mode.

4. **Classify every answer immediately** as user-stated, inferred,
   recommended-and-approved, or still unknown. Never let an inference of yours
   become a "requirement" — that relabelling is how scope silently grows.

5. **Push on the vague ones.** "Fast", "simple", "secure", "like the other
   page", "obviously", "just" — each hides a decision. Convert it to something
   observable or record it as an explicit unknown with its risk.

6. **Stop when the tree is closed.** Every branch is answered, deferred with a
   named risk, or ruled out of scope. Not when you have enough to start.

## Output

Produce a filled [intent brief](../../../.clear/templates/intent-brief.md): restated
intent, user-stated requirements, inferences, recommendations requiring
approval, unknowns that materially affect delivery, acceptance criteria,
non-goals, proposed affected surfaces.

Then **check your own criteria** before offering the lock:

```bash
python scripts/spec-lint.py <the brief or spec>
```

If the linter genuinely cannot run, record it as an unrun check in the evidence — never claim the gate
passed without running it.

A Tier D finding means the interview is not finished. Return to step 3 on the
criterion that failed rather than handing over a brief you know is weak.

## Degree of freedom

Flexible in questioning, strict in stopping. You choose the questions and their
order; you do not choose to stop early, to skip the classification, or to
present an inference as a requirement.

Scale to consequence: L0/L1 work does not need this skill, and running it there
is ceremony. It earns its cost when a request has more than one reasonable
reading, or the cost of building the wrong thing exceeds the cost of the
interview (change classes).

## Artifacts

- A filled intent brief, lint-clean on Tier D rules.
- The decision tree, with each node marked answered, deferred with risk, or
  out of scope.
- Explicit Intent Lock request — the requester locks it, never you.

## Lineage

The interrogation pattern is adapted from the widely used `grill-me` skill by
Matt Pocock: *interview relentlessly, walk each branch of the design tree
resolving dependencies one by one, and explore the codebase instead of asking
when the answer is there.* CLEAR's version adds the classification discipline
and terminates in a lock-ready artifact rather than a conversation.

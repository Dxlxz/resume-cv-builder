---
name: minimal-change
description: Climb the ladder from "does this need to exist at all" down to writing code, stopping at the first rung that holds, so the change is the smallest one that actually solves the problem. Use before writing any implementation, and when a change feels larger than the problem.
---

# Minimal Change

CLEAR already says earn abstraction, prefer the simplest sufficient structure,
and never add anything "for later". Those are principles an agent is assumed to
have internalized. This is the ladder it climbs instead.

**The best code is the code never written.** Lazy means efficient, never
careless.

## Understand first

The ladder runs **after** you understand the problem, not instead of it. Read
the task and the code it touches, and trace the real flow end to end. The
smallest change in the wrong place is not lazy — it is a second bug.

## The ladder

Stop at the first rung that holds:

1. **Does this need to be built at all?** The requested behavior may already be
   reachable, or may not be in the locked scope.
2. **Does it already exist in this codebase?** Reuse the helper, pattern, or
   component that is already here. A near-duplicate is a boundary violation
   waiting to be counted (ratchet).
3. **Does the standard library do this?** Use it.
4. **Does a native platform feature cover it?** Use it. This is where the
   largest wins hide — a native input beats a component nobody asked for.
5. **Does an already-installed dependency solve it?** Use it. A new dependency
   is a supply-chain decision, not an implementation detail
   (security).
6. **Can this be one line?** Make it one line.
7. **Only then** write the minimum code that works.

## Rules

- No abstraction that was not explicitly requested.
- No new dependency that can be avoided.
- No boilerplate nobody asked for.
- Deletion over addition. Boring over clever. Fewest files possible.
- Question complex requests: *"Do you actually need X, or does Y cover it?"*
- When two approaches are the same size, take the edge-case-correct one. Lazy
  means less code, not the flimsier algorithm.
- **A bug fix targets the root cause, not the symptom.** A report names a
  symptom. Find every caller of the function you touch and fix the shared
  function once — one guard there is a smaller diff than one per caller, and
  patching only the path the ticket names leaves a sibling caller broken.

## Not lazy about

Laziness without this list is carelessness. Never trade away:

- **understanding the problem** — a small diff you do not understand is
  laziness dressed up as efficiency;
- **input validation at trust boundaries** and server-side authorization
  (security and privacy);
- **error handling that prevents data loss**;
- **the accessibility minimum core** — it is part of correctness, not polish
  (accessibility);
- **evidence** — non-trivial logic leaves one runnable check behind: the
  smallest thing that fails if the logic breaks. Trivial one-liners need none.
  An unrun check is never a pass (verification);
- **anything explicitly requested** — the ladder trims what nobody asked for,
  never what the lock requires.

## Marking a deliberate simplification

When you cut a real corner with a known ceiling — a global lock, an O(n²) scan,
a naive heuristic — mark it at the line **and** record it, so it is debt rather
than a landmine:

```ts
// CLEAR-DEBT: O(n²) scan; fine under ~500 rows. Upgrade: index by tenant id.
```

Then add the row to the [debt register](../../../.clear/debt-register.md) with
its owner and exit condition. A comment alone is not visible debt — nobody
greps for honesty. CLEAR requires compromises to be **recorded, owned, and
visible**, and a marker without a register entry is none of those.

## Degree of freedom

Strict on the ladder order and the "not lazy about" list. Flexible on which
rung holds — that is judgment, and you state which rung you stopped at and why.

## Artifacts

- The implemented change, with the rung you stopped at named in the delivery
  report.
- A `CLEAR-DEBT:` marker plus a debt-register row for every deliberate
  simplification.
- One runnable check per piece of non-trivial logic.

## Lineage

The ladder, the root-cause rule, the "not lazy about" list, and the
comment-marker convention are adapted from the `ponytail` skill by Dietrich
Gebert (MIT). CLEAR's version binds the exceptions to its own non-negotiables
and routes the simplification marker into the debt register rather than leaving
it as a comment.

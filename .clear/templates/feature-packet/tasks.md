# F-NNN — Tasks

<!-- The plan as a checklist that is kept true while the work runs. Each task is a small vertical slice that
is green on its own. When a box is ticked the evidence is linked. -->

## Slices

- [ ] **T1 — <demonstrable outcome>** · covers AC-1
  - Surfaces:
  - Test that fails first:
  - Evidence:
  - Recovery:

## Parallel work (only if the tasks are disjoint)

<!-- Write-set per worker as disjoint paths, the stable contract fixed first, one worktree each, and the
integrator. If a write-set cannot be written as disjoint paths in one line, do not parallelize the writes -->

## Loop rule (only if the work is a loop: walk, audit, sweep)

<!-- Exit rule, budget, early-stop conditions, and the ledger file that holds the state. -->

## Harden

| Defect class that came back | Kind: Prevent (type, lint) / Detect (test, ratchet) / Mitigate (doc) | Check added | Where |
| --- | --- | --- | --- |
|  |  |  |  |

## Closure — the last tasks, so nothing outlives the change

- [ ] Every AC row in `spec.md` has a result and linked evidence.
- [ ] Durable outcomes **promoted to their owners** (contract, ADR, glossary, README, register): list each.
- [ ] Independent review PASS recorded (L2+).
- [ ] Set `spec.md` **Status: Closed** and `Closed: <date>`, then **remove this folder in the same commit**;
      the commit message carries `Promoted:` (owners updated) and `Evidence:` (run record). Git keeps the
      history.

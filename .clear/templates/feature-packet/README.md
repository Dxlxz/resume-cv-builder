# Feature Packet

**Reader:** contributors · **Answers:** which artifacts form an L2+ packet, and when does it end?

For repository changes, follow the [CLEAR delivery contract](../../../AGENTS.md#5-delivery--clear-lite) and
[project profile](../../PROJECT.md); this directory guidance supplements their
classification, locks, evidence, and review requirements.

A feature packet is **three files** for one non-trivial change, and it **ends**: it is not a permanent record.

```text
spec.md (WHAT, WHY, acceptance)  →  design.md (HOW, contracts)  →  tasks.md (slices, closure)
```

Copy this directory for L2+ work and delete sections that do not apply. L0/L1 work has no packet: three lines in
the commit (`Intent:`, `Check:`, `Non-goal:`).

| File | Purpose |
| --- | --- |
| [spec.md](spec.md) | Outcome, scope, non-goals, rules, acceptance criteria with their checks, Scope Lock |
| [design.md](design.md) | Measured facts, references, contracts; a UI section and a data section only if they apply |
| [tasks.md](tasks.md) | Vertical slices with test-first and evidence, and the closure tasks |

**Closure.** The last tasks promote what must outlive the change into its owning document (contract, ADR, glossary,
README, register), then set `Status: Closed` and remove the folder in the same commit. What is left is the durable
documents, which already have owners and checks. Review refuses a closed packet that is still present and an
acceptance criterion that no task or design section mentions.

Reference accepted ADRs and system-level contracts rather than copying them.

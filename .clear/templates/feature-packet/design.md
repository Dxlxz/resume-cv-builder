# F-NNN — Design

<!-- HOW. Everything the plan rests on, and the surface-specific contracts. Only sections that apply
stay; a UI section exists only if the change has UI, a data section only if data changes. Reference
ADRs and durable contracts, never copy them. Retired at closure like the rest of the packet. -->

## Understand — measured, not recalled

| Claim the design relies on | Where it was stated | Measured how (command or query) | Result / assumption |
| --- | --- | --- | --- |
|  |  |  |  |

## References

<!-- AGENTS.md section 5, Reference. Self review L1+, gold standard L2+ for resume content/layout/ATS/export, industry
practice for a new pattern, U2+ UI, an L3 decision or an uncovered rule. Link the reference note. -->

- **Self review** (critique pass by a fresh agent): result and what it changed:
- **Gold standard** (`docs/RESUME_AND_CV_GOLD_STANDARDS.md` sections):
- **Industry / competitor** (note, or "not required because"):

## Affected surfaces, architecture and contracts

## UI (only if the change has UI)

State matrix (rows that apply): default, focus, disabled, loading, empty, error, partial, success, denied,
offline. Responsive priorities at 375 / 768 / 1024 / 1440. Keyboard and focus order. Reuse existing components
in `src/components/`.

| State | Trigger | Content and action | Focus / announcement | Recovery |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Data (only if data changes)

Ownership and source of truth · fields, constraints, invariants · authorization and classification ·
compatibility and versioning · migration, backfill and validation · rollback or reconciliation · retention,
export, deletion · observability and audit.

## Failure and threat analysis (L3+ only)

## Decisions

<!-- Anything costly to reverse becomes an ADR; link it. -->

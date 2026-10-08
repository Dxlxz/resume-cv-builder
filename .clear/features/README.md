# Feature Packets

**Reader:** contributors · **Answers:** where does a classified change record belong?

Follow the [CLEAR lite contract](../../AGENTS.md#5-delivery--clear-lite) and the [project profile](../PROJECT.md).

Create one directory per L2+ feature, for example `F-001-cover-letter/`. Copy the three files (`spec.md`,
`design.md`, `tasks.md`) from [`../templates/feature-packet/`](../templates/feature-packet/README.md), remove
inapplicable sections, and keep the packet true while the work runs. A packet **ends**: at closure its durable
outcomes are promoted to the documents that own them, its `Status` is set to `Closed`, and the folder is removed in
the same commit.

L0/L1 work has no packet: three lines in the commit (`Intent:`, `Check:`, `Non-goal:`).

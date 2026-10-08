# Rizzume — agent contract

**Reader:** repository agents (Claude Code, Cursor, others) · **Answers:** how do I change this repository?

Rizzume is a browser-only resume and CV builder (React + Vite, pnpm workspaces). The document engine lives in
`packages/*`, the app in `src/`. See [README.md](./README.md) and [docs/README.md](./docs/README.md).

## 1. Authority

Owner: Dale. Order on conflict: Dale's instruction in session → accepted decisions in
[`docs/decisions/`](./docs/decisions/) → [`docs/RESUME_AND_CV_GOLD_STANDARDS.md`](./docs/RESUME_AND_CV_GOLD_STANDARDS.md)
→ [`docs/architecture.md`](./docs/architecture.md) → existing code conventions. Report a material conflict; do not
choose silently.

## 2. Verify

| Check | Command |
| --- | --- |
| Typecheck + build | `pnpm run build` |
| Unit tests | `pnpm test` |
| Lint | `pnpm run lint` |
| Module boundaries | `pnpm run modules:check` (also runs inside `pnpm test`) |
| Spec lint (L2+ acceptance) | `python scripts/spec-lint.py <spec.md>` |
| See it work | `pnpm run dev`, then the browser at `http://localhost:5173` |

Before calling work done: build, test and lint pass, and a user-visible change was seen working in the browser.

## 3. Modules

Rizzume is a modular monolith. [`.clear/architecture/modules.json`](./.clear/architecture/modules.json) is the one
map: for each engine package (`packages/*`) and application module (`src/modules/*`, `src/shared`, `src/app`) it
lists what that module may import. Packages form a one-way chain, `core → themes → presets → styles → layout →
render → templates → pipeline`; `catalog` and `fixtures` sit beside it and `validators` on top. Detail:
[docs/architecture.md §2.1](./docs/architecture.md).

- Import another application module only through its entry, `@/modules/<name>` (its `index.ts`), never a file inside.
- Code a lower package needs goes in the lowest package that can own it; never import upward.
- A new module is a new directory with an `index.ts` plus an entry in `modules.json`. Changing `modules.json` is a
  CLEAR change (L2), not a side effect.
- `pnpm run modules:check` and the ESLint rules (generated from `modules.json`) enforce all of this; do not
  suppress them.

## 4. Hard rules

- Drafts live in the user's browser; no server, account or telemetry without a decision record.
- UI is shadcn/ui (`radix-nova`) plus ReUI, in `src/shared/ui/` only ([decision](./docs/decisions/shadcn-reui-design-system.md)).
  Add a component with `npx shadcn@latest add <name>` (or `add @reui/<name>`), review the generated code, and add its
  `MANIFEST.json` entry. Use semantic tokens and status variants, never palette utilities, and never import `radix-ui`
  outside `src/shared/ui/`. Ask before destructive actions with `useConfirm`, and report outcomes with `toast`, not
  `window.confirm` or `window.alert`. `src/shared/ui/design-system.test.ts` and `src/test/a11y.test.tsx` enforce this.
- `personal/` and `.env*` are private: never commit them, never paste their contents into prompts or records.
- Never push to `main` directly; work on a feature branch.
- No new dependency without saying why the existing stack does not cover it.

## 5. Delivery — CLEAR lite

Project facts: [`.clear/PROJECT.md`](./.clear/PROJECT.md). A check beats a paragraph: a recurring mistake
becomes a check, test or lint rule, not more prompt text. Write records only if someone will read them. No
parallel framework.

### The flow

| # | Stage | Output | Exit gate |
| --- | --- | --- | --- |
| 1 | **Understand** + **Reference** | outcome, class, surfaces, facts measured vs claimed, unknowns, authorization | every claim the plan rests on is measured or an assumption; the references the class needs are consulted; questions to Dale asked once |
| 2 | **Plan** | Scope Lock. L2+: `spec.md`, `design.md`, `tasks.md` ([packet](./.clear/features/README.md)). L0/L1: commit lines `Intent:` `Check:` `Non-goal:` | each acceptance criterion maps to a check |
| 3 | **Execute** | small slices | reproduce first; minimal change; no silent dependency or visual direction; no drive-by edits |
| 4 | **Verify** | evidence per criterion: the command run and its result line, not an assertion | a focused check per slice while executing, the §2 checks before done; user-visible change: see it work in the browser; a fix has a test that fails when the fix is reverted; unrun is not pass; never bypass or weaken a check |
| 5 | **Review** | independent reviewer, fresh context, diff and criteria only; it checks each claimed check has matching evidence and re-runs the key one; each finding cites file:line and evidence or is dropped | L2+ needs PASS; a claim without evidence fails; L3+ also a reviewer of another model family or Dale; review slices of about 400 changed lines or fewer |
| 6 | **Record** | commit, run record, ledger | attribution below |
| 7 | **Iterate** (loops only) | re-check what a change touched, plus a sample | exit rule, budget (stop starting new slices at 80%) and early-stop (divergence; a slice that fails twice) stated before the first pass; state in a ledger file |
| 8 | **Harden** (loops only) | a defect class that came back gets a check that ships with its fix, strongest first: **Prevent** (a type or lint rule), **Detect** (a test that fails), **Mitigate** (a doc). Commit trailer `Harden: <check>` | a "lesson → check" row; a class with no check is not fixed |

An unattended run states its completion condition as something a file or script can show (exit rule met, checks
green).

### Reference

Before a plan is final, consult, sized by class: **(1) self review** — draft, then a critique pass by a fresh
agent against repo facts, decisions and acceptance (L1+); **(2) the gold standard** —
[`docs/RESUME_AND_CV_GOLD_STANDARDS.md`](./docs/RESUME_AND_CV_GOLD_STANDARDS.md), cite the section (L2+ on
resume content, layout, ATS or export); **(3) industry practice** — public sources, required for a new pattern,
U2+ UI, an L3 decision or a rule the gold standard lacks. On disagreement: §1 authority, gold standard, industry,
your own view; industry supports a deviation only through a decision record. Save a
[reference note](./.clear/templates/reference-note.md); reuse one under 30 days old.

### Classify

Start at L1; escalate when a trigger applies; consequence overrides line count.

| Class | Trigger | Needs | Record |
| --- | --- | --- | --- |
| L0 | trivial, safe correction | the focused check | commit message |
| L1 (default) | isolated change on an established pattern | intent, acceptance, non-goals up front; focused verification | commit message |
| L2 | new workflow, changed contract (document schema, package API, import/export format, `modules.json`), coordinated packages, substantial work | packet (spec, design, tasks), dated Scope Lock, **independent review**, evidence, closure | [packet](./.clear/features/README.md), or one run record under `.clear/ai/runs/` for non-feature work |
| L3 | schema migration of saved drafts, data loss risk, privacy (anything leaving the browser), CI/deploy config | L2 + failure analysis, recovery path, decision record for costly-to-reverse choices | as L2 |
| L4 | irreversible production action | L3 + Dale's explicit residual-risk acceptance | as L2 |

UI changes add U0 tweak · U1 established composition · U2 new composition · U3 new workflow · U4 new design
language. Every UI class keeps state, responsive and accessibility checks; U2+ adds a UI section in the packet and
browser evidence.

**Authorize.** An explicit instruction that defines a testable boundary **is** the lock: record requester, date and
instruction; do not ask again. Never invent approval for an inferred requirement or an extra sensitive action.
Discovery beyond the lock goes through [scope-change](./.agents/skills/scope-change/SKILL.md).

**Record and attribute.** AI-authored work names the agent and the authorizing human in the commit (L0/L1) or
record (L2+). An agent's commit ends with `Co-Authored-By: <agent> <noreply@…>` and a session trailer
(`Claude-Session: <url>` or `Session: <tool> <id>`). Merging to `main` needs Dale's authorization.

### Skills

Delivery skills, tool-neutral, in [`.agents/skills/`](./.agents/skills/):
[clear](./.agents/skills/clear/SKILL.md), [minimal-change](./.agents/skills/minimal-change/SKILL.md),
[clarify-hard](./.agents/skills/clarify-hard/SKILL.md), [feature-packet](./.agents/skills/feature-packet/SKILL.md),
[spec-review](./.agents/skills/spec-review/SKILL.md),
[independent-review](./.agents/skills/independent-review/SKILL.md),
[scope-change](./.agents/skills/scope-change/SKILL.md) and [drift-audit](./.agents/skills/drift-audit/SKILL.md).
Read the one that applies to the stage you are in. Compromises with a known ceiling are recorded in
[`.clear/debt-register.md`](./.clear/debt-register.md).

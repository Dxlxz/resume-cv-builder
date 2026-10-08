# CLEAR Project Profile

**Reader:** contributors and reviewers · **Answers:** how is CLEAR lite tailored to Rizzume?

## Adoption

- **Framework:** CLEAR lite 1.0.0, ported from EarthData Hub (`AGENTS.md` §4 there) on 2026-10-07
- **Owner:** Dale
- **Default delivery class:** L1 (escalate per the triggers in [AGENTS.md §5](../AGENTS.md#5-delivery--clear-lite))
- **Accessibility baseline:** WCAG 2.2 AA for the app chrome and editor; exported PDFs keep a real text layer and reading order (ATS proof suite)

## Product

- **Users:** job seekers writing a resume, CV or cover letter, Malaysia-first with an international preset.
- **Problem space:** a structured editor with live preview and PDF export whose output survives ATS parsing.
- **Primary outcomes:** a document that reads correctly to a parser and a human; nothing lost between editor, preview, PDF, JSON Resume import/export and PDF import.
- **Constraints:** browser-only — drafts in `localStorage`, no account, no server-side storage. Deployed as a static site (`vercel.json`). App chrome is light-only ([decision](../docs/decisions/light-only-chrome.md)).
- **Non-goals:** accounts, cloud sync, AI writing of content without the user's action, telemetry.

## Durable sources

- **Architecture:** [docs/architecture.md](../docs/architecture.md), [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Decisions:** [docs/decisions/](../docs/decisions/)
- **Resume/CV rules:** [docs/RESUME_AND_CV_GOLD_STANDARDS.md](../docs/RESUME_AND_CV_GOLD_STANDARDS.md)
- **Plan:** [docs/PHASED_PLAN.md](../docs/PHASED_PLAN.md)
- **Feature packets:** `.clear/features/`
- **Debt:** [.clear/debt-register.md](./debt-register.md)

## Repository verification

The command map is [`AGENTS.md`](../AGENTS.md) §2 (one source; not restated here).

## AI development posture

- **Agents in use:** Claude Code, Cursor — owned by Dale
- **Paths excluded from model context:** `.env*`, `personal/` (private CV pack)
- **Open exceptions:** none

## Delivery and environments

- **Branch model:** feature branch → `main`; never push to `main` directly
- **Local:** `pnpm run dev`
- **Release owner:** Dale

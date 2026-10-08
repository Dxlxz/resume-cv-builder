# ATS checker review — 2026-10-08

**Reader:** whoever changes the ATS checker or its score · **Answers:** is our checker right, and what should it check?

Method: an inventory of the code (`packages/validators/src`, `src/modules/toolbar`, `src/modules/ats-check`) and a
source review of ATS and parser vendors, recruiter studies and Malaysian job boards. Vendors who sell resume checking
(Jobscan, Enhancv, ResumeGo, Ladders) are marked as interested parties.

## What real ATSs do (evidence)

- **No ATS rejects a resume for its formatting or a score.** Auto-reject is driven by employer screening questions
  (Greenhouse auto-reject rules, Oracle Taleo disqualification questions). Greenhouse Talent Matching "does not
  auto-reject or auto-advance any candidate". The "75% rejected by robots" figure has no traceable study.
- **What hurts is parsing.** A badly parsed resume is hard to find in recruiter keyword search and its fields come out
  wrong. Breakers with vendor evidence: no text layer (scans), content in images (Workday admin guide), scrambled
  reading order (Textkernel, RChilli; order matters, column count does not), missing or non-standard section headings,
  jobs without dates (Textkernel quality codes), unmapped ligatures.
- **Length, fonts, colours, margins, bullet counts, action verbs and metrics are readability or recruiter preference**,
  not parsing. JobStreet Malaysia: 1–2 pages is "not a hard and fast rule"; CVs 3–5 pages.
- **Malaysia:** leave out IC number, marital status, religion (JobStreet); photo optional (Hiredly, JobStreet).

## What our checker does

The toolbar number is `100 − 14·errors − 7·warnings − 2·infos` (`packages/validators/src/score.ts`). It never reads
the PDF. Of 31 rules, about 20 are layout or style (margins, gaps, font size, contrast, page fill, section height) and
each warning costs 7 points like a real problem. Duplicate pairs double-count (dead zone, over-3-pages). Every role
needs a digit in a bullet for a perfect score. The Malaysia preset caps bullets at 3 and hides the rest. Cover letters
are penalised for empty resume sections. The parse checks that matter (text layer, reading order, headings, dates,
contact in the body) exist only on the /ats-check page and in tests (`ats-proof`), not in the builder's score.

## Verdict

Too rigid where it does not matter, and silent where it does. Recommended redesign:

1. Split the badge into **"ATS readable"** (pass/fail from extracting our own exported PDF: text layer, reading order,
   contact found, standard headings, dates on every job) and **"Polish"** tips (style, length, metrics). Do not show a
   pass/fail percentage built from style rules.
2. Downgrade layout/typography/spacing rules from warnings to tips; drop the duplicates; fix the line-height message.
3. Metrics: one tip for the whole resume when few bullets have numbers, not one per role.
4. Malaysia bullet cap: raise to 5–6 and never hide bullets silently.
5. Document type: skip resume-section rules for cover letters; CVs keep no page limit.
6. Add the missing evidence-backed checks: jobs without dates, non-standard section headings, personal details
   (marital status, religion, date of birth) for Malaysia, typos later.

Sources: see the research report in the session of 2026-10-08 (Greenhouse support articles on auto-reject and Talent
Matching; Oracle Taleo prescreening docs; Workday admin guide on resume parsing; Textkernel resume quality codes and
column-CV article; RChilli PDF parsing articles; HBS "Hidden Workers"; JobStreet Malaysia resume length, CV format and
photo articles; Hiredly photo and ATS guides; Sensible docs on ligatures).

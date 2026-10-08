# ATS-friendly template research — 2026-10-07

**Reader:** whoever designs or reviews a Rizzume template · **Answers:** what do good ATS-friendly resume and CV pages look
like, and what do we copy in spirit.

Method: Firecrawl search and scrape for rules and benchmarks; the in-app browser (several tabs) to look at real template
galleries. Sources are vendors and bloggers with something to sell, so each claim below says how many agree.

## What the sources agree on (use as rules)

- Real, selectable text in a controlled reading order; no text as images; contact details in the page body, not in a
  header or footer (every source).
- Standard section headings (Experience, Education, Skills, Summary) (every source).
- Common fonts at 10–12 pt, name 16–20 pt, section titles 12–14 pt (three sources). We already embed Carlito and
  Source Serif 4, so no font substitution can happen.
- Plain bullets, full month-and-year dates, no icons, photos or tables for core content (every source).
- Dense one page for early career (Harvard, Jake's); two pages are fine with experience.

## Where they disagree (decision: stay conservative, prove with our own suite)

- Two columns: one benchmark reports about 31–40% of resumes flagged or failing; one vendor measured 98% vs 95% parse
  accuracy in favour of two columns, and a parsing vendor says column handling lifted its clean rate from 62% to 90%.
  The common cause of failure is reading order and table or text-box construction, not column count. Our answer: columns
  are drawn as separate flows with the main column first in the file, and the extraction suite checks order.
  `ats-strict` stays the portal-safe default.

## What we saw (browser tabs)

Enhancv's ATS gallery (Modern, Ivy League, Elegant, Polished, Creative, Double Column):

- **Ivy League:** centered name, one-line contact, uppercase headings with a full-width hairline, serif body, titles bold on
  the left and dates right-aligned, tight spacing. Dense and calm; reads at a glance.
- **Modern:** left name in an accent colour, accent section headings, generous white space.
- **Double Column / Elegant / Polished:** main column plus a narrow rail (left or right) holding skills and short facts.
  The rail is short items only; chronology stays in the main column.

Jake's Resume and the Harvard College bullet template (known from their public descriptions; the PDF would not render in
the pane): centered name, pipe-separated contact line, ruled headings, bold role left and date right, italic organisation
line, six to eight tight bullets. High content density.

## Our own six, seen side by side (gallery, 2026-10-07)

At thumbnail size Classic, Academic and ATS Strict are almost indistinguishable (same left-aligned stack, small caps
headings), which is the main reason the template picker felt pointless. The three new templates differ at a glance:
serif and ruled (Ivy), denser with an inline rule (Compact), a right rail with a hairline (Split). Redesigning the older
six is deferred.

## What we build (our own, not a copy)

| Template | Idea | Reading order |
| --- | --- | --- |
| `ivy` | Serif, centered header, ruled uppercase headings, dates right | single column |
| `compact` | One-page density: small margins, 10 pt body, inline rule headings, tight gaps | single column |
| `split` | Main column plus a narrow right rail for skills and certifications, no tint | main column, then rail |

## Sources

- resumeoptimizerpro.com/blog/ats-resume-template; atsverification.com/blog/ats-friendly-resume-format-guide-2026;
  jobwizard.ai/blog (formatting); ireformat.com/blog/ats-resume-formatting-guide
- resumeatlas.io/ats-resume-parsing-benchmark; atschecker.ai/research/ats-resume-study-2026
- enhancv.com/blog/are-two-column-resumes-ats-friendly (vendor claim, cites Textkernel); enhancv.com/resume-templates/ats
- careerservices.fas.harvard.edu bullet point resume template; overleaf.com Jake's Resume

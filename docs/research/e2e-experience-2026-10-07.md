# Reference note — end-to-end experience of a resume builder (2026-10-07)

**Reader:** the next agent or engineer working on [E2E_EXPERIENCE_PLAN.md](../E2E_EXPERIENCE_PLAN.md) · **Answers:** what do public
sources say about phone PDF preview, competitor editors, ATS parsing, Malaysian resume norms and end-to-end testing, and how
sure are we?

| Field | Value |
| --- | --- |
| Question | Is the E2E plan aimed at the right problems, and what should it change? |
| Class and stage | L2 / U3 · Understand → Reference (industry practice) |
| Retrieved by | Claude Opus 5.5, Claude Code session · Firecrawl `search` (8 queries) and `scrape` (1 page) · 17 credits |

## 1. Self review and plan

The plan (written first, from a walkthrough of the app) assumed: the native PDF iframe is a phone risk; competitors win on guided
editing and a visible score; the Malaysia preset is aimed at one kind of applicant; journeys should be tested end to end. This note
checks each assumption against public sources. The search results are mostly vendor blogs and forum threads, so every claim is
graded; nothing here is a measurement of Rizzume.

## 2. Gold standard

Not applicable: no resume content or layout rule changed. The UI standards were applied in F-002.

## 3. Industry and competitor practice

| Claim (paraphrased) | Source | Retrieved | Confirmed in the page? | Certainty |
| --- | --- | --- | --- | --- |
| Embedding a PDF in an iframe is unreliable on iOS Safari and Android Chrome; Android often offers a download instead | nutrient.io, "How to embed a PDF viewer in a website" | 2026-10-07 | yes, search excerpt: "iframes consistently struggle on iOS Safari and Chrome on Android" | confirmed by two independent threads (Stack Overflow, Glide forum report first page only); not tested on a device by us |
| iOS Safari caps a canvas at about 16.7 million pixels and total canvas memory at 256–384 MB; PDF.js draws each page on one canvas, so large pages or many pages can blank | pdf.js issues #11297, #17170; react-pdf #1020, #1149; Apryse benchmark | 2026-10-07 | yes (issue text) | confirmed for large pages; a one-page A4 resume is far below the limits, but many canvases at once can still hit memory |
| The common mitigation is to cap the device pixel ratio at 2 and render few pages at a time | same issues | 2026-10-07 | yes | confirmed (maintainer calls it the intended fix) |
| Resume.io's editor is split-screen with a live preview, lets you switch templates without losing content, and walks users through steps with a progress bar and a score that updates per section | enhancv.com Resume.io review | 2026-10-07 | yes, scraped page | confirmed, but the author is a competitor |
| Resume.io's free plan only allows TXT download and the trial auto-renews; billing complaints dominate its low ratings elsewhere | same review | 2026-10-07 | yes | confirmed as reported by a competitor |
| Rezi scores a resume live (23 criteria), marks fixed suggestions with a tick, and its own docs say recruiters do not see that number; some users feel they are optimising for the tool | rezi.ai docs; jobscan.co comparison; resumeoptimizerpro.com | 2026-10-07 | yes | confirmed; two of the three sources are competitors |
| ATS parsers read single-column text best, expect standard section headings, and can lose text in headers, footers and text boxes | jobwizard.ai, mypersonalrecruiter.com, ireformat.com (all vendor blogs); a Reddit thread | 2026-10-07 | yes | **inferred**: consistent across sources, no neutral study cited; one vendor quotes "up to 25%" parsing failures with no method, so do not repeat that figure |
| Typical Malaysian domestic resumes carry a photo, IC number, SPM results, CGPA out of 4.00, two referees, and expected salary and notice period; multinational and tech roles use the shorter international style without photo or IC | qarera.com Malaysia resume guide (a resume vendor) | 2026-10-07 | yes | **inferred**: single vendor source for the full list |
| Jobstreet says typical resumes do not include a photo unless the advert asks, and its application form has an expected-salary field | my.jobstreet.com and sg.jobstreet.com articles | 2026-10-07 | excerpt only | confirmed for those two points; this is the more authoritative local source and it disagrees with the vendor about the photo |
| Playwright: use user-facing locators, isolate tests, keep them small, test chromium, firefox and webkit, run on Linux CI, install only the browsers you need | playwright.dev best practices | 2026-10-07 | yes | confirmed (official docs) |

Searched and rejected: general "best resume builder" listicles (marketing, no method), a YouTube ATS guide (no sources), AI
test-tool vendor posts (selling a product).

## 4. Synthesis

- **Agree:** phone PDF preview is a real risk; guided step-by-step editing with live feedback is what the leading builders
  do; single-column, standard headings and no header/footer content are the safe ATS rules (Rizzume already follows them);
  small, isolated, user-facing Playwright tests.
- **Disagree or unclear:** whether a photo and IC number belong on a Malaysian resume (vendor says expected domestically;
  Jobstreet says typical resumes have no photo). Rizzume's preset warns against the IC number. Do not hard-code either view.
- **What this changes in the plan:** (1) the phone preview work gets concrete rules (cap pixel ratio at 2, one or two pages
  rendered at a time, release canvases, test on WebKit); (2) the live ATS score becomes a checklist with ticks and is labelled
  guidance, not a pass mark; (3) a new item for Malaysian local-format fields as optional extras; (4) Playwright setup
  follows the official practices and includes WebKit; (5) Rizzume's free, no-account model is a real advantage over the
  paywall and billing complaints reported for Resume.io, so keep it in the first-screen message.
- **Decision record needed:** no (no deviation from a recorded decision); Dale decides the Malaysian-fields question.
- **Unknowns left:** actual behaviour of this app's preview on a real iPhone and Android phone; real Malaysian applicants'
  expectations (test with the five people in the plan, not with vendor blogs).

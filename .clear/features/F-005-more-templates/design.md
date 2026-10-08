# F-005 — Design

- **Shaded-bar title.** `sectionTitleBase` / `pdfSectionTitleBase` add a background (theme `border`) and padding from one
  helper, `shadedBar`, so the HTML the planner measures and the PDF it draws have the same height. The plain-title path
  renders it; no new block code.
- **Title alignment.** `sectionTitleAlign` sets `textAlign` on both sides. Accent-bar and inline-rule titles stay left.
- **Inverse rail.** `inverseResolvedStyles` rebuilds the CSS and PDF sheets with swapped colours (text and accent → paper,
  muted → border, paper → accent). `ColumnLayoutPdf` paints the rail in the accent and renders rail blocks with that sheet.
  Sizes are untouched, so the plan, pagination and reading order are those of the tinted `sidebar` template.
- **Templates** are layout profiles only: `executive` (rail dates, ruled, serif pinned), `harbor` (centered, shaded bars,
  skills grid), `slate` (left inverse rail with contact, skills, certifications), `minimal` (wide margins, no rules).

Alternative rejected: PDFx components. They are generic invoice and report primitives without measurement, pagination
planning or ATS checks; adopting them would fork the renderer the plan depends on.

# F-004 — Design

## Approach

Three parts, each small and reusing what exists.

1. **Template gallery** (`src/modules/gallery`). A dialog hosted by `EditorPanel` (the Document popover would unmount it).
   It shows one card per entry in `TEMPLATE_LIST`. `useTemplateThumbnails` renders page 1 of the open draft in each
   template with `generatePdf`, one at a time, only while the dialog is open. Results are cached per template, preset,
   theme and draft revision (bounded), and a render already running is shared, so closing and reopening never starts a
   template twice. Each card draws its blob with `PdfPageViewer` (`maxPages: 1`).
2. **Three templates**, as layout profiles in `packages/styles/src/shared/layoutProfiles.ts` plus registry entries:
   `ivy` and `compact` use the existing block layout; `split` uses the column layout.
3. **Right rail.** `LayoutProfile` gains `sidebarSide` and `sidebarRule`. `ColumnLayoutPdf` writes the main column
   first when the rail is on the right, so extraction order is chronology first.

## Column widths: one source

Review found that the planner measured the rail at its nominal width while the renderer drew it with padding inside that
width, so text wrapped differently on the page than in the plan. `columnGeometry` (`packages/styles`) now returns the
outer widths, paddings and text widths for both columns; `compileStandardLayout` plans with the text widths and
`ColumnLayoutPdf` draws with the paddings. A test ties them together for `sidebar` and `split`.

## UI (U3)

- States: loading (spinner per card, text for screen readers), ready (thumbnail), error ("Preview unavailable", card
  still selectable), current (ring and "(current)").
- Responsive: two columns of cards on a phone, three from `sm`; the dialog scrolls (`max-h-[92dvh]`).
- Accessibility: one `radiogroup` with roving `tabindex`, arrow keys move focus, Enter or Space chooses, Esc closes and
  focus returns to the Document button. Badges say what a template is ("One column", "Two columns", "Portal-safe" for ATS
  Strict only, "ATS-friendly" for the other one-column templates).
- The thumbnail sheet uses the `paper` tokens, so text on the white page keeps contrast in the dark theme.

## Alternatives rejected

- Static screenshots of each template: would not show the user's own content, which is the point.
- Rendering all thumbnails in parallel: nine react-pdf renders at once freeze the page.
- Putting the rail first in the file for a right rail: puts skills before experience for a text extractor.

## Failure and recovery

A template that fails to render shows an error card and can still be chosen. A draft that names a template the build does
not know fails schema parsing and is quarantined by the existing recovery path.

import type { ColumnId, LayoutBlock, LayoutDocument } from '@rb/layout/types'
import { columnGeometry, SIDEBAR_RULE_PT } from '@rb/styles/shared/columnGeometry'
import type { ResolvedStyles } from '@rb/styles/shared/types'
import type { LayoutProfile } from '@rb/themes/types'

/**
 * Layout IR → Typst source.
 *
 * The IR is the one the react-pdf engine draws, so content, section order, labels and spacing come from the same
 * place; only the typesetter differs. Typst paginates by itself (two columns included), so this reads the
 * unpaginated IR and needs no measured plan. Every template is a set of LayoutProfile knobs, and each knob is
 * mirrored here.
 *
 * Every piece of user text is emitted as a Typst string literal, never as markup, so characters such as `#`, `*`,
 * `_`, `$` or `@` in a resume cannot change formatting or run code.
 */

/** Escapes text for a double-quoted Typst string literal. */
export function typstString(text: string): string {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, '\\n')
    .replace(/\t/g, '\\t')
  return `"${escaped}"`
}

const pt = (n: number) => `${Number(n.toFixed(3))}pt`
const IN_WORD_HYPHEN = /[\p{L}\p{N}]-[\p{L}\p{N}]/u

/**
 * User text as a Typst expression. Typst may break a line after the hyphen in "in-house" or a URL in a narrow
 * column, and a text extractor then reads "in- house", the split the ATS suite rejects (a word joiner instead drops
 * the hyphen from the extracted text). So each whitespace-free token holding an in-word hyphen goes in an
 * unbreakable box (`nobreak`, sized to the token's natural width so it cannot wrap inside); everything else stays a
 * plain string. A long token may overhang a narrow column slightly rather than split.
 */
export function typstText(text: string): string {
  if (!IN_WORD_HYPHEN.test(text)) return typstString(text)
  const parts = text.split(/(\s+)/).map((token) =>
    IN_WORD_HYPHEN.test(token) ? `#nobreak(${typstString(token)})` : token ? `#${typstString(token)}` : '',
  )
  return `[${parts.join('')}]`
}

const s = (text: string) => typstText(text)

export interface TypstDocumentMeta {
  title: string
  author: string
  keywords: string[]
  pageSize: 'a4' | 'letter'
  lang: string
}

/** The palette a block is drawn with: the page's, or the inverse one on an accent-coloured rail. */
type Palette = 'pal' | 'inv'

function family(pdfFamily: string): string {
  return /serif|times/i.test(pdfFamily) ? 'Source Serif 4' : 'Carlito'
}

function transformTitle(text: string, transform: LayoutProfile['sectionTitleTransform']): string {
  if (transform === 'uppercase') return text.toUpperCase()
  if (transform === 'capitalize') return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
  return text
}

function sectionTitleFunction(styles: ResolvedStyles): string {
  const { typography: t, layout: l } = styles
  const label = `text(font: HEAD, size: ${pt(t.sectionSize)}, weight: "bold", fill: p.accent, tracking: ${pt(t.letterSpacingSection)}, body)`
  const align = l.sectionTitleAlign === 'center' ? 'center' : 'left'
  let inner: string
  switch (l.sectionTitleDecoration) {
    case 'rule':
      inner = `block(width: 100%, stroke: (bottom: ${pt(l.headerBorderWidthPt)} + p.border), inset: (bottom: ${pt(l.bulletGapPt)}), align(${align}, ${label}))`
      break
    case 'accent-bar':
      inner = `grid(columns: (${pt(l.accentBarWidthPt)}, 1fr), column-gutter: ${pt(l.accentBarGapPt)}, align: horizon, rect(width: ${pt(l.accentBarWidthPt)}, height: ${pt(t.sectionSize * l.accentBarHeightRatio)}, fill: p.accent), ${label})`
      break
    case 'rule-inline':
      inner = `grid(columns: (auto, 1fr), column-gutter: ${pt(l.inlineRuleGapPt)}, align: horizon, ${label}, line(length: 100%, stroke: ${pt(l.headerBorderWidthPt)} + p.border))`
      break
    case 'shaded-bar':
      inner = `block(width: 100%, fill: p.border, inset: (x: ${pt(l.shadedBarPaddingPt * 2)}, y: ${pt(l.shadedBarPaddingPt)}), align(${align}, ${label}))`
      break
    default:
      inner = `block(width: 100%, align(${align}, ${label}))`
  }
  // sticky keeps a title on the same page as the block after it.
  return `#let sectitle(p, body) = block(width: 100%, sticky: true, ${inner})`
}

function preamble(styles: ResolvedStyles, meta: TypstDocumentMeta, page: string): string {
  const { theme, typography: t, layout: l } = styles
  const c = theme.colors
  // CSS line-height is a pitch; with text edges at the ascender and descender, Typst's leading is the gap between
  // lines, so leading = (lineHeight - 1.22)em gives the same pitch for both families (ascender + descender ≈ 1.22em).
  const leading = (lh: number) => `${Math.max(0.05, lh - 1.22).toFixed(3)}em`
  const keywords = meta.keywords.map(typstString).join(', ') + (meta.keywords.length === 1 ? ',' : '')
  return [
    `#set document(title: ${typstString(meta.title)}, author: ${typstString(meta.author)}, keywords: (${keywords}))`,
    `#let BODY = "${family(theme.fonts.pdfBody)}"`,
    `#let HEAD = "${family(theme.fonts.pdfHeading)}"`,
    `#let pal = (text: rgb("${c.text}"), muted: rgb("${c.textMuted}"), accent: rgb("${c.accent}"), border: rgb("${c.border}"), paper: rgb("${c.paper}"))`,
    // On an accent-coloured rail: paper-coloured text, the light border colour for secondary text.
    `#let inv = (text: pal.paper, muted: pal.border, accent: pal.paper, border: pal.muted, paper: pal.accent)`,
    page,
    // Hyphenation and justification stay off: a hyphen inserted at a line end splits a word for a text extractor,
    // which is the regression the ATS suite guards against.
    `#set text(font: BODY, size: ${pt(t.bodySize)}, fill: pal.text, lang: ${typstString(meta.lang)}, hyphenate: false, top-edge: "ascender", bottom-edge: "descender")`,
    `#set par(justify: false, leading: ${leading(t.lineHeight)}, spacing: 0pt)`,
    `#set block(spacing: 0pt)`,
    `#set list(indent: 0pt, body-indent: 0pt, spacing: ${pt(l.bulletGapPt)})`,
    `#let gap(x) = v(x, weak: true)`,
    // Inside the box the text edges go back to cap-height/baseline, or the box would sit raised by the descender.
    `#let nobreak(s) = context { let t = text(top-edge: "cap-height", bottom-edge: "baseline", s); box(width: measure(t).width + 0.01pt, t) }`,
    `#let bullets(p, ..items) = list(marker: box(width: ${pt(l.bulletIndentPt)}, text(fill: p.text, "•")), ..items.pos().map(it => text(fill: p.text, it)))`,
    `#let sub(p, body) = text(font: HEAD, size: ${pt(t.subheadingSize)}, weight: "bold", fill: p.text, body)`,
    `#let muted(p, body) = text(fill: p.muted, body)`,
    `#let row(lead, trail) = grid(columns: (1fr, auto), column-gutter: ${pt(l.rowGapPt)}, lead, align(right, trail))`,
    `#let railrow(p, dates, body) = grid(columns: (${pt(Math.max(0, l.railWidthPt - l.railGutterPt))}, 1fr), column-gutter: ${pt(l.railGutterPt)}, par(leading: ${leading(l.metaLineHeight)}, text(size: ${pt(t.metaSize)}, weight: "bold", fill: p.muted, dates)), body)`,
    sectionTitleFunction(styles),
    // Real headings: tagged H1 in the PDF structure tree, listed as bookmarks.
    `#show heading.where(level: 1): it => sectitle(pal, it.body)`,
    '',
  ].join('\n')
}

function pageSetup(styles: ResolvedStyles, meta: TypstDocumentMeta): string {
  const { layout: l } = styles
  const paper = meta.pageSize === 'a4' ? 'a4' : 'us-letter'
  if (l.columns !== 2) {
    return `#set page(paper: "${paper}", margin: ${pt(l.pageMarginPt)}, fill: pal.paper)`
  }
  const pageWidthPt = styles.page.widthMm * (72 / 25.4)
  const g = columnGeometry(l, pageWidthPt)
  const right = l.sidebarSide === 'right'
  const railX = right ? pageWidthPt - g.railOuterPt : 0
  const background: string[] = []
  if (l.sidebarBackground) {
    const fill = l.sidebarInverse ? 'pal.accent' : 'pal.border'
    background.push(`place(top + left, dx: ${pt(railX)}, rect(width: ${pt(g.railOuterPt)}, height: 100%, fill: ${fill}))`)
  }
  if (l.sidebarRule) {
    const ruleX = right ? railX : g.railOuterPt - SIDEBAR_RULE_PT
    background.push(`place(top + left, dx: ${pt(ruleX)}, rect(width: ${pt(SIDEBAR_RULE_PT)}, height: 100%, fill: pal.border))`)
  }
  // The page margins are the outer text edges; the grid gutter spans rail padding, the rule and the main padding.
  const bg = background.length ? `, background: { ${background.join('; ')} }` : ''
  return `#set page(paper: "${paper}", margin: (x: ${pt(l.pageMarginPt)}, y: ${pt(l.pageMarginPt)}), fill: pal.paper${bg})`
}

function blockSource(block: LayoutBlock, styles: ResolvedStyles, p: Palette): string {
  const { typography: t, layout: l } = styles
  const c = block.content
  const subGap = `#v(${pt(l.itemSubtitleGapPt)})`
  const rail = l.entryStyle === 'rail'
  const bulletList = (items: string[]) =>
    items.length ? `#bullets(${p}, ${items.map(s).join(', ')})` : ''
  switch (c.kind) {
    case 'header': {
      const band = l.headerStyle === 'band'
      const fg = band ? `${p}.paper` : `${p}.accent`
      const lineFill = band ? `${p}.paper` : `${p}.text`
      const metaFill = band ? `${p}.paper` : `${p}.muted`
      const lines = [`#par(leading: 0.1em, text(font: HEAD, size: ${pt(t.nameSize)}, weight: "bold", fill: ${fg}, ${s(c.name)}))`]
      if (c.headline) lines.push(`#v(${pt(l.nameToMetaPt)})`, `#text(fill: ${lineFill}, ${s(c.headline)})`)
      c.metaLines.forEach((line, i) => {
        lines.push(
          `#v(${pt(i === 0 ? l.nameToMetaPt : l.metaLineGapPt)})`,
          `#par(leading: ${Math.max(0.05, l.metaLineHeight - 1.22).toFixed(3)}em, text(size: ${pt(t.metaSize)}, fill: ${metaFill}, ${s(line)}))`,
        )
      })
      const align = l.headerAlign === 'center' ? 'center' : 'left'
      const body = `align(${align})[\n${lines.join('\n')}\n]`
      if (band) {
        const padPt = l.headerRulePaddingPt * l.headerBandPaddingScale
        return `#block(width: 100%, fill: ${p}.accent, inset: ${pt(padPt)}, ${body})`
      }
      if (l.headerBorderBottom) {
        return `#block(width: 100%, stroke: (bottom: ${pt(l.headerBorderWidthPt)} + ${p}.border), inset: (bottom: ${pt(l.headerRulePaddingPt)}), ${body})`
      }
      return `#block(width: 100%, ${body})`
    }
    case 'sectionTitle':
      return `#heading(level: 1, ${s(transformTitle(c.text, l.sectionTitleTransform))})\n#v(${pt(l.sectionTitleGapPt)})`
    case 'paragraph':
      return `#par(text(fill: ${p}.text, ${s(c.text)}))`
    case 'bullet':
      // A rail item's own bullets start at railWidthPt (the text column of railrow); a fragmented item's bullets line
      // up with them. react-pdf indents these by railWidth + railGutter, past its own body text; Typst aligns them.
      return rail ? `#pad(left: ${pt(l.railWidthPt)}, ${bulletList([c.text]).slice(1)})` : bulletList([c.text])
    case 'skillGroup': {
      const name = c.name ? `#sub(${p}, ${s(c.name)})\n#v(${pt(l.bulletGapPt)})\n` : ''
      const body =
        l.skillsStyle === 'grid'
          ? `#grid(columns: (1fr,) * ${Math.max(1, Math.round(l.skillGridColumns))}, column-gutter: ${pt(l.bulletGapPt * l.skillGridGutterScale)}, row-gutter: ${pt(l.bulletGapPt * l.skillGridRowGapScale)}, ${c.items.map((it) => `text(fill: ${p}.text, ${s(it)})`).join(', ')})`
          : c.itemLines.map((line) => `#par(text(fill: ${p}.text, ${s(line)}))`).join(`\n#v(${pt(l.bulletGapPt)})\n`)
      return `#block(breakable: false)[\n${name}${body}\n]`
    }
    case 'experienceItem': {
      const company = c.company + (c.location ? `, ${c.location}` : '')
      const head = `#sub(${p}, ${s(c.title)})${subGap}#emph(text(fill: ${p}.text, ${s(company)}))`
      const list = c.bullets.length ? `#v(${pt(l.bulletGapPt)})\n${bulletList(c.bullets)}` : ''
      if (rail) return `#railrow(${p}, ${s(c.dates)})[\n#block(sticky: true)[${head}]\n${list}\n]`
      return `#block(sticky: true, row([${head}], muted(${p}, ${s(c.dates)})))\n${list}`
    }
    case 'educationItem': {
      const head = `#sub(${p}, ${s(c.institution)})#linebreak()#text(fill: ${p}.text, ${s(c.degree)})`
      const honors = c.honors ? `\n#v(${pt(l.itemSubtitleGapPt)})\n#par(text(fill: ${p}.text, ${s(c.honors)}))` : ''
      if (rail) return `#block(breakable: false, railrow(${p}, ${s(c.dates)})[${head}${honors}])`
      return `#block(breakable: false)[#row([${head}], muted(${p}, ${s(c.dates)}))${honors}]`
    }
    case 'projectItem': {
      const desc = c.description ? `\n#par(text(fill: ${p}.text, ${s(c.description)}))` : ''
      const url = c.url ? `\n#muted(${p}, ${s(c.url.replace(/^https?:\/\//, ''))})` : ''
      const list = c.bullets.length ? `\n#v(${pt(l.bulletGapPt)})\n${bulletList(c.bullets)}` : ''
      return `#block(sticky: true)[#sub(${p}, ${s(c.name)})${desc}${url}]${list}`
    }
    case 'referenceItem':
      return `#block(breakable: false)[#sub(${p}, ${s(c.name)})\n#par(text(fill: ${p}.text, ${s(`${c.title}, ${c.company}`)}))${c.contactLine ? `\n#muted(${p}, ${s(c.contactLine)})` : ''}]`
    case 'itemHeader': {
      // A long item compiles to this lead-in plus separate bullet blocks, so it must look like the item's own head,
      // rail dates included (LayoutBlockPdf, case 'itemHeader'). sticky keeps it with its first bullet.
      if (c.dates) {
        const head = `#sub(${p}, ${s(c.title)})${c.subtitle ? `${subGap}#emph(text(fill: ${p}.text, ${s(c.subtitle)}))` : ''}`
        if (rail) return `#block(sticky: true, railrow(${p}, ${s(c.dates)})[${head}])`
        return `#block(sticky: true, row([${head}], muted(${p}, ${s(c.dates)})))`
      }
      const subtitle = c.subtitle ? `${subGap}#par(text(fill: ${p}.text, ${s(c.subtitle)}))` : ''
      const meta = c.meta ? `${subGap}#muted(${p}, ${s(c.meta)})` : ''
      return `#block(sticky: true)[#sub(${p}, ${s(c.title)})${subtitle}${meta}]`
    }
  }
}

/** Default bottom margin of a block whose IR spacing is zero, as the react-pdf style sheet applies it. */
function defaultAfterPt(block: LayoutBlock, layout: LayoutProfile): number {
  switch (block.content.kind) {
    case 'experienceItem':
    case 'educationItem':
    case 'projectItem':
    case 'referenceItem':
      return layout.itemGapPt
    case 'paragraph':
      return layout.paragraphGapPt
    default:
      return 0
  }
}

/** A column's blocks with the IR's vertical rhythm. Spacing is weak, so it disappears at the top of a page. */
function flow(blocks: LayoutBlock[], styles: ResolvedStyles, p: Palette): string {
  const parts: string[] = []
  let pendingAfter = 0
  for (const block of blocks) {
    const gap = pendingAfter + block.spacingBeforePt
    if (gap > 0 && parts.length) parts.push(`#gap(${pt(gap)})`)
    parts.push(blockSource(block, styles, p))
    pendingAfter = block.spacingAfterPt > 0 ? block.spacingAfterPt : defaultAfterPt(block, styles.layout)
  }
  return parts.join('\n')
}

function columnOf(block: LayoutBlock): ColumnId {
  return block.column ?? 'main'
}

/** The whole document as Typst source. */
export function layoutToTypst(layout: LayoutDocument, styles: ResolvedStyles, meta: TypstDocumentMeta): string {
  const head = preamble(styles, meta, pageSetup(styles, meta))
  const l = styles.layout
  if (l.columns !== 2) return `${head}\n${flow(layout.blocks, styles, 'pal')}\n`

  const pageWidthPt = styles.page.widthMm * (72 / 25.4)
  const g = columnGeometry(l, pageWidthPt)
  const inverse = l.sidebarBackground && l.sidebarInverse
  const railPalette: Palette = inverse ? 'inv' : 'pal'
  const rail = flow(layout.blocks.filter((b) => columnOf(b) === 'side'), styles, railPalette)
  const main = flow(layout.blocks.filter((b) => columnOf(b) === 'main'), styles, 'pal')
  const railCell = inverse ? `[\n#show heading.where(level: 1): it => sectitle(inv, it.body)\n${rail}\n]` : `[\n${rail}\n]`
  const mainCell = `[\n${main}\n]`
  const right = l.sidebarSide === 'right'
  // Gutter between the two text columns: everything between the rail's text edge and the main column's text edge.
  const gutter = right
    ? g.mainPaddingRightPt + g.railPaddingLeftPt + (l.sidebarRule ? SIDEBAR_RULE_PT : 0)
    : g.railPaddingRightPt + (l.sidebarRule ? SIDEBAR_RULE_PT : 0) + g.mainPaddingLeftPt
  // A right rail is written after the main column, so a text extractor meets the chronology first.
  const columns = right ? `(1fr, ${pt(g.sideContentPt)})` : `(${pt(g.sideContentPt)}, 1fr)`
  const cells = right ? `${mainCell}, ${railCell}` : `${railCell}, ${mainCell}`
  return `${head}\n#grid(columns: ${columns}, column-gutter: ${pt(gutter)}, ${cells})\n`
}

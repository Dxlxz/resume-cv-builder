/**
 * Stage 1 of PDF import: positioned text items out of the file.
 *
 * Clean-room. The pipeline shape — items, lines, sections, fields — is the
 * obvious decomposition of the problem and is described publicly by several
 * projects; no implementation was copied. In particular OpenResume solves the
 * same problem under AGPL-3.0, and none of its code is used here, because
 * that licence would oblige Rizzume to publish under AGPL too.
 */

export interface TextItem {
  text: string
  /** Points from the left edge. */
  x: number
  /** Points from the BOTTOM edge, as PDF coordinates run upward. */
  y: number
  width: number
  height: number
  fontName: string
  pageIndex: number
}

export interface TextLine {
  text: string
  items: TextItem[]
  x: number
  y: number
  /** Largest glyph height on the line — a heading runs bigger than body text. */
  height: number
  pageIndex: number
}

/** Two items belong to the same line when their baselines are this close. */
const LINE_TOLERANCE_PT = 2.5

/** A gap wider than this between items means a real space, not kerning. */
const WORD_GAP_PT = 1.2

export async function readTextItems(bytes: Uint8Array): Promise<TextItem[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: bytes }).promise
  const items: TextItem[] = []

  for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex++) {
    const page = await doc.getPage(pageIndex + 1)
    const content = await page.getTextContent()

    for (const raw of content.items) {
      const item = raw as {
        str?: string
        transform?: number[]
        width?: number
        height?: number
        fontName?: string
      }
      const text = item.str ?? ''
      if (text.trim().length === 0) continue
      const transform = item.transform ?? [1, 0, 0, 1, 0, 0]
      items.push({
        text,
        x: transform[4],
        y: transform[5],
        width: item.width ?? 0,
        height: item.height ?? 0,
        fontName: item.fontName ?? '',
        pageIndex,
      })
    }
  }

  return items
}

/**
 * Group items into lines by baseline, then order the lines the way a reader
 * moves: down each page, and left-to-right within a line.
 *
 * PDF y-coordinates increase upward, so "down the page" is descending y.
 */
export function groupIntoLines(items: TextItem[]): TextLine[] {
  const lines: TextLine[] = []

  for (const item of items) {
    const line = lines.find(
      (candidate) =>
        candidate.pageIndex === item.pageIndex &&
        Math.abs(candidate.y - item.y) <= LINE_TOLERANCE_PT,
    )
    if (line) {
      line.items.push(item)
      line.height = Math.max(line.height, item.height)
      line.x = Math.min(line.x, item.x)
    } else {
      lines.push({
        text: '',
        items: [item],
        x: item.x,
        y: item.y,
        height: item.height,
        pageIndex: item.pageIndex,
      })
    }
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x)
    line.text = line.items
      .map((item, index) => {
        if (index === 0) return item.text
        const previous = line.items[index - 1]
        const gap = item.x - (previous.x + previous.width)
        // Only insert a space when the glyphs are actually apart; react-pdf and
        // most producers already emit their own spaces inside a run.
        const needsSpace = gap > WORD_GAP_PT && !/\s$/.test(previous.text) && !/^\s/.test(item.text)
        return needsSpace ? ` ${item.text}` : item.text
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return lines
    .filter((line) => line.text.length > 0)
    .sort((a, b) => (a.pageIndex - b.pageIndex) || b.y - a.y)
}

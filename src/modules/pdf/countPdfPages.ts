/**
 * Count pages in a PDF blob from the page tree's /Count (no extra dependencies). Only a /Count in a `/Type /Pages`
 * object counts: outlines (bookmarks) carry their own /Count, which Typst output has (F-006). The whole object is read
 * (from `obj` to `endobj`), so a nested dictionary before /Count does not hide it. Objects packed into compressed
 * object streams are not readable this way; the fallback then counts `/Type /Page` and, failing that, says 1.
 */
export async function countPdfPages(blob: Blob): Promise<number> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const text = new TextDecoder('latin1').decode(bytes)

  const pageTreeCounts: number[] = []
  for (const m of text.matchAll(/\/Type\s*\/Pages\b/g)) {
    const start = text.lastIndexOf(' obj', m.index)
    const end = text.indexOf('endobj', m.index)
    const object = text.slice(start < 0 ? 0 : start, end < 0 ? undefined : end)
    const count = /\/Count\s+(\d+)/.exec(object)
    if (count) pageTreeCounts.push(Number.parseInt(count[1], 10))
  }
  if (pageTreeCounts.length > 0) {
    return Math.max(...pageTreeCounts)
  }

  const pageMatches = text.match(/\/Type\s*\/Page\b/g)
  return pageMatches?.length ?? 1
}

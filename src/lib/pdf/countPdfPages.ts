/** Count pages in a PDF blob by parsing the /Count entry (no extra dependencies). */
export async function countPdfPages(blob: Blob): Promise<number> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const text = new TextDecoder('latin1').decode(bytes)

  const countMatches = [...text.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number.parseInt(m[1], 10))
  if (countMatches.length > 0) {
    return Math.max(...countMatches)
  }

  const pageMatches = text.match(/\/Type\s*\/Page\b/g)
  return pageMatches?.length ?? 1
}

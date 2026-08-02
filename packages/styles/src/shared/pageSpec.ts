import type { ResumeDocument } from '@rb/core/types/document'
import { resolveDocumentStyles } from '@rb/styles/shared/resolveDocumentStyles'

const PAGE_MM = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
} as const

export interface PageSpec {
  pageSize: ResumeDocument['meta']['pageSize']
  widthMm: number
  heightMm: number
  marginPt: number
  contentHeightPt: number
  pageWidthCss: string
  pageHeightCss: string
}

export function getPageSpec(document: ResumeDocument): PageSpec {
  const { layout, page } = resolveDocumentStyles(document)
  const dims = PAGE_MM[page.size]
  const marginPt = layout.pageMarginPt
  const contentHeightPt = page.heightMm * (72 / 25.4) - marginPt * 2

  return {
    pageSize: page.size,
    widthMm: dims.widthMm,
    heightMm: dims.heightMm,
    marginPt,
    contentHeightPt,
    pageWidthCss: page.size === 'a4' ? '210mm' : '8.5in',
    pageHeightCss: page.size === 'a4' ? '297mm' : '11in',
  }
}

const PAGE_HEIGHT_FALLBACK_PX: Record<string, number> = {
  '297mm': 1123,
  '11in': 1056,
}

/** Measure mm/in height → px using a one-time ruler element. */
export function measurePageHeightPx(pageHeightCss: string): number {
  const fallback = PAGE_HEIGHT_FALLBACK_PX[pageHeightCss] ?? 1123
  if (typeof globalThis.document === 'undefined') return fallback
  const ruler = globalThis.document.createElement('div')
  ruler.style.cssText = `position:absolute;left:-9999px;height:${pageHeightCss};width:1px;visibility:hidden;`
  globalThis.document.body.appendChild(ruler)
  const px = ruler.offsetHeight
  globalThis.document.body.removeChild(ruler)
  return px > 0 ? px : fallback
}

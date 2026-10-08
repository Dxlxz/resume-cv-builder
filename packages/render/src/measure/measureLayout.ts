import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type {
  ColumnId,
  LayoutBlock,
  LayoutDocument,
  MeasuredBlock,
  MeasuredLayout,
} from '@rb/layout/types'
import type { ResolvedStyles } from '@rb/styles'
import { MeasureRenderer } from '@rb/render/measure/MeasureRenderer'
import { pxToPt, ptToPx } from '@rb/render/measure/pxToPt'

let measureHost: HTMLDivElement | null = null

function getMeasureHost(widthPx: number): HTMLDivElement {
  if (!measureHost) {
    measureHost = document.createElement('div')
    measureHost.setAttribute('data-layout-measure', 'true')
    measureHost.style.cssText =
      'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;overflow:hidden;'
    document.body.appendChild(measureHost)
  }
  measureHost.style.width = `${widthPx}px`
  return measureHost
}

export async function measureLayout(
  layout: LayoutDocument,
  styles: ResolvedStyles,
): Promise<MeasuredLayout> {
  if (typeof document === 'undefined') {
    return estimateMeasuredLayout(layout)
  }

  // A two-column template measures each column separately, at that column's
  // width. Measuring both at the full content width would report heights for
  // line wrapping that never happens, and the page plan would be wrong.
  if (layout.columnWidthsPt) {
    const widths = layout.columnWidthsPt
    const columns: ColumnId[] = ['side', 'main']
    const measured: MeasuredBlock[] = []
    let totalHeightPt = 0

    for (const column of columns) {
      const blocks = layout.blocks.filter((block) => (block.column ?? 'main') === column)
      if (blocks.length === 0) continue
      const result = measureBlocks(blocks, styles, widths[column])
      measured.push(...result.blocks)
      totalHeightPt = Math.max(totalHeightPt, result.totalHeightPt)
    }

    if (measured.length === 0) return estimateMeasuredLayout(layout)
    return { blocks: measured, totalHeightPt, contentWidthPt: layout.contentWidthPt }
  }

  const single = measureBlocks(layout.blocks, styles, layout.contentWidthPt)
  if (single.totalHeightPt === 0) return estimateMeasuredLayout(layout)
  return {
    blocks: single.blocks,
    totalHeightPt: single.totalHeightPt,
    contentWidthPt: layout.contentWidthPt,
  }
}

/** Renders a block list into the hidden host at one width and reads it back. */
function measureBlocks(
  blocks: LayoutBlock[],
  styles: ResolvedStyles,
  widthPt: number,
): { blocks: MeasuredBlock[]; totalHeightPt: number } {
  const widthPx = ptToPx(widthPt)
  const host = getMeasureHost(widthPx)
  host.innerHTML = ''

  const container = document.createElement('div')
  host.appendChild(container)

  const root = createRoot(container)

  flushSync(() => {
    root.render(createElement(MeasureRenderer, { blocks, styles }))
  })

  const measured: MeasuredBlock[] = []
  let totalHeightPx = 0

  for (const block of blocks) {
    const el = container.querySelector(`[data-layout-id="${block.id}"]`)
    if (!el) {
      measured.push({
        ...block,
        bbox: { x: 0, y: pxToPt(totalHeightPx), width: widthPt, height: 12 },
      })
      continue
    }
    const rect = el.getBoundingClientRect()
    const hostRect = container.getBoundingClientRect()
    const topPx = rect.top - hostRect.top
    const heightPx = rect.height
    totalHeightPx = Math.max(totalHeightPx, topPx + heightPx)

    measured.push({
      ...block,
      bbox: {
        x: 0,
        y: pxToPt(topPx),
        width: pxToPt(rect.width),
        height: pxToPt(heightPx),
      },
    })
  }

  root.unmount()
  host.removeChild(container)

  return { blocks: measured, totalHeightPt: pxToPt(totalHeightPx) }
}

/**
 * Fallback when DOM is unavailable (node tests, SSR).
 *
 * Column-aware: a block in a narrow column wraps onto more lines than the same
 * block at full width, so estimating everything at the page width would report
 * heights far too small, pack the document onto too few pages, and let the
 * renderer draw blocks over each other.
 */
function estimateMeasuredLayout(layout: LayoutDocument): MeasuredLayout {
  const linePt = 10.5 * 1.4
  const fullWidth = layout.contentWidthPt
  const widthFor = (block: LayoutBlock): number =>
    layout.columnWidthsPt ? layout.columnWidthsPt[block.column ?? 'main'] : fullWidth
  // Character budget scales with the column's share of the full width.
  const scaleFor = (block: LayoutBlock): number =>
    Math.max(0.2, widthFor(block) / fullWidth)

  const yByColumn: Record<string, number> = { main: 0, side: 0 }
  const blocks: MeasuredBlock[] = layout.blocks.map((block) => {
    const scale = scaleFor(block)
    const columnKey = layout.columnWidthsPt ? (block.column ?? 'main') : 'main'
    const lines =
      block.content.kind === 'paragraph'
        ? Math.ceil(block.content.text.length / (80 * scale))
        : block.content.kind === 'bullet'
          ? Math.max(1, Math.ceil(block.content.text.length / (90 * scale)))
          : block.content.kind === 'skillGroup'
            ? block.content.itemLines.length +
              (block.content.name ? 1 : 0)
            : block.content.kind === 'experienceItem'
              ? 2 +
                block.content.bullets.reduce(
                  (total, bullet) => total + Math.max(1, Math.ceil(bullet.length / (90 * scale))),
                  0,
                )
              : block.content.kind === 'itemHeader'
                ? 2
                : block.content.kind === 'header'
                  ? 2 + block.content.metaLines.length
                  : 2
    const height = lines * linePt
    const top = yByColumn[columnKey] + block.spacingBeforePt
    yByColumn[columnKey] = top + height + block.spacingAfterPt
    return {
      ...block,
      bbox: { x: 0, y: top, width: widthFor(block), height },
    }
  })
  return {
    blocks,
    totalHeightPt: Math.max(yByColumn.main, yByColumn.side),
    contentWidthPt: layout.contentWidthPt,
  }
}

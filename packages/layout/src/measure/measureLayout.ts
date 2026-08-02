import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { LayoutDocument, MeasuredBlock, MeasuredLayout } from '@rb/layout/types'
import type { ResolvedStyles } from '@rb/styles'
import { MeasureRenderer } from '@rb/layout/measure/MeasureRenderer'
import { pxToPt, ptToPx } from '@rb/layout/measure/pxToPt'

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

  const widthPx = ptToPx(layout.contentWidthPt)
  const host = getMeasureHost(widthPx)
  host.innerHTML = ''

  const container = document.createElement('div')
  host.appendChild(container)

  const root = createRoot(container)

  flushSync(() => {
    root.render(createElement(MeasureRenderer, { blocks: layout.blocks, styles }))
  })

  const measured: MeasuredBlock[] = []
  let totalHeightPx = 0

  for (const block of layout.blocks) {
    const el = container.querySelector(`[data-layout-id="${block.id}"]`)
    if (!el) {
      measured.push({
        ...block,
        bbox: { x: 0, y: pxToPt(totalHeightPx), width: layout.contentWidthPt, height: 12 },
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

  if (totalHeightPx === 0) {
    return estimateMeasuredLayout(layout)
  }

  return {
    blocks: measured,
    totalHeightPt: pxToPt(totalHeightPx),
    contentWidthPt: layout.contentWidthPt,
  }
}

/** Fallback when DOM is unavailable (tests without measure host). */
function estimateMeasuredLayout(layout: LayoutDocument): MeasuredLayout {
  const linePt = 10.5 * 1.4
  let y = 0
  const blocks: MeasuredBlock[] = layout.blocks.map((block) => {
    const lines =
      block.content.kind === 'paragraph'
        ? Math.ceil(block.content.text.length / 80)
        : block.content.kind === 'bullet'
          ? Math.max(1, Math.ceil(block.content.text.length / 90))
          : block.content.kind === 'skillGroup'
            ? block.content.itemLines.length +
              (block.content.name ? 1 : 0)
            : block.content.kind === 'experienceItem'
              ? 2 + block.content.bullets.length
              : block.content.kind === 'itemHeader'
                ? 2
                : block.content.kind === 'header'
                  ? 2 + block.content.metaLines.length
                  : 2
    const height = lines * linePt
    const top = y + block.spacingBeforePt
    y = top + height + block.spacingAfterPt
    return {
      ...block,
      bbox: { x: 0, y: top, width: layout.contentWidthPt, height },
    }
  })
  return {
    blocks,
    totalHeightPt: y,
    contentWidthPt: layout.contentWidthPt,
  }
}

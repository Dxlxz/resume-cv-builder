import type { LayoutBlock } from '@rb/layout/types'
import type { ResolvedStyles } from '@rb/styles'
import { LayoutBlockHtml } from '@rb/render/blocks/LayoutBlockHtml'

interface MeasureRendererProps {
  blocks: LayoutBlock[]
  styles: ResolvedStyles
}

export function MeasureRenderer({ blocks, styles }: MeasureRendererProps) {
  return (
    // Flex column: CSS collapses adjacent block margins but Yoga (react-pdf)
    // adds them. Flex items neither collapse with siblings nor let child
    // margins escape, so measured gaps match PDF gaps exactly.
    <div style={{ ...styles.css.root, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {blocks.map((block) => (
        <LayoutBlockHtml key={block.id} block={block} styles={styles} />
      ))}
    </div>
  )
}

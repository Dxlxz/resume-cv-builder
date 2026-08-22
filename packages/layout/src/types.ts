import type { SectionId } from '@rb/core/types/document'

export type BreakPolicy = 'auto' | 'keep' | 'keepWithNext'

/**
 * Which column a block flows in. Single-column templates leave this unset
 * and everything behaves as before; only a sidebar template splits the
 * stream, and then the two columns paginate independently.
 */
export type ColumnId = 'main' | 'side'

export type LayoutBlockType =
  | 'header'
  | 'sectionTitle'
  | 'paragraph'
  | 'bullet'
  | 'skillGroup'
  | 'experienceItem'
  | 'educationItem'
  | 'projectItem'
  | 'referenceItem'
  | 'itemHeader'

export interface BboxPt {
  x: number
  y: number
  width: number
  height: number
}

export type LayoutBlockContent =
  | { kind: 'header'; name: string; headline?: string; metaLines: string[] }
  | { kind: 'sectionTitle'; text: string; isFirst: boolean }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | {
      kind: 'skillGroup'
      name: string
      /** Comma-packed lines, used by skillsStyle 'lines'. */
      itemLines: string[]
      /** Individual items, used by skillsStyle 'grid'. */
      items: string[]
    }
  | {
      kind: 'experienceItem'
      title: string
      company: string
      location: string
      dates: string
      bullets: string[]
    }
  | {
      kind: 'educationItem'
      institution: string
      degree: string
      dates: string
      honors?: string
    }
  | {
      kind: 'projectItem'
      name: string
      description: string
      url?: string
      bullets: string[]
    }
  | {
      kind: 'referenceItem'
      name: string
      title: string
      company: string
      contactLine: string
    }
  | {
      /** Lead-in of a fragmented item — bullets follow as separate blocks. */
      kind: 'itemHeader'
      title: string
      subtitle?: string
      meta?: string
      dates?: string
    }

export interface LayoutBlock {
  id: string
  /** Defaults to 'main' when absent. */
  column?: ColumnId
  /** Section this block belongs to (the document header maps to contact). */
  sectionId: SectionId
  type: LayoutBlockType
  breakPolicy: BreakPolicy
  spacingBeforePt: number
  spacingAfterPt: number
  content: LayoutBlockContent
}

export interface LayoutDocument {
  templateId: string
  blocks: LayoutBlock[]
  contentWidthPt: number
  contentHeightPt: number
  /**
   * Present only for multi-column templates. Each column measures and
   * paginates at its own width.
   */
  columnWidthsPt?: Record<ColumnId, number>
}

export interface MeasuredBlock extends LayoutBlock {
  bbox: BboxPt
}

export interface MeasuredLayout {
  blocks: MeasuredBlock[]
  totalHeightPt: number
  contentWidthPt: number
}

export interface PageSlice {
  pageIndex: number
  blockId: string
  yPt: number
  column?: ColumnId
}

export interface PageBreak {
  yPt: number
  pageIndex: number
  reason: string
}

export interface PagePlan {
  pageCount: number
  contentHeightPt: number
  contentWidthPt: number
  slices: PageSlice[]
  breaks: PageBreak[]
  fillRatio: number[]
}

export interface BlockPdfHints {
  wrap?: boolean
  minPresenceAhead?: number
  breakBefore?: boolean
}

export interface LayoutPlanResult {
  layout: LayoutDocument
  measured: MeasuredLayout
  plan: PagePlan
  blockHints: Record<string, BlockPdfHints>
}

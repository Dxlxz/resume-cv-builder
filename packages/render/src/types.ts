import type { LayoutDocument, PagePlan } from '@rb/layout/types'
import type { ResolvedStyles } from '@rb/styles/shared/types'

export interface RenderInput {
  layout: LayoutDocument
  plan: PagePlan
  styles: ResolvedStyles
  pageSize: 'A4' | 'LETTER'
}

export interface RenderBackend {
  readonly id: string
  render(input: RenderInput): Promise<Blob>
}

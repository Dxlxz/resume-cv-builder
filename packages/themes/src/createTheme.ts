import type { ThemeId } from '@rb/core/types/document'
import type { FontStacks, LayoutProfile, ThemeTokens, TypographyScale } from '@rb/themes/types'
import {
  DEFAULT_LAYOUT,
  DEFAULT_TYPOGRAPHY,
  buildLegacyPdf,
} from '@rb/themes/types'

interface CreateThemeInput {
  id: ThemeId
  name: string
  atsSafe: boolean
  colors: ThemeTokens['colors']
  typography?: Partial<TypographyScale>
  layout?: Partial<LayoutProfile>
  fonts: FontStacks
}

export function createTheme(input: CreateThemeInput): ThemeTokens {
  const typography = { ...DEFAULT_TYPOGRAPHY, ...input.typography }
  const layout = { ...DEFAULT_LAYOUT, ...input.layout }
  const partial = { typography, fonts: input.fonts }
  return {
    id: input.id,
    name: input.name,
    atsSafe: input.atsSafe,
    colors: input.colors,
    typography,
    layout,
    fonts: input.fonts,
    pdf: buildLegacyPdf(partial),
  }
}

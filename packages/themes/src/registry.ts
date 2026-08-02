import type { TemplateId, ThemeId } from '@rb/core/types/document'
import type { ThemeTokens } from '@rb/themes/types'
import { academicSerifTheme } from '@rb/themes/academic-serif'
import { monoTheme } from '@rb/themes/mono'
import { navyCorporateTheme } from '@rb/themes/navy-corporate'

export const THEMES: Record<ThemeId, ThemeTokens> = {
  mono: monoTheme,
  'navy-corporate': navyCorporateTheme,
  'academic-serif': academicSerifTheme,
}

export const THEME_LIST = Object.values(THEMES)

export function getTheme(id: ThemeId): ThemeTokens {
  return THEMES[id]
}

/** Auto-select serif theme for academic CV layouts */
export function themeForDocument(
  templateId: TemplateId,
  documentType: 'resume' | 'cv',
  currentThemeId: ThemeId,
): ThemeId {
  if (documentType === 'cv' && templateId === 'academic') {
    return 'academic-serif'
  }
  if (currentThemeId === 'academic-serif' && templateId !== 'academic') {
    return 'navy-corporate'
  }
  return currentThemeId
}

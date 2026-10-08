import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './theme-context'

const FALLBACK: ThemeContextValue = { theme: 'system', resolvedTheme: 'light', setTheme: () => {} }

/** The current theme and its setter. Outside a ThemeProvider (isolated component tests) it reports `system`/light. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK
}

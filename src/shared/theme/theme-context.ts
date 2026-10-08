import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextValue {
  /** The user's choice. */
  theme: Theme
  /** What is actually applied (the choice, or the operating-system setting for `system`). */
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const THEME_KEY = 'rizzume:theme'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system'

/** Reads the stored choice. Storage can throw (private windows, blocked site data): fall back to `system`. */
export function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return isTheme(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // The choice still applies for this session; it just is not remembered.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
}

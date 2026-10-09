import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { Theme } from './theme-context'
import { useTheme } from './useTheme'

/** One click moves to the next choice: system → light → dark → system. */
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }

const LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' }

const ICON: Record<Theme, typeof SunIcon> = { system: MonitorIcon, light: SunIcon, dark: MoonIcon }

/**
 * Theme switch in the app bar: a single button that cycles the choice. The icon shows the choice (not the applied
 * theme), so System and Light stay distinguishable; the name says what the next click does.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICON[theme]
  const next = NEXT[theme]
  const label = `Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} title={label} onClick={() => setTheme(next)}>
      <Icon />
    </Button>
  )
}

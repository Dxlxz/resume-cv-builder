import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'
import { THEME_KEY } from './theme-context'

afterEach(() => localStorage.clear())

describe('ThemeToggle', () => {
  it('cycles system → light → dark → system with one click each', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    const button = () => screen.getByRole('button', { name: /^Theme:/ })
    expect(button()).toHaveAccessibleName('Theme: System. Switch to Light')
    fireEvent.click(button())
    expect(button()).toHaveAccessibleName('Theme: Light. Switch to Dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    fireEvent.click(button())
    expect(button()).toHaveAccessibleName('Theme: Dark. Switch to System')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(button())
    expect(button()).toHaveAccessibleName('Theme: System. Switch to Light')
  })
})

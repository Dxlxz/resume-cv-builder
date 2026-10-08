import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'
import { THEME_KEY } from './theme-context'
import { useTheme } from './useTheme'

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <p data-testid="state">{`${theme}/${resolvedTheme}`}</p>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

function mockSystem(dark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }
  window.matchMedia = vi.fn().mockReturnValue(query)
  return {
    flip(next: boolean) {
      query.matches = next
      listeners.forEach((cb) => cb())
    },
  }
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds the dark class and stores the choice when dark is picked, and removes it for light (AC-10)', () => {
    mockSystem(false)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => screen.getByText('dark').click())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark')

    act(() => screen.getByText('light').click())
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('follows the operating system while the choice is system, including changes (AC-10)', () => {
    const system = mockSystem(true)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state').textContent).toBe('system/dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => system.flip(false))
    expect(screen.getByTestId('state').textContent).toBe('system/light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores a stored choice on load (AC-10)', () => {
    mockSystem(false)
    window.localStorage.setItem(THEME_KEY, 'dark')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state').textContent).toBe('dark/dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('renders with the system theme when localStorage throws (AC-11)', () => {
    mockSystem(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state').textContent).toBe('system/dark')
    // Choosing a theme still works for this session even though it cannot be stored.
    act(() => screen.getByText('light').click())
    expect(screen.getByTestId('state').textContent).toBe('light/light')
  })
})

import { describe, expect, it } from 'vitest'
import { ROUTE_PATHS, routeFromPath } from '@/hooks/useAppRoute'

describe('app router', () => {
  it('maps paths to routes', () => {
    expect(routeFromPath('/')).toBe('landing')
    expect(routeFromPath('/builder')).toBe('builder')
    expect(routeFromPath('/admin')).toBe('admin')
  })

  it('falls back to the landing for unknown paths', () => {
    expect(routeFromPath('/nonsense')).toBe('landing')
    expect(routeFromPath('/builder/')).toBe('landing')
    expect(routeFromPath('')).toBe('landing')
  })

  it('keeps route paths unique', () => {
    const paths = Object.values(ROUTE_PATHS)
    expect(new Set(paths).size).toBe(paths.length)
  })
})

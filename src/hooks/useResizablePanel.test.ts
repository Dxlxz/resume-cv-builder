import { describe, expect, it } from 'vitest'
import { clampPanelSize } from '@/hooks/useResizablePanel'

const bounds = { minWidth: 288, maxWidth: 448, minHeight: 320, maxHeight: 640 }

describe('clampPanelSize', () => {
  it('clamps below the minimums', () => {
    expect(clampPanelSize({ width: 100, height: 100 }, bounds)).toEqual({
      width: 288,
      height: 320,
    })
  })

  it('clamps above the maximums', () => {
    expect(clampPanelSize({ width: 900, height: 900 }, bounds)).toEqual({
      width: 448,
      height: 640,
    })
  })

  it('passes valid sizes through', () => {
    expect(clampPanelSize({ width: 384, height: 512 }, bounds)).toEqual({
      width: 384,
      height: 512,
    })
  })
})

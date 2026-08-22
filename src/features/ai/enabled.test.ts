import { describe, expect, it } from 'vitest'
import { IDRIZZ_ENABLED } from '@/features/ai/enabled'

describe('IDRIZZ_ENABLED', () => {
  it('is off unless the build explicitly opts in', () => {
    // Guards the default: a build with no VITE_IDRIZZ_ENABLED ships no chat
    // bubble, no section-guide affordance, and makes no /api/ai calls.
    expect(IDRIZZ_ENABLED).toBe(false)
  })
})

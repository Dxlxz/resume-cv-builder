import { describe, expect, it } from 'vitest'
import { pickLivePages } from './pickLivePages'

describe('pickLivePages (review NB1)', () => {
  it('keeps the page on screen even when lower-numbered pages are only near it', () => {
    expect(pickLivePages([5], [1, 2, 3, 4, 5], 3)).toEqual([5, 4, 3])
  })
  it('puts every on-screen page before the nearby ones', () => {
    expect(pickLivePages([3, 4], [1, 2, 3, 4, 5], 3)).toEqual([3, 4, 2])
  })
  it('starts from the first page when nothing is reported yet', () => {
    expect(pickLivePages([], [1, 2, 3, 4], 3)).toEqual([1, 2, 3])
  })
})

import { describe, expect, it } from 'vitest'
import { chunkSkillItems } from '@rb/layout/compile/skillLines'

describe('chunkSkillItems', () => {
  it('packs items into lines by character budget', () => {
    const items = Array.from({ length: 12 }, (_, i) => `Skill ${i + 1}`)
    const lines = chunkSkillItems(items, 40)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((line) => line.length <= 40)).toBe(true)
    expect(lines[0]).toContain('Skill 1')
    expect(lines[lines.length - 1]).toContain('Skill 12')
  })

  it('keeps all items across lines in order', () => {
    const items = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js']
    const lines = chunkSkillItems(items, 25)
    expect(lines.join(', ')).toBe(items.join(', '))
  })

  it('never drops an item longer than the budget', () => {
    const lines = chunkSkillItems(['A very long single skill name exceeding budget'], 10)
    expect(lines).toHaveLength(1)
  })

  it('returns empty for no items', () => {
    expect(chunkSkillItems([])).toEqual([])
  })
})

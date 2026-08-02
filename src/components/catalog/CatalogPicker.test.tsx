import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'

const mockState = {
  document: { meta: { presetId: 'malaysia-corporate' } },
}

vi.mock('@/app/store/documentStore', () => {
  const useDocumentStore = Object.assign(
    (selector: (s: typeof mockState) => unknown) => selector(mockState),
    { getState: () => mockState },
  )
  return { useDocumentStore }
})

describe('CatalogPicker', () => {
  it('updates value on type', () => {
    const onChange = vi.fn()
    render(
      <CatalogPicker
        catalogType="skill"
        label="Skill"
        value=""
        onChange={onChange}
        placeholder="Type skill"
      />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Python' } })
    expect(onChange).toHaveBeenCalledWith('Python')
  })

  it('selects option with keyboard enter', () => {
    const onChange = vi.fn()
    render(
      <CatalogPicker
        catalogType="skill"
        label="Skill"
        value=""
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'py' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalled()
  })
})

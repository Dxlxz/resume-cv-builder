import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { clearCatalogOverrides } from '@rb/catalog/persistence'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { CatalogPicker } from '@/components/catalog/CatalogPicker'

describe('CatalogPicker', () => {
  beforeEach(() => {
    clearCatalogOverrides()
    useCatalogStore.getState().init('malaysia-default')
  })

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

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownMessage } from '@/features/ai/MarkdownMessage'

describe('MarkdownMessage', () => {
  it('renders bold, list items, and paragraphs', () => {
    render(<MarkdownMessage text={'Tighten **these**:\n\n- one\n- two'} />)
    expect(screen.getByText('these').tagName).toBe('STRONG')
    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('renders inline code and links with UDS-mapped classes', () => {
    render(<MarkdownMessage text={'Use `npm test` and [docs](https://example.com).'} />)
    expect(screen.getByText('npm test').className).toContain('bg-muted')
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')
  })

  it('maps headings to chat-scale typography', () => {
    render(<MarkdownMessage text={'## Section heading'} />)
    expect(screen.getByText('Section heading').tagName).toBe('H3')
  })

  it('preserves plain text line breaks', () => {
    render(<MarkdownMessage text={'Hai\nbaru'} />)
    expect(screen.getByText(/Hai/)).toBeTruthy()
  })

  it('drops images and tables rather than rendering raw markup', () => {
    render(<MarkdownMessage text={'![x](y) | a |\n|---|---|'} />)
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('table')).toBeNull()
  })
})
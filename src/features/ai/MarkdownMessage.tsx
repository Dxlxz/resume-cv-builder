import { memo } from 'react'
import ReactMarkdown from 'react-markdown'

/**
 * MarkdownMessage — renders an AI/assistant reply as markdown, mapped to UDS
 * tokens. Style recipes adapted from assistant-ui (MIT, github.com/assistant-ui/
 * assistant-ui) per the Rizzume AI-chat pickup: compact chat prose, semantic
 * tokens only (enforced by local/no-primitive-tailwind), no new faces beyond
 * the UDS font stack.
 *
 * Chat constraints: text-sm base, tight list spacing, scrollable code blocks,
 * links inherit the primary token. Soft line breaks are preserved so plain
 * multi-line replies (no markdown) still read correctly.
 */

const UDS_PROSE = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="whitespace-pre-wrap leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mt-1 list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mt-1 list-decimal space-y-1 pl-4">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-2 border-border" />,
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-semibold text-foreground">{children}</h2>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground">{children}</h3>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-foreground">{children}</h4>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h5 className="text-sm font-semibold text-foreground">{children}</h5>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-1 border-l-2 border-border pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    // Inline vs block: fenced blocks arrive as <pre><code class="language-*">
    return className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-sm border border-border bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
        {children}
      </code>
    )
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-muted p-2.5 font-mono text-xs leading-relaxed text-foreground">
      {children}
    </pre>
  ),
}

export const MarkdownMessage = memo(function MarkdownMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown components={UDS_PROSE} disallowedElements={['img', 'table']} unwrapDisallowed>
      {text}
    </ReactMarkdown>
  )
})
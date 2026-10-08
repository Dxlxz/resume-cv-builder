import type { CSSProperties } from 'react'
import type { LayoutBlock } from '@rb/layout/types'
import type { ResolvedStyles } from '@rb/styles/shared/types'
import { blockWrapperStyleCss } from '@rb/render/blocks/blockSpacing'
import {
  accentBarHeightPt,
  bulletIndentPt,
  skillColumnWidth,
  skillGridGutterPt,
  skillGridRowGapPt,
  usesAccentBar,
  usesInlineRule,
  usesRail,
  usesSkillGrid,
} from '@rb/styles/shared/blockVariants'

interface LayoutBlockHtmlProps {
  block: LayoutBlock
  styles: ResolvedStyles
}

/**
 * Hanging bullet: glyph column + text column. Must match LayoutBlockPdf's
 * BulletRowPdf geometry exactly, or DOM measure wraps at different widths
 * than the PDF and the page plan drifts.
 */
function BulletRowHtml({
  text,
  styles,
  last,
}: {
  text: string
  styles: ResolvedStyles
  last?: boolean
}) {
  const { css, layout } = styles
  const line: CSSProperties = {
    fontSize: css.body.fontSize,
    lineHeight: css.body.lineHeight,
    margin: 0,
  }
  return (
    <div style={{ display: 'flex', marginBottom: last ? 0 : `${layout.bulletGapPt}pt` }}>
      <span style={{ ...line, width: `${layout.bulletIndentPt}pt`, flexShrink: 0 }}>•</span>
      <span style={{ ...line, flex: 1 }}>{text}</span>
    </div>
  )
}

/** Rail entry — must match RailRowPdf, since this is what gets measured. */
function RailRowHtml({
  dates,
  styles,
  children,
}: {
  dates?: string
  styles: ResolvedStyles
  children: React.ReactNode
}) {
  const { css, layout, typography, theme } = styles
  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          width: `${layout.railWidthPt}pt`,
          paddingRight: `${layout.railGutterPt}pt`,
          flexShrink: 0,
        }}
      >
        {dates ? (
          <p
            style={{
              ...css.meta,
              fontWeight: 700,
              color: theme.colors.textMuted,
              fontSize: `${typography.metaSize}pt`,
              margin: 0,
            }}
          >
            {dates}
          </p>
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

/** Section title with an accent bar or a trailing hairline. */
function SectionTitleHtml({ text, styles }: { text: string; styles: ResolvedStyles }) {
  const { css, layout, typography, theme } = styles
  const titleText = { ...css.sectionTitle, margin: 0, borderBottom: 'none' } as CSSProperties

  if (usesAccentBar(layout)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', ...css.sectionTitle, borderBottom: 'none' }}>
        <span
          style={{
            width: `${layout.accentBarWidthPt}pt`,
            height: `${accentBarHeightPt(layout, typography.sectionSize)}pt`,
            backgroundColor: theme.colors.accent,
            marginRight: `${layout.accentBarGapPt}pt`,
            flexShrink: 0,
          }}
        />
        <span style={titleText}>{text}</span>
      </div>
    )
  }
  if (usesInlineRule(layout)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', ...css.sectionTitle, borderBottom: 'none' }}>
        <span style={titleText}>{text}</span>
        <span
          style={{
            flex: 1,
            height: `${layout.headerBorderWidthPt}pt`,
            backgroundColor: theme.colors.border,
            marginLeft: `${layout.inlineRuleGapPt}pt`,
          }}
        />
      </div>
    )
  }
  return <h2 style={css.sectionTitle}>{text}</h2>
}

export function LayoutBlockHtml({ block, styles }: LayoutBlockHtmlProps) {
  const { css, layout } = styles
  const { content } = block
  const wrapperStyle = blockWrapperStyleCss(block)

  switch (content.kind) {
    case 'header':
      return (
        <div data-layout-id={block.id} style={wrapperStyle}>
          <div style={css.header}>
            <div style={css.name}>{content.name}</div>
            {content.headline ? (
              <p style={{ ...css.headline, marginTop: `${layout.nameToMetaPt}pt` }}>
                {content.headline}
              </p>
            ) : null}
            {content.metaLines.map((line, i) => (
              <p
                key={i}
                style={{
                  ...css.meta,
                  marginTop: `${i === 0 ? layout.nameToMetaPt : layout.metaLineGapPt}pt`,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      )
    case 'sectionTitle':
      return (
        <div data-layout-id={block.id} style={wrapperStyle}>
          <SectionTitleHtml text={content.text} styles={styles} />
        </div>
      )
    case 'paragraph':
      return (
        <p data-layout-id={block.id} style={{ ...css.body, ...wrapperStyle }}>
          {content.text}
        </p>
      )
    case 'bullet':
      return (
        <div
          data-layout-id={block.id}
          style={{ ...wrapperStyle, paddingLeft: `${bulletIndentPt(layout)}pt` }}
        >
          <BulletRowHtml text={content.text} styles={styles} last />
        </div>
      )
    case 'skillGroup':
      return (
        <div data-layout-id={block.id} style={{ ...css.body, ...wrapperStyle }}>
          {content.name && (
            <p style={{ ...css.subheading, marginBottom: `${layout.bulletGapPt}pt` }}>
              {content.name}
            </p>
          )}
          {usesSkillGrid(layout) ? (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {content.items.map((item, i) => (
                <p
                  key={i}
                  style={{
                    ...css.body,
                    width: skillColumnWidth(layout),
                    paddingRight: `${skillGridGutterPt(layout)}pt`,
                    marginBottom: `${skillGridRowGapPt(layout)}pt`,
                    boxSizing: 'border-box',
                  }}
                >
                  {item}
                </p>
              ))}
            </div>
          ) : (
            content.itemLines.map((line, i) => (
              <p key={i} style={{ ...css.body, marginBottom: i < content.itemLines.length - 1 ? `${layout.bulletGapPt}pt` : 0 }}>
                {line}
              </p>
            ))
          )}
        </div>
      )
    case 'itemHeader':
      return (
        <div data-layout-id={block.id} style={wrapperStyle}>
          {content.dates && usesRail(layout) ? (
            <RailRowHtml dates={content.dates} styles={styles}>
              <p style={css.subheading}>{content.title}</p>
              {content.subtitle ? (
                <p
                  style={{
                    ...css.body,
                    fontStyle: 'italic',
                    marginBottom: 0,
                    marginTop: `${layout.itemSubtitleGapPt}pt`,
                  }}
                >
                  {content.subtitle}
                </p>
              ) : null}
            </RailRowHtml>
          ) : content.dates ? (
            <div style={{ ...css.row, marginBottom: 0 }}>
              <div>
                <p style={css.subheading}>{content.title}</p>
                {content.subtitle ? (
                  <p
                    style={{
                      ...css.body,
                      fontStyle: 'italic',
                      marginBottom: 0,
                      marginTop: `${layout.itemSubtitleGapPt}pt`,
                    }}
                  >
                    {content.subtitle}
                  </p>
                ) : null}
              </div>
              <p style={css.date}>{content.dates}</p>
            </div>
          ) : (
            <div>
              <p style={css.subheading}>{content.title}</p>
              {content.subtitle ? (
                <p
                  style={{
                    ...css.body,
                    marginBottom: 0,
                    marginTop: `${layout.itemSubtitleGapPt}pt`,
                  }}
                >
                  {content.subtitle}
                </p>
              ) : null}
              {content.meta ? (
                <p style={{ ...css.meta, marginTop: `${layout.itemSubtitleGapPt}pt` }}>
                  {content.meta}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )
    case 'experienceItem':
      if (usesRail(layout)) {
        return (
          <div data-layout-id={block.id} style={{ ...css.itemBlock, ...wrapperStyle }}>
            <RailRowHtml dates={content.dates} styles={styles}>
              <p style={css.subheading}>{content.title}</p>
              <p
                style={{
                  ...css.body,
                  fontStyle: 'italic',
                  marginBottom: 0,
                  marginTop: `${layout.itemSubtitleGapPt}pt`,
                }}
              >
                {content.company}
                {content.location ? `, ${content.location}` : ''}
              </p>
              {content.bullets.map((bullet, i) => (
                <BulletRowHtml
                  key={i}
                  text={bullet}
                  styles={styles}
                  last={i === content.bullets.length - 1}
                />
              ))}
            </RailRowHtml>
          </div>
        )
      }
      return (
        <div data-layout-id={block.id} style={{ ...css.itemBlock, ...wrapperStyle }}>
          <div style={css.row}>
            <div>
              <p style={css.subheading}>{content.title}</p>
              <p
                style={{
                  ...css.body,
                  fontStyle: 'italic',
                  marginBottom: 0,
                  marginTop: `${layout.itemSubtitleGapPt}pt`,
                }}
              >
                {content.company}
                {content.location ? `, ${content.location}` : ''}
              </p>
            </div>
            <p style={css.date}>{content.dates}</p>
          </div>
          {content.bullets.map((bullet, i) => (
            <BulletRowHtml
              key={i}
              text={bullet}
              styles={styles}
              last={i === content.bullets.length - 1}
            />
          ))}
        </div>
      )
    case 'educationItem':
      return (
        <div data-layout-id={block.id} style={{ ...css.itemBlock, ...wrapperStyle }}>
          <div style={css.row}>
            <div>
              <p style={css.subheading}>{content.institution}</p>
              <p style={{ ...css.body, marginBottom: 0 }}>{content.degree}</p>
            </div>
            <p style={css.date}>{content.dates}</p>
          </div>
          {content.honors ? (
            <p style={{ ...css.body, marginTop: `${layout.itemSubtitleGapPt}pt` }}>
              {content.honors}
            </p>
          ) : null}
        </div>
      )
    case 'projectItem':
      return (
        <div data-layout-id={block.id} style={{ ...css.itemBlock, ...wrapperStyle }}>
          <p style={css.subheading}>{content.name}</p>
          {content.description && (
            <p style={css.body}>{content.description}</p>
          )}
          {content.url ? (
            <p style={css.meta}>{content.url.replace(/^https?:\/\//, '')}</p>
          ) : null}
          {content.bullets.map((bullet, i) => (
            <BulletRowHtml
              key={i}
              text={bullet}
              styles={styles}
              last={i === content.bullets.length - 1}
            />
          ))}
        </div>
      )
    case 'referenceItem':
      return (
        <div data-layout-id={block.id} style={{ ...css.itemBlock, ...wrapperStyle }}>
          <p style={css.subheading}>{content.name}</p>
          <p style={css.body}>
            {content.title}, {content.company}
          </p>
          {content.contactLine ? (
            <p style={css.meta}>{content.contactLine}</p>
          ) : null}
        </div>
      )
    default:
      return null
  }
}

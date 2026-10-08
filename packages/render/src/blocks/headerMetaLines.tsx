import { Text } from '@react-pdf/renderer'
import type { PdfStyle } from '@rb/styles/shared/types'
import type { LayoutProfile } from '@rb/themes/types'

interface HeaderMetaLinesPdfProps {
  lines: string[]
  metaStyle: PdfStyle
  layout: LayoutProfile
}

export function HeaderMetaLinesPdf({ lines, metaStyle, layout }: HeaderMetaLinesPdfProps) {
  return (
    <>
      {lines.map((line, index) => (
        <Text
          key={index}
          style={{
            ...metaStyle,
            marginTop: index === 0 ? layout.nameToMetaPt : layout.metaLineGapPt,
          }}
        >
          {line}
        </Text>
      ))}
    </>
  )
}

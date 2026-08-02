import type { FontStacks } from '@rb/themes/types'

/** Families registered via Font.register (not react-pdf built-ins). */
export const REGISTERED_PDF_FAMILIES = new Set<string>(['Carlito'])

function usesRegisteredFamily(fonts: FontStacks): boolean {
  return REGISTERED_PDF_FAMILIES.has(fonts.pdfBody)
}

export function pdfBodyFamily(fonts: FontStacks): string {
  return fonts.pdfBody
}

export function pdfHeadingStyle(fonts: FontStacks): {
  fontFamily: string
  fontWeight?: number
} {
  if (usesRegisteredFamily(fonts)) {
    return { fontFamily: fonts.pdfBody, fontWeight: 700 }
  }
  return { fontFamily: fonts.pdfHeading }
}

export function pdfBoldStyle(fonts: FontStacks): {
  fontFamily: string
  fontWeight?: number
} {
  if (usesRegisteredFamily(fonts)) {
    return { fontFamily: fonts.pdfBody, fontWeight: 700 }
  }
  return { fontFamily: fonts.pdfBold }
}

export function pdfItalicStyle(fonts: FontStacks): {
  fontFamily?: string
  fontStyle?: 'italic'
} {
  if (usesRegisteredFamily(fonts)) {
    return { fontFamily: fonts.pdfBody, fontStyle: 'italic' }
  }
  return { fontStyle: 'italic' }
}

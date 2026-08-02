import { createTheme } from '@rb/themes/createTheme'

export const academicSerifTheme = createTheme({
  id: 'academic-serif',
  name: 'Academic Serif',
  atsSafe: true,
  colors: {
    text: '#1a1a2e',
    textMuted: '#64748b',
    accent: '#333333',
    border: '#94a3b8',
    paper: '#ffffff',
  },
  typography: {
    nameSize: 16,
    sectionSize: 12,
    bodySize: 11,
    lineHeight: 1.45,
  },
  layout: {
    pageMarginPt: 40,
    sectionGapPt: 12,
    sectionTitleTransform: 'none',
    headerBorderBottom: false,
  },
  fonts: {
    previewBody: 'Georgia, "Times New Roman", Times, serif',
    previewHeading: 'Georgia, "Times New Roman", Times, serif',
    pdfBody: 'Times-Roman',
    pdfHeading: 'Times-Bold',
    pdfBold: 'Times-Bold',
    pdfItalic: 'Times-Italic',
  },
})

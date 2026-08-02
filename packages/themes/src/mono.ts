import { createTheme } from '@rb/themes/createTheme'

export const monoTheme = createTheme({
  id: 'mono',
  name: 'Monochrome',
  atsSafe: true,
  colors: {
    text: '#1a1a2e',
    textMuted: '#64748b',
    accent: '#000000',
    border: '#e2e8f0',
    paper: '#ffffff',
  },
  typography: {
    bodySize: 10.5,
    sectionSize: 11,
    nameSize: 18,
    lineHeight: 1.35,
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

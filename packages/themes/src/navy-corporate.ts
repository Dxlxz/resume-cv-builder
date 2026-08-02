import { createTheme } from '@rb/themes/createTheme'

export const navyCorporateTheme = createTheme({
  id: 'navy-corporate',
  name: 'Navy Corporate',
  atsSafe: true,
  colors: {
    text: '#1a1a2e',
    textMuted: '#64748b',
    accent: '#1F3864',
    border: '#e2e8f0',
    paper: '#ffffff',
  },
  typography: {
    nameSize: 18,
    sectionSize: 12,
    bodySize: 10.5,
    metaSize: 9,
    lineHeight: 1.4,
  },
  fonts: {
    previewBody: 'Carlito, Calibri, Arial, Helvetica, sans-serif',
    previewHeading: 'Carlito, Calibri, Arial, Helvetica, sans-serif',
    pdfBody: 'Carlito',
    pdfHeading: 'Carlito',
    pdfBold: 'Carlito',
    pdfItalic: 'Carlito',
  },
})

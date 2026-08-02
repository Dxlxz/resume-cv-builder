import type { PresetDefinition } from '@rb/presets/types'

export const internationalGenericPreset: PresetDefinition = {
  id: 'international-generic',
  name: 'International',
  description: 'Flexible defaults — Classic or Academic templates, US Letter or A4.',
  region: 'Global',
  defaults: {
    documentType: 'resume',
    templateId: 'classic',
    themeId: 'navy-corporate',
    pageSize: 'letter',
    exportProfile: 'standard',
    locale: 'en-US',
  },
  labels: {},
  hints: [
    'Fill sections → preview updates live → export PDF when ready',
    'Switch between Resume and CV anytime — your content is preserved',
  ],
  validators: ['ats'],
}

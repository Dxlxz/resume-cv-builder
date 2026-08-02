import type { PresetId } from '@rb/core/types/document'
import type { PresetDefinition } from '@rb/presets/types'
import { internationalGenericPreset } from '@rb/presets/international-generic'
import { malaysiaCorporatePreset } from '@rb/presets/malaysia-corporate'

export const PRESETS: Record<PresetId, PresetDefinition> = {
  'international-generic': internationalGenericPreset,
  'malaysia-corporate': malaysiaCorporatePreset,
}

export const PRESET_LIST = Object.values(PRESETS)

export function getPreset(id: PresetId): PresetDefinition {
  return PRESETS[id]
}

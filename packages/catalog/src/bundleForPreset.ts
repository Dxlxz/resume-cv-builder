import type { PresetId } from '@rb/core/types/document'

export function bundleIdForPreset(presetId: PresetId): string {
  return presetId === 'malaysia-corporate' ? 'malaysia-default' : 'international-default'
}

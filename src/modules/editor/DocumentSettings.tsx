import { useDocumentStore } from '@/modules/document'
import { PRESET_LIST, getPreset } from '@rb/presets/registry'
import { TEMPLATES } from '@rb/templates/registry'
import { THEME_LIST } from '@rb/themes/registry'
import type { DocumentType, ExportProfile, PresetId } from '@rb/core/types/document'
import { Button } from '@/shared/ui/button'
import { Field, FieldLabel } from '@/shared/ui/field'
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select'
import type { ConfirmRequest } from '@/shared/ui/confirm-dialog'

interface DocumentSettingsContentProps {
  /** Open the template gallery (hosted by the editor panel, outside this popover). */
  onBrowseTemplates: () => void
  /** Ask before a change that rewrites template, theme or export settings. */
  onRequestConfirm: (request: ConfirmRequest) => void
}

/**
 * Document settings content, hosted in the editor panel's popover: preset,
 * type, template, theme, and export profile.
 */
export function DocumentSettingsContent({ onRequestConfirm, onBrowseTemplates }: DocumentSettingsContentProps) {
  const document = useDocumentStore((s) => s.document)
  const setDocumentType = useDocumentStore((s) => s.setDocumentType)
  const setTheme = useDocumentStore((s) => s.setTheme)
  const setExportProfile = useDocumentStore((s) => s.setExportProfile)
  const applyPreset = useDocumentStore((s) => s.applyPreset)

  if (!document) return null

  const handleTypeSwitch = (type: DocumentType) => {
    if (type === document.meta.documentType) return
    onRequestConfirm({
      title: `Switch to ${type.toUpperCase()}?`,
      description: 'Your content will be preserved; the template may update.',
      confirmLabel: `Switch to ${type.toUpperCase()}`,
      onConfirm: () => setDocumentType(type),
    })
  }

  const handlePresetSwitch = (presetId: PresetId) => {
    if (presetId === document.meta.presetId) return
    const next = getPreset(presetId)
    onRequestConfirm({
      title: `Switch to ${next.name}?`,
      description: 'Template, theme and export settings will update. Your content is preserved.',
      confirmLabel: `Switch to ${next.name}`,
      onConfirm: () => applyPreset(presetId),
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Document</p>
        <p className="text-xs text-muted-foreground">Template, theme and page rules for this draft.</p>
      </div>
      <div className="grid gap-3">
        <Field>
          <FieldLabel htmlFor="setting-preset">Preset</FieldLabel>
          <NativeSelect
            id="setting-preset"
            value={document.meta.presetId}
            onChange={(e) => handlePresetSwitch(e.target.value as PresetId)}
          >
            {PRESET_LIST.map((p) => (
              <NativeSelectOption key={p.id} value={p.id}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="setting-type">Type</FieldLabel>
          <NativeSelect
            id="setting-type"
            value={document.meta.documentType}
            onChange={(e) => handleTypeSwitch(e.target.value as DocumentType)}
          >
            <NativeSelectOption value="resume">Resume</NativeSelectOption>
            <NativeSelectOption value="cv">CV</NativeSelectOption>
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="setting-template">Template</FieldLabel>
          <Button id="setting-template" type="button" variant="outline" className="justify-between" onClick={onBrowseTemplates}>
            {TEMPLATES[document.meta.templateId].name}
            <span className="text-xs text-muted-foreground">Browse</span>
          </Button>
        </Field>

        <Field>
          <FieldLabel htmlFor="setting-theme">Theme</FieldLabel>
          <NativeSelect
            id="setting-theme"
            value={document.meta.themeId}
            onChange={(e) => setTheme(e.target.value as typeof document.meta.themeId)}
          >
            {THEME_LIST.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="setting-export">Export profile</FieldLabel>
          <NativeSelect
            id="setting-export"
            value={document.meta.exportProfile}
            onChange={(e) => setExportProfile(e.target.value as ExportProfile)}
          >
            <NativeSelectOption value="standard">Standard</NativeSelectOption>
            <NativeSelectOption value="portal-safe">Portal-safe</NativeSelectOption>
          </NativeSelect>
        </Field>
      </div>
    </div>
  )
}

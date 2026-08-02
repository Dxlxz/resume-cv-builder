import { useDocumentStore } from '@/app/store/documentStore'
import { PRESET_LIST, getPreset } from '@rb/presets/registry'
import { TEMPLATE_LIST } from '@rb/templates/registry'
import { THEME_LIST } from '@rb/themes/registry'
import type { DocumentType, ExportProfile, PresetId } from '@rb/core/types/document'

/**
 * Document settings for the editor sidebar: preset, type, template, theme,
 * and export profile. Kept out of the app header so the header stays
 * identity + actions only (UDS app shell recipe).
 */
export function DocumentSettings() {
  const document = useDocumentStore((s) => s.document)
  const setDocumentType = useDocumentStore((s) => s.setDocumentType)
  const setTemplate = useDocumentStore((s) => s.setTemplate)
  const setTheme = useDocumentStore((s) => s.setTheme)
  const setExportProfile = useDocumentStore((s) => s.setExportProfile)
  const applyPreset = useDocumentStore((s) => s.applyPreset)

  if (!document) return null

  const handleTypeSwitch = (type: DocumentType) => {
    if (type === document.meta.documentType) return
    if (
      confirm(
        `Switch to ${type.toUpperCase()}? Your content will be preserved; template may update.`,
      )
    ) {
      setDocumentType(type)
    }
  }

  const handlePresetSwitch = (presetId: PresetId) => {
    if (presetId === document.meta.presetId) return
    const next = getPreset(presetId)
    if (
      confirm(
        `Switch to ${next.name}? Template, theme, and export settings will update. Content is preserved.`,
      )
    ) {
      applyPreset(presetId)
    }
  }

  const selectClass =
    'mt-1 w-full rounded-sm border border-border bg-card px-2 py-1.5 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]'

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]">
      <h3 className="text-sm font-semibold text-foreground">Document</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Template, theme, and page rules for this draft.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Preset
          <select
            className={selectClass}
            value={document.meta.presetId}
            onChange={(e) => handlePresetSwitch(e.target.value as PresetId)}
          >
            {PRESET_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Type
          <select
            className={selectClass}
            value={document.meta.documentType}
            onChange={(e) => handleTypeSwitch(e.target.value as DocumentType)}
          >
            <option value="resume">Resume</option>
            <option value="cv">CV</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Template
          <select
            className={selectClass}
            value={document.meta.templateId}
            onChange={(e) => setTemplate(e.target.value as typeof document.meta.templateId)}
          >
            {TEMPLATE_LIST.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Theme
          <select
            className={selectClass}
            value={document.meta.themeId}
            onChange={(e) => setTheme(e.target.value as typeof document.meta.themeId)}
          >
            {THEME_LIST.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground sm:col-span-2">
          Export profile
          <select
            className={selectClass}
            value={document.meta.exportProfile}
            onChange={(e) => setExportProfile(e.target.value as ExportProfile)}
          >
            <option value="standard">Standard</option>
            <option value="portal-safe">Portal-safe</option>
          </select>
        </label>
      </div>
    </div>
  )
}

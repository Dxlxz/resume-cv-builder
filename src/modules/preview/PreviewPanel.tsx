import { memo } from 'react'
import { useDocumentStore } from '@/modules/document'
import { PreviewShell } from './PreviewShell'

export const PreviewPanel = memo(function PreviewPanel({
  onTogglePreview,
}: {
  onTogglePreview?: () => void
}) {
  const document = useDocumentStore((s) => s.document)

  if (!document) return null

  const contentKey = `${document.meta.templateId}-${document.meta.themeId}-${document.meta.updatedAt}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewShell document={document} contentKey={contentKey} onTogglePreview={onTogglePreview} />
    </div>
  )
})

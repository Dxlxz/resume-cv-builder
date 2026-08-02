import { memo } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { PreviewShell } from '@/components/preview/PreviewShell'

export const PreviewPanel = memo(function PreviewPanel() {
  const document = useDocumentStore((s) => s.document)

  if (!document) return null

  const contentKey = `${document.meta.templateId}-${document.meta.themeId}-${document.meta.updatedAt}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewShell document={document} contentKey={contentKey} />
    </div>
  )
})

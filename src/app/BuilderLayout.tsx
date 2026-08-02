import { useState } from 'react'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { EditorPanel } from '@/components/editor/EditorPanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { RecoveryBanner } from '@/components/RecoveryBanner'

type MobileTab = 'edit' | 'preview'

interface BuilderLayoutProps {
  onHome: () => void
}

export function BuilderLayout({ onHome }: BuilderLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit')

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Toolbar onHome={onHome} />
      <RecoveryBanner />

      <div className="shrink-0 border-b border-border bg-card px-4 py-2 lg:hidden">
        <div className="flex gap-2" role="tablist" aria-label="Editor panels">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'edit'}
            className={`flex-1 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-state)] ${
              mobileTab === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
            onClick={() => setMobileTab('edit')}
          >
            Edit content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            className={`flex-1 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-state)] ${
              mobileTab === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
            onClick={() => setMobileTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,30%)_minmax(0,70%)]">
        <section
          className={`min-h-0 overflow-y-auto border-border bg-sidebar p-4 lg:border-r lg:p-5 ${
            mobileTab === 'edit' ? 'block' : 'hidden lg:block'
          }`}
          aria-label="Document editor"
        >
          <EditorPanel />
        </section>
        <section
          className={`flex min-h-0 flex-col overflow-hidden bg-muted p-4 lg:p-5 ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
          aria-label="Document preview"
        >
          <PreviewPanel />
        </section>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { EditorPanel } from '@/components/editor/EditorPanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { RecoveryBanner } from '@/components/RecoveryBanner'
import { IdrizzChat } from '@/components/ai/IdrizzChat'

type MobileTab = 'edit' | 'preview'

interface BuilderLayoutProps {
  onHome: () => void
}

export function BuilderLayout({ onHome }: BuilderLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit')
  const [previewHidden, setPreviewHidden] = useState(false)
  const [idrizzOpen, setIdrizzOpen] = useState(false)
  const [idrizzAsk, setIdrizzAsk] = useState<{ instruction: string; nonce: number } | null>(null)

  const askIdrizz = (instruction: string) => {
    setIdrizzAsk({ instruction, nonce: Date.now() })
    setIdrizzOpen(true)
  }

  const effectiveTab: MobileTab = previewHidden ? 'edit' : mobileTab

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Toolbar
        onHome={onHome}
        previewVisible={!previewHidden}
        onTogglePreview={() => setPreviewHidden((v) => !v)}
      />
      <RecoveryBanner />

      <div className="shrink-0 border-b border-border bg-card px-4 py-2 lg:hidden">
        <div className="flex gap-2" role="tablist" aria-label="Editor panels">
          <button
            type="button"
            role="tab"
            aria-selected={effectiveTab === 'edit'}
            className={`flex-1 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-state)] ${
              effectiveTab === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
            onClick={() => setMobileTab('edit')}
          >
            Edit content
          </button>
          {!previewHidden && (
            <button
              type="button"
              role="tab"
              aria-selected={effectiveTab === 'preview'}
              className={`flex-1 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-state)] ${
                effectiveTab === 'preview'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
              onClick={() => setMobileTab('preview')}
            >
              Preview
            </button>
          )}
        </div>
      </div>

      <main
        id="main-content"
        tabIndex={-1}
        className={`grid min-h-0 flex-1 grid-cols-1 outline-none ${
          previewHidden ? '' : 'lg:grid-cols-[minmax(380px,40%)_minmax(0,60%)]'
        }`}
      >
        <section
          className={`min-h-0 overflow-x-hidden overflow-y-auto border-border bg-sidebar p-4 lg:p-5 ${
            effectiveTab === 'edit' ? 'block' : 'hidden lg:block'
          } ${previewHidden ? '' : 'lg:border-r'}`}
          aria-label="Document editor"
        >
          <EditorPanel onAskIdrizz={askIdrizz} />
        </section>
        {!previewHidden && (
          <section
            className={`flex min-h-0 flex-col overflow-hidden bg-muted p-4 lg:p-4 ${
              effectiveTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
            aria-label="Document preview"
          >
            <PreviewPanel />
          </section>
        )}
      </main>

      <IdrizzChat
        open={idrizzOpen}
        onOpen={() => setIdrizzOpen(true)}
        onClose={() => setIdrizzOpen(false)}
        prefillInstruction={idrizzAsk?.instruction}
        prefillNonce={idrizzAsk?.nonce}
      />
    </div>
  )
}

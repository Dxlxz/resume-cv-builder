import { useEffect, useState } from 'react'
import { Toolbar } from '@/modules/toolbar'
import { EditorPanel } from '@/modules/editor'
import { PreviewPanel } from '@/modules/preview'
import { RecoveryBanner } from '@/app/RecoveryBanner'
import { FOCUS_SECTION_EVENT } from '@/shared/lib/scrollToSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type MobileTab = 'edit' | 'preview'

interface BuilderLayoutProps {
  onHome: () => void
}

/**
 * The builder: top bar, then the editor column and the preview "desk". Below the lg breakpoint one pane
 * shows at a time behind tabs; from lg both are side by side. Each pane owns its own scroll.
 */
export function BuilderLayout({ onHome }: BuilderLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('edit')
  const [previewHidden, setPreviewHidden] = useState(false)

  const effectiveTab: MobileTab = previewHidden ? 'edit' : mobileTab

  // Where to start typing: the empty Full name field, or the page itself for a filled draft. Skipped on touch devices
  // (it would raise the keyboard over the form) and whenever the user has already focused something.
  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) return
    const timer = window.setTimeout(() => {
      const active = window.document.activeElement
      if (active && active !== window.document.body) return
      const name = window.document.getElementById('contact-full-name') as HTMLInputElement | null
      const target = name && !name.value ? name : window.document.getElementById('main-content')
      target?.focus({ preventScroll: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // A jump to a section or field (from the ATS check, for example) needs the editor on screen.
  useEffect(() => {
    const showEditor = () => setMobileTab('edit')
    window.addEventListener(FOCUS_SECTION_EVENT, showEditor)
    return () => window.removeEventListener(FOCUS_SECTION_EVENT, showEditor)
  }, [])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Toolbar
        onHome={onHome}
        previewVisible={!previewHidden}
        onTogglePreview={() => setPreviewHidden((v) => !v)}
      />
      <RecoveryBanner />

      <Tabs
        value={effectiveTab}
        onValueChange={(value) => setMobileTab(value as MobileTab)}
        className="min-h-0 flex-1 gap-0"
      >
        {!previewHidden && (
          <div className="shrink-0 border-b border-border bg-background px-3 py-2 lg:hidden">
            <TabsList className="w-full" aria-label="Editor panels">
              <TabsTrigger value="edit">Edit content</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
        )}

        <main
          id="main-content"
          tabIndex={-1}
          className={`grid min-h-0 flex-1 grid-cols-1 outline-none ${
            previewHidden ? '' : 'lg:grid-cols-[minmax(var(--layout-editor-min),var(--layout-editor-split))_minmax(0,1fr)]'
          }`}
        >
          <TabsContent
            value="edit"
            forceMount
            className={`min-h-0 overflow-hidden bg-background outline-none data-[state=inactive]:hidden lg:data-[state=inactive]:block ${
              previewHidden ? '' : 'lg:border-r lg:border-border'
            }`}
            aria-label="Document editor"
          >
            <EditorPanel />
          </TabsContent>
          {!previewHidden && (
            <TabsContent
              value="preview"
              forceMount
              className="min-h-0 flex-col overflow-hidden bg-muted p-3 outline-none data-[state=active]:flex data-[state=inactive]:hidden sm:p-4 lg:flex lg:data-[state=inactive]:flex lg:p-6"
              aria-label="Document preview"
            >
              <PreviewPanel onTogglePreview={() => setPreviewHidden((v) => !v)} />
            </TabsContent>
          )}
        </main>
      </Tabs>
    </div>
  )
}

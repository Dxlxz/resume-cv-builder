import { InfoIcon, XIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'

interface FirstRunGuideProps {
  presetName: string
  onDismiss: () => void
  onUseSample: () => void
}

/**
 * The first-run hint on a blank draft: one short line, with the three steps behind a disclosure so the form stays
 * on screen. Built as plain layout (not an Alert) so it can never collapse into a narrow column.
 */
export function FirstRunGuide({ presetName, onDismiss, onUseSample }: FirstRunGuideProps) {
  return (
    <section aria-label="Getting started" className="rounded-xl bg-accent/60 p-3 ring-1 ring-foreground/10">
      <div className="flex items-start gap-3">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <strong className="font-semibold">Start with your contact details.</strong> The preview updates as you type.
          Set up for {presetName}.
        </p>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Dismiss getting started" onClick={onDismiss}>
          <XIcon aria-hidden />
        </Button>
      </div>
      <Collapsible className="mt-1 pl-7">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="link" size="xs" className="h-auto px-0">
            How it works
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
            <li>Fill in your details; the preview is the real PDF.</li>
            <li>Add the sections you need from the Sections menu.</li>
            <li>Run the ATS check, fix what it flags, then export.</li>
          </ol>
        </CollapsibleContent>
      </Collapsible>
      <div className="mt-2 pl-7">
        <Button type="button" variant="outline" size="xs" onClick={onUseSample}>
          Use a sample instead
        </Button>
      </div>
    </section>
  )
}

import { TEMPLATE_LIST } from '@rb/templates/registry'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

/**
 * Every template, as a real page 1 exported by the app's own engine from fictional sample data. The images are
 * pre-rendered (`pnpm run landing:previews`) so the landing page never loads the PDF compiler.
 */

export function TemplatesShowcase({ onStart }: { onStart: () => void }) {
  return (
    <section aria-labelledby="templates-heading" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="templates-heading" className="scroll-mt-24 font-display text-3xl font-semibold tracking-tight">
              {TEMPLATE_LIST.length} templates, one engine
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each preview is page 1 of a real exported PDF. Switch templates any time; your content stays put.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={onStart}>
            Try them on your resume
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {TEMPLATE_LIST.map((template) => (
            <li key={template.id}>
              <figure className="m-0">
                <div className="desk-grain rounded-xl bg-muted p-3 sm:p-4">
                  <img
                    src={`/landing/template-${template.id}.webp`}
                    alt={`${template.name} template, page 1 of a sample resume`}
                    width={520}
                    height={736}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full rounded-sm bg-paper shadow-md ring-1 ring-paper-foreground/10"
                  />
                </div>
                <figcaption className="mt-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{template.name}</span>
                    <Badge variant="outline">
                      {template.columns === 2 ? 'Two columns' : 'One column'}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{template.description}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { PlusIcon, XIcon } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'

interface BulletListEditorProps {
  label: string
  bullets: string[]
  placeholder?: string
  onChange: (bullets: string[]) => void
}

export function BulletListEditor({
  label,
  bullets,
  placeholder = 'Achievement or responsibility',
  onChange,
}: BulletListEditorProps) {
  const updateBullet = (index: number, value: string) => {
    const next = [...bullets]
    next[index] = value
    onChange(next)
  }

  const addBullet = () => onChange([...bullets, ''])

  const removeBullet = (index: number) => {
    if (bullets.length <= 1) {
      onChange([''])
      return
    }
    onChange(bullets.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Button type="button" variant="outline" size="sm" onClick={addBullet}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          Add bullet
        </Button>
      </div>
      <ul className="space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="pt-2 text-sm text-muted-foreground" aria-hidden="true">
              •
            </span>
            <Textarea
              aria-label={`${label} item ${index + 1}`}
              value={bullet}
              rows={2}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="min-h-11 flex-1 resize-y"
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 self-start text-muted-foreground hover:text-destructive-foreground"
              onClick={() => removeBullet(index)}
              aria-label={`Remove bullet ${index + 1}`}
              title="Remove bullet"
            >
              <XIcon aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

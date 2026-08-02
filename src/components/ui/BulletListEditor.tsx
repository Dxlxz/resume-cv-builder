import { Button } from '@/components/ui/Button'

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
        <Button type="button" variant="secondary" size="sm" onClick={addBullet}>
          + Add bullet
        </Button>
      </div>
      <ul className="space-y-2">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex gap-2">
            <span className="pt-2.5 text-sm text-muted-foreground" aria-hidden="true">
              •
            </span>
            <textarea
              aria-label={`${label} item ${index + 1}`}
              value={bullet}
              rows={2}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="min-h-[2.75rem] flex-1 resize-y rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 self-start text-muted-foreground hover:text-status-danger"
              onClick={() => removeBullet(index)}
              aria-label={`Remove bullet ${index + 1}`}
              title="Remove bullet"
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

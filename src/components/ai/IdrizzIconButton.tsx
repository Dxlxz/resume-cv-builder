interface IdrizzIconButtonProps {
  onClick: () => void
  /** Accessible name; also the tooltip. */
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

/** Round sparkle button for Idrizz, the AI assistant. */
export function IdrizzIconButton({
  onClick,
  label = 'Ask Idrizz',
  disabled = false,
  size = 'sm',
}: IdrizzIconButtonProps) {
  const box = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const icon = size === 'sm' ? 13 : 15
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`${box} flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-[var(--duration-state)] hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" />
        <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
      </svg>
    </button>
  )
}

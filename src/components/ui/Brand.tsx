interface BrandProps {
  showName?: boolean
  nameClassName?: string
}

export function BrandMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </svg>
    </span>
  )
}

export function Brand({ showName = true, nameClassName = '' }: BrandProps) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      {showName && (
        <span className={`text-[15px] font-semibold tracking-tight text-foreground ${nameClassName}`}>
          Resume &amp; CV Builder
        </span>
      )}
    </span>
  )
}

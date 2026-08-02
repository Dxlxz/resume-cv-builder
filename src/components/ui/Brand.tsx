interface BrandProps {
  showName?: boolean
  nameClassName?: string
}

/** Product logo: blue document with resume lines (public/favicon.svg). */
export function BrandMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 150 150"
      aria-hidden
    >
      <defs>
        <linearGradient id="rb-logo-grad-1" x1="75" x2="75" y1="11.26" y2="138.9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1392DE" />
          <stop offset="1" stopColor="#0B265F" />
        </linearGradient>
        <linearGradient id="rb-logo-grad-2" x1="97.21" x2="113.2" y1="31.67" y2="31.67" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8ED2F4" />
          <stop offset="1" stopColor="#5EB2E4" />
        </linearGradient>
        <linearGradient id="rb-logo-grad-3" x1="75" x2="75" y1="101.1" y2="118.6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#167CC0" />
          <stop offset="1" stopColor="#10427A" />
        </linearGradient>
      </defs>
      <path
        fill="url(#rb-logo-grad-1)"
        d="m123.7 38.9-26.2-25.4c-1.3-1.5-3.3-2.3-5.5-2.3h-55.1c-6.8 0-12.6 5.5-12.6 12.4v103.4c0 6.3 5.3 11.8 12.4 11.9h76.9c6.9 0 12.4-5.2 12.5-12v-82.6c0-2.2-0.8-4-2.4-5.4zm-6.8 88c0 1.5-1.4 2.9-3.1 2.9h-77.5c-1.5 0.2-3.3-1-3.4-2.8v-103.7c0-1.6 1.6-3.3 3.6-3.3h52v17.5c0 6.1 4.6 10.2 10.4 10.2h18v79.2z"
      />
      <polygon fill="#2E94DA" points="97.2 24.1 97.2 39.2 113.2 39.3" />
      <polygon
        fill="url(#rb-logo-grad-2)"
        points="97.2 24.1 97.2 39.2 113.2 39.3"
      />
      <path
        fill="#2E94DA"
        d="m96.9 13.1c0.3 0.6 0.3 11 0.3 11l16 15.2h11l-26.5-25.7-0.8-0.5z"
      />
      <polygon
        fill="url(#rb-logo-grad-3)"
        points="75.1 101.1 60.1 112.8 60.1 118.6 65.6 118.6 75.1 111.8 84.4 118.6 90 118.6 90 112.8"
      />
      <rect fillRule="evenodd" clipRule="evenodd" fill="#1160A1" x="44.59" y="49.04" width="30" height="9.1" />
      <rect fillRule="evenodd" clipRule="evenodd" fill="#0D5595" x="44.59" y="66.74" width="52.2" height="8.6" />
      <rect fillRule="evenodd" clipRule="evenodd" fill="#0F4C87" x="44.5" y="83.64" width="60.6" height="8.6" />
    </svg>
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

interface IconProps { className?: string }

export function FlourishIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em"
         fill="none" stroke="currentColor" strokeWidth="1.35"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 13c4-5 8-5 9 0 1-5 5-5 9 0" />
      <path d="M12 13c-3 0-5 2-5 5 3 0 5-2 5-5Zm0 0c3 0 5 2 5 5-3 0-5-2-5-5Z" />
      <path d="M12 13V6" />
    </svg>
  );
}

export function StarburstIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em"
         fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function PenIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em"
         fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4 20 4.2-1 10.7-10.7-3.2-3.2L5 15.8 4 20Z" />
      <path d="m13.8 7 3.2 3.2M4.9 15.9l3.2 3.2" />
    </svg>
  );
}

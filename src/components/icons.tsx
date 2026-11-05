// Minimal hand-written inline icons (no icon package) — keeps the bundle small
// and avoids a dependency for a handful of glyphs.

type IconProps = { className?: string };

export function JarMark({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#0f766e" />
      <path
        d="M13.5 10.5h5a1.5 1.5 0 0 1 1.5 1.5v.3a3 3 0 0 1 2 2.8v7.4a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-7.4a3 3 0 0 1 2-2.8V12a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="white"
      />
    </svg>
  );
}

export function PlannerIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 19V10M10 19V5M16 19v-6M22 19H2" />
    </svg>
  );
}

export function BillsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function AskIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function WarningIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function PencilIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function EmptyJarIllustration({ className = "h-16 w-16" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#f0fdfa" />
      <path
        d="M25 24h14a2 2 0 0 1 2 2v.6a5 5 0 0 1 3 4.6v14a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5v-14a5 5 0 0 1 3-4.6V26a2 2 0 0 1 2-2Z"
        fill="#99f6e4"
      />
      <path
        d="M25 24h14a2 2 0 0 1 2 2v.6a5 5 0 0 1 3 4.6v14a5 5 0 0 1-5 5H25a5 5 0 0 1-5-5v-14a5 5 0 0 1 3-4.6V26a2 2 0 0 1 2-2Z"
        stroke="#0f766e"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

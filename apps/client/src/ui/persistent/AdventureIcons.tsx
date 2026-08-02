export type AdventureIconName =
  | 'home'
  | 'heroes'
  | 'summon'
  | 'team'
  | 'account'
  | 'gold'
  | 'gem'
  | 'jelly'
  | 'back'
  | 'play'
  | 'lock'
  | 'star'
  | 'shield'
  | 'save';

const paths: Record<AdventureIconName, React.ReactNode> = {
  home: (
    <>
      <path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4Z" />
    </>
  ),
  heroes: (
    <>
      <circle cx="9" cy="9" r="4" />
      <circle cx="17" cy="10" r="3" />
      <path d="M3 21c0-4 2-7 6-7s6 3 6 7m0-6c3 0 5 2 5 6" />
    </>
  ),
  summon: (
    <>
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l3 3m6 6 3 3m0-12-3 3m-6 6-3 3" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  team: (
    <>
      <path d="M4 7h16v12H4Z" />
      <path d="M8 7V4h8v3M8 12h8m-4-3v6" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
    </>
  ),
  gold: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 2 3 3 7 3s7-1 7-3V7m-14 5v5c0 2 3 3 7 3s7-1 7-3v-5" />
    </>
  ),
  gem: (
    <>
      <path d="m12 21-9-10 4-7h10l4 7Z" />
      <path d="M3 11h18M7 4l5 17 5-17" />
    </>
  ),
  jelly: (
    <>
      <path d="M6 20c-2-4-2-9 0-13 2-4 10-4 12 0 2 4 2 9 0 13Z" />
      <path d="M9 12h.01M15 12h.01M9 16c2 1 4 1 6 0" />
    </>
  ),
  back: (
    <>
      <path d="m15 5-7 7 7 7M8 12h12" />
    </>
  ),
  play: (
    <>
      <path d="m8 5 11 7-11 7Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  star: (
    <>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h12l2 2v14H5Z" />
      <path d="M8 4v6h8V4m-7 16v-6h6v6" />
    </>
  ),
};

export function AdventureIcon({
  name,
  decorative = true,
}: {
  name: AdventureIconName;
  decorative?: boolean;
}) {
  return (
    <svg
      className="adventure-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
    >
      {paths[name]}
    </svg>
  );
}

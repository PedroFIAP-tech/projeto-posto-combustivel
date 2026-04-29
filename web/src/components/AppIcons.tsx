type IconProps = {
  className?: string;
};

const iconProps = (className?: string) => ({
  'aria-hidden': true,
  className,
  fill: 'none',
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
});

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 13h6V4H4v9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M14 20h6V4h-6v16Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M4 20h6v-3H4v3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M9 4h6l1 2h2v15H6V6h2l1-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M9 11h6M9 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M5 7v5h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path
        d="M5.7 12A7 7 0 1 0 8 6.8L5 9.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 7h16v12H4V7Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6 7l9-3 2 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 20V4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 20h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M8 16V9M12 16V6M16 16v-4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M17 11a2.5 2.5 0 1 0 0-5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M16 16c2.4.3 4 1.8 4.5 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 12a7.6 7.6 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.9A8 8 0 0 0 7.5 7L5 6 3 9.4l2.1 1.5A7.6 7.6 0 0 0 5 12c0 .4 0 .8.1 1.1L3 14.6 5 18l2.5-1a8 8 0 0 0 1.8 1.1l.4 2.9h4.6l.4-2.9a8 8 0 0 0 1.8-1.1l2.5 1 2-3.4-2.1-1.5c.1-.3.1-.7.1-1.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M10 6H5v12h5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13 16l4-4-4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M17 12H9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 18h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      <path d="M9.5 9a2.7 2.7 0 1 1 4.4 2.1c-1 .8-1.9 1.4-1.9 2.9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

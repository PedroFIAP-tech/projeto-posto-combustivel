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
      <rect height="15" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="6" />
      <path d="M9 4h6l1 3H8l1-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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
      <path d="M4 8.5h16v10.8H4V8.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M16.5 12.2H20v3.4h-3.5a1.7 1.7 0 0 1 0-3.4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M6 8.5 15.2 5 18 8.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M4 19.5V5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4 19.5h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <rect height="7" rx="1" stroke="currentColor" strokeWidth="1.8" width="3" x="7" y="11" />
      <rect height="11" rx="1" stroke="currentColor" strokeWidth="1.8" width="3" x="12" y="7" />
      <rect height="5" rx="1" stroke="currentColor" strokeWidth="1.8" width="3" x="17" y="13" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M9.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M17 11a2.5 2.5 0 1 0 0-5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M16 16c2.2.4 3.7 1.8 4.2 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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

export function ReceiptIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M6 4h12v16l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 20V4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 9h6M9 13h6M9 16h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function CashIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="6" />
      <path d="M7 10.5h.01M17 13.5h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 3 19 6v5.4c0 4.3-2.8 7.4-7 9.1-4.2-1.7-7-4.8-7-9.1V6l7-3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function StockIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 12.2 12 16l7-3.8M5 15.7 12 20l7-4.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...iconProps(className)}>
      <path d="M7 3.5h7l4 4V20H7V3.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 3.5V8h4M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

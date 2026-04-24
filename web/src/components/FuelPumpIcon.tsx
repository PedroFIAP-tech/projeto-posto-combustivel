type FuelPumpIconProps = {
  className?: string;
};

export function FuelPumpIcon({ className }: FuelPumpIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 21V4.8C6 3.8 6.8 3 7.8 3h6.4c1 0 1.8.8 1.8 1.8V21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M8.5 7h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M5 21h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M16 7.5h1.4c.8 0 1.4.6 1.4 1.4v5.7c0 .8.6 1.4 1.4 1.4s1.4-.6 1.4-1.4V9.8c0-.7-.3-1.3-.8-1.8l-2.1-2.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9 11h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

interface IconProps {
  className?: string;
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const LogoMark = ({ className }: IconProps) => (
  <svg viewBox="0 0 40 40" className={className}>
    <rect x="4" y="4" width="32" height="32" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="12" y="12" width="16" height="16" rx="2" fill="currentColor" opacity="0.16" />
    <path d="M14 0v6M20 0v6M26 0v6M14 34v6M20 34v6M26 34v6M0 14h6M0 20h6M0 26h6M34 14h6M34 20h6M34 26h6" stroke="currentColor" strokeWidth="2" />
    <path d="M15 22.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WindowsIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M3 5.5 10.5 4.4v7.1H3zM11.7 4.2 21 3v8.5h-9.3zM3 12.7h7.5v7L3 18.6zM11.7 12.7H21V21l-9.3-1.3z" fill="currentColor" stroke="none" />
  </svg>
);

export const AppleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M16.6 12.9c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.9-.4 7.1 1.2 9.4.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-3.8zM14.4 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 2.9 1 .1 2.1-.5 2.7-1.3z"
    />
  </svg>
);

export const LinuxIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M12 2c-2.2 0-3.3 1.8-3.3 4 0 1.5.3 2.8-.4 4.4-.6 1.4-1.6 2.7-2.5 4.2-.9 1.6-1.5 3.4-.3 4.7.6.6 1.5.8 2.3 1.4.7.6 1.3 1.5 2.4 1.5.8 0 1.3-.4 1.8-.4s1 .4 1.8.4c1.1 0 1.7-.9 2.4-1.5.8-.6 1.7-.8 2.3-1.4 1.2-1.3.6-3.1-.3-4.7-.9-1.5-1.9-2.8-2.5-4.2-.7-1.6-.4-2.9-.4-4.4 0-2.2-1.1-4-3.6-4zM10.4 5.2c.4 0 .7.5.7 1s-.3.9-.7.9-.7-.4-.7-.9.3-1 .7-1zm3.2 0c.4 0 .7.5.7 1s-.3.9-.7.9-.7-.4-.7-.9.3-1 .7-1zm-1.6 1.8c.5 0 .9.3.9.6 0 .4-.4.6-.9.6s-.9-.2-.9-.6c0-.3.4-.6.9-.6z"
    />
  </svg>
);

export const CpuIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </g>
  </svg>
);

export const GpuIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <path d="M2 7h20v9H5l-3 3V7z" />
      <circle cx="15.5" cy="11.5" r="2.6" />
      <path d="M15.5 8.9v-1M15.5 15.1v1M5 10.5h3M5 12.5h3" />
    </g>
  </svg>
);

export const RamIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <rect x="2.5" y="8" width="19" height="8" rx="1" />
      <path d="M6 16v3M10 16v3M14 16v3M18 16v3M6 8V5.5M18 8V5.5M7 11h2M11 11h2M15 11h2" />
    </g>
  </svg>
);

export const MonitorIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <rect x="3" y="4" width="18" height="12.5" rx="1.5" />
      <path d="M9 20.5h6M12 16.5v4M6 13l3-3 2.5 2 3-3.5 3.5 3.5" />
    </g>
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15.2 15.2 20 20" />
    </g>
  </svg>
);

export const ArrowLeft = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}><path d="M19 12H5M11 6l-6 6 6 6" /></g>
  </svg>
);

export const ArrowRight = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}><path d="M5 12h14M13 6l6 6-6 6" /></g>
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path d="M4.5 12.5l5 5 10-11" {...S} strokeWidth={2.4} />
  </svg>
);

export const SteamIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M12 2C6.6 2 2.2 6.3 2 11.6l5.7 2.4c.5-.3 1-.5 1.6-.5h.3l2.5-3.7v-.1c0-2.1 1.7-3.8 3.8-3.8 2.1 0 3.8 1.7 3.8 3.8s-1.7 3.8-3.8 3.8h-.2l-3.6 2.6v.2c0 1.6-1.3 2.9-2.9 2.9-1.4 0-2.5-.9-2.8-2.2L2.5 15C3.9 19 7.6 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm-3.2 15.9l-1.3-.5c.2.5.6.9 1.1 1.1 1.1.5 2.4 0 2.9-1.1.2-.5.2-1.1 0-1.6-.2-.5-.6-.9-1.1-1.1-.5-.2-1-.2-1.5 0l1.4.6c.8.3 1.2 1.2.8 2-.3.8-1.2 1.1-2 .8h-.3zm8.9-4.6c0-1.5-1.2-2.7-2.7-2.7-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.7 2.7 1.5 0 2.7-1.2 2.7-2.7zm-4.7 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"
    />
  </svg>
);

export const ExternalIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}><path d="M10 5H5v14h14v-5M14 4h6v6M20 4l-9 9" /></g>
  </svg>
);

export const RestartIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5" /></g>
  </svg>
);

export const GaugeIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <path d="M4 17.5a9 9 0 1 1 16 0" />
      <path d="M12 13.5 16 8" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
    </g>
  </svg>
);

export const WarnIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 9.5v4.5" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </g>
  </svg>
);

export const VrIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v5a2.5 2.5 0 0 1-2.5 2.5h-3.2c-.8 0-1.5-.4-1.9-1.1l-.7-1.2c-.5-.8-1.9-.8-2.4 0l-.7 1.2c-.4.7-1.1 1.1-1.9 1.1H5.5A2.5 2.5 0 0 1 3 13.5z" />
      <circle cx="8" cy="11" r="1.6" /><circle cx="16" cy="11" r="1.6" />
    </g>
  </svg>
);

export const InfoIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <g {...S}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.4" fill="currentColor" />
    </g>
  </svg>
);

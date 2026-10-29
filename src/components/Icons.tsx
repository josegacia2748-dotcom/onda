import type { SVGProps } from "react";

type IconProps = { size?: number; className?: string };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
});

export const PlayIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export const PauseIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1.2" />
    <rect x="14" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

export const NextIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M5 6.2v11.6a1 1 0 0 0 1.55.83l8.1-5.8a1 1 0 0 0 0-1.66l-8.1-5.8A1 1 0 0 0 5 6.2Z" />
    <rect x="16.5" y="5" width="2.5" height="14" rx="1.2" />
  </svg>
);

export const PrevIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M19 6.2v11.6a1 1 0 0 1-1.55.83l-8.1-5.8a1 1 0 0 1 0-1.66l8.1-5.8A1 1 0 0 1 19 6.2Z" />
    <rect x="5" y="5" width="2.5" height="14" rx="1.2" />
  </svg>
);

export const ShuffleIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 6h3.5c1.2 0 2.3.6 3 1.6l5 7.4a3.6 3.6 0 0 0 3 1.6H21" />
    <path d="M3 18h3.5c1.2 0 2.3-.6 3-1.6l1-1.5" />
    <path d="m18 3 3 3-3 3" />
    <path d="m18 15 3 3-3 3" />
  </svg>
);

export const RepeatIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M17 3l3 3-3 3" />
    <path d="M20 6H8a4 4 0 0 0-4 4v1" />
    <path d="M7 21l-3-3 3-3" />
    <path d="M4 18h12a4 4 0 0 0 4-4v-1" />
  </svg>
);

export const RepeatOneIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M17 3l3 3-3 3" />
    <path d="M20 6H8a4 4 0 0 0-4 4v1" />
    <path d="M7 21l-3-3 3-3" />
    <path d="M4 18h12a4 4 0 0 0 4-4v-1" />
    <path d="M11 10.5 12.5 9v6" />
  </svg>
);

export const HeartIcon = ({ size = 18, className, filled = false }: IconProps & { filled?: boolean }) => (
  <svg {...base(size)} className={className} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.2 4.9 13a4.6 4.6 0 0 1 6.5-6.5l.6.6.6-.6A4.6 4.6 0 0 1 19.1 13Z" />
  </svg>
);

export const DownloadIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v11" />
    <path d="m7.5 10 4.5 4.5L16.5 10" />
    <path d="M4 19.5h16" />
  </svg>
);

export const CheckIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const MoreIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

export const PlusIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SearchIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const HomeIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m3.5 10.5 8.5-7 8.5 7" />
    <path d="M5.5 9v10.5h13V9" />
    <path d="M10 19.5v-5h4v5" />
  </svg>
);

export const LibraryIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 5v14M8.5 5v14" />
    <path d="m13 6 4.5 12.5a1.4 1.4 0 0 0 1.8.9l1-.4a1.4 1.4 0 0 0 .8-1.8L16.6 4.7a1.4 1.4 0 0 0-1.8-.9l-1 .4A1.4 1.4 0 0 0 13 6Z" />
  </svg>
);

export const PaletteIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-3.6 3.5H15a2 2 0 0 0-1.4 3.4c.5.5.4 1.3-.2 1.7-.4.3-.9.4-1.4.4Z" />
    <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="7" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const TrashIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 7h16" />
    <path d="M9 7V5h6v2" />
    <path d="M6.5 7l.8 12.2A1.8 1.8 0 0 0 9.1 21h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </svg>
);

export const XIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const VolumeIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const VolumeMuteIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </svg>
);

export const BackIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);

export const OfflineIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M3 3l18 18" />
    <path d="M8.5 15.5a4.5 4.5 0 0 1 7-1.5" />
    <path d="M5 11a9 9 0 0 1 3-1.8" />
    <path d="M15.5 8.6A9 9 0 0 1 19 11" />
    <path d="M10.2 19.8a1.4 1.4 0 0 1 2 0" />
  </svg>
);

export const MusicIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </svg>
);

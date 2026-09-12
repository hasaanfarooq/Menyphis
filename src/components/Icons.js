import React from 'react';

// Common base helper
const baseProps = (size = 18, color = 'currentColor', className = '', style = {}) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className,
  style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style },
});

export function ZapIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)} fill={color === 'currentColor' ? 'currentColor' : color} stroke="none" viewBox="0 0 24 24">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function StarIcon({ size = 16, filled = true, color = '#FFB800', className = '', style }) {
  return (
    <svg
      {...baseProps(size, color, className, style)}
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 1 : 2}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function HeartIcon({ size = 18, filled = false, color = 'currentColor', className = '', style }) {
  return (
    <svg
      {...baseProps(size, color, className, style)}
      fill={filled ? (color === 'currentColor' ? '#ef4444' : color) : 'none'}
      stroke={filled ? (color === 'currentColor' ? '#ef4444' : color) : color}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function CheckIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 18, color = '#22c55e', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function XIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function XCircleIcon({ size = 18, color = '#ef4444', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

export function AlertIcon({ size = 18, color = '#ef4444', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function PackageIcon({ size = 20, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function TruckIcon({ size = 20, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function ShoppingBagIcon({ size = 20, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function SearchIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function ClockIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function TagIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export function EditIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function ImageIcon({ size = 20, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function MegaphoneIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

export function SparklesIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M19 16l.75 2.25L22 19l-2.25.75L19 22l-.75-2.25L16 19l2.25-.75L19 16z" />
    </svg>
  );
}

export function WrenchIcon({ size = 24, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export function SlidersIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export function StoreIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function PaletteIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.49 2 2 6.49 2 12c0 5.51 4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.61-.23-1.2-.64-1.67-.4-.46-.61-1.04-.61-1.66a2.5 2.5 0 0 1 2.5-2.5H18c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" />
    </svg>
  );
}

export function ShareIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function GlobeIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function BellIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function LockIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function FileTextIcon({ size = 18, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function SunIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

export function MoonIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function MonitorIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export function MailIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export function PhoneIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function MapPinIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function InstagramIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function TwitterIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  );
}

export function TikTokIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

export function YouTubeIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function KeyIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M21 2l-2 2m-1.5 1.5L14 9l-3-3L3.5 13.5a5 5 0 1 0 7 7L18 13l3.5-3.5-2-2z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
    </svg>
  );
}

export function BankIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polygon points="12 3 2 10 22 10 12 3" />
      <line x1="6" y1="10" x2="6" y2="21" />
      <line x1="10" y1="10" x2="10" y2="21" />
      <line x1="14" y1="10" x2="14" y2="21" />
      <line x1="18" y1="10" x2="18" y2="21" />
    </svg>
  );
}

export function DollarSignIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function TrashIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function SaveIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function CameraIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function UploadIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function RulerIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M2 12l10-10 10 10-10 10L2 12z" />
      <line x1="7" y1="7" x2="10" y2="10" />
      <line x1="10.5" y1="10.5" x2="12.5" y2="12.5" />
      <line x1="14" y1="14" x2="17" y2="17" />
    </svg>
  );
}

export function BadgeCheckIcon({ size = 16, color = '#22c55e', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M12 2l2.4 2.4L18 4.8l.8 3.3 2.8 1.9-1.2 3.2.4 3.4-3.1 1.4-1.7 3-3-1.6-3 1.6-1.7-3-3.1-1.4.4-3.4-1.2-3.2 2.8-1.9.8-3.3 3.6-.4z" />
      <polyline points="9 12 11 14 15 10" stroke={color === '#22c55e' ? '#fff' : 'currentColor'} strokeWidth="2" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function SettingsIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function PlusIcon({ size = 16, color = 'currentColor', className = '', style }) {
  return (
    <svg {...baseProps(size, color, className, style)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}



'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XIcon, TruckIcon } from '@/components/Icons';

export default function AnnouncementBar() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = 'announcement_dismissed';
    if (sessionStorage.getItem(key)) { setDismissed(true); return; }

    fetch('/api/banners?placement=announcement_bar')
      .then(r => r.json())
      .then(data => { if (data.length > 0) setBanner(data[0]); })
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('announcement_dismissed', '1');
    setDismissed(true);
  };

  if (!banner || dismissed) return null;

  const dismissable = banner.extra_config?.dismissable !== false;
  const showIcon = banner.extra_config?.icon;

  return (
    <div style={{
      background: banner.bg_color || '#1e293b',
      color: banner.text_color || '#ffffff',
      padding: '8px 38px 8px 14px',
      textAlign: 'center', 
      fontSize: '13px', 
      fontWeight: '500',
      position: 'relative', 
      minHeight: '36px',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '8px',
      flexWrap: 'wrap',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      lineHeight: '1.4'
    }}>
      {showIcon && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <TruckIcon size={16} color={banner.text_color || '#ffffff'} />
        </span>
      )}
      <span style={{ maxWidth: '100%', wordBreak: 'break-word' }}>{banner.title}</span>
      {banner.cta_text && banner.cta_link && (
        <Link href={banner.cta_link} style={{
          color: banner.text_color || '#ffffff',
          fontWeight: '700', 
          textDecoration: 'underline',
          fontSize: '12px',
          whiteSpace: 'nowrap'
        }}>
          {banner.cta_text} →
        </Link>
      )}
      {dismissable && (
        <button onClick={handleDismiss} aria-label="Dismiss announcement" style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: banner.text_color || '#ffffff',
          cursor: 'pointer', padding: '4px', opacity: 0.8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <XIcon size={16} />
        </button>
      )}
    </div>
  );
}

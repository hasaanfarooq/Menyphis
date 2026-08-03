'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      padding: '10px 48px 10px 16px',
      textAlign: 'center', fontSize: '14px', fontWeight: '500',
      position: 'relative', minHeight: '40px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
      flexWrap: 'wrap',
    }}>
      {showIcon && <span style={{ fontSize: '16px' }}>{banner.extra_config.icon}</span>}
      <span>{banner.title}</span>
      {banner.cta_text && banner.cta_link && (
        <Link href={banner.cta_link} style={{
          color: banner.text_color || '#ffffff',
          fontWeight: '700', textDecoration: 'underline',
          fontSize: '13px',
        }}>
          {banner.cta_text} →
        </Link>
      )}
      {dismissable && (
        <button onClick={handleDismiss} style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: banner.text_color || '#ffffff',
          fontSize: '18px', cursor: 'pointer', padding: '4px', opacity: 0.7,
          lineHeight: 1,
        }}>×</button>
      )}
    </div>
  );
}

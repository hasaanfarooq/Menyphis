'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PopupBanner() {
  const [banner, setBanner] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = 'popup_dismissed';
    if (sessionStorage.getItem(key)) return;

    fetch('/api/banners?placement=popup')
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          const b = data[0];
          const delay = parseInt(b.extra_config?.delay_seconds || 3) * 1000;
          setTimeout(() => { setBanner(b); setVisible(true); }, delay);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('popup_dismissed', '1');
    setVisible(false);
  };

  if (!banner || !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 9998, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.3s ease',
      }} />
      {/* Popup */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999, width: 'min(520px, 92vw)',
        borderRadius: '20px', overflow: 'hidden',
        boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Image */}
        {banner.image_url && (
          <div style={{ position: 'relative', height: '220px' }}>
            <img src={banner.image_url} alt={banner.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ background: banner.bg_color || '#1e293b', color: banner.text_color || '#ffffff', padding: '28px 32px' }}>
          {banner.title && (
            <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '800', color: banner.text_color || '#ffffff' }}>
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p style={{ margin: '0 0 20px', fontSize: '15px', opacity: 0.85, lineHeight: '1.5', color: banner.text_color || '#ffffff' }}>
              {banner.subtitle}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {banner.cta_text && banner.cta_link && (
              <Link href={banner.cta_link} onClick={handleClose} style={{
                flex: 1, padding: '12px 24px', background: 'white', color: '#1e293b',
                borderRadius: '8px', fontWeight: '800', fontSize: '15px',
                textDecoration: 'none', textAlign: 'center', display: 'block',
              }}>
                {banner.cta_text}
              </Link>
            )}
            <button onClick={handleClose} style={{
              padding: '12px 20px', background: 'transparent',
              color: banner.text_color || '#ffffff', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
            }}>
              No thanks
            </button>
          </div>
        </div>

        {/* Close X */}
        <button onClick={handleClose} style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
          width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
          fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>×</button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.8); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
}

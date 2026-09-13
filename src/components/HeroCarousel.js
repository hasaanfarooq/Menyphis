'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { HERO_SLIDES_DATA } from '@/lib/heroSlidesData';

export default function HeroCarousel() {
  const [slides, setSlides] = useState(HERO_SLIDES_DATA);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(r => r.json())
      .then(data => { 
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        }
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent(p => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(p => (p - 1 + slides.length) % slides.length), [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (slides.length < 2 || isHovered) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, isHovered, next]);

  // Swipe support
  const handleDragEnd = (endX) => {
    const diff = dragStart - endX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div style={{ width: '100%', height: '600px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];
  const textAlignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const textAlign = slide.text_align || 'left';

  return (
    <div
      style={{ position: 'relative', width: '100%', height: 'clamp(400px, 70vh, 700px)', overflow: 'hidden', userSelect: 'none' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={e => { setDragStart(e.clientX); setIsDragging(true); }}
      onMouseUp={e => isDragging && handleDragEnd(e.clientX)}
      onTouchStart={e => setDragStart(e.touches[0].clientX)}
      onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div key={s.id || s.title || i} style={{
          position: 'absolute', inset: 0,
          transition: 'opacity 0.8s ease, transform 0.8s ease',
          opacity: i === current ? 1 : 0,
          transform: i === current ? 'scale(1)' : 'scale(1.04)',
          pointerEvents: i === current ? 'auto' : 'none',
        }}>
          {/* Background image */}
          {s.image_url ? (
            <img src={s.image_url} alt={s.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }} />
          )}
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: s.overlay_color || 'rgba(0,0,0,0.45)' }} />
        </div>
      ))}

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: textAlignMap[textAlign] || 'flex-start',
        padding: 'clamp(18px, 4vw, 80px)', textAlign: textAlign,
        maxWidth: '100%', boxSizing: 'border-box'
      }}>
        {slide.badge_text && (
          <div key={`badge-${current}`} style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            color: slide.text_color || '#fff', padding: '6px 16px', borderRadius: '999px',
            fontSize: '12px', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase',
            marginBottom: '12px', border: '1px solid rgba(255,255,255,0.25)',
            animation: 'slideDown 0.6s ease forwards',
          }}>
            {slide.badge_text}
          </div>
        )}
        {slide.title && (
          <h1 key={`title-${current}`} style={{
            color: slide.text_color || '#ffffff',
            fontSize: 'clamp(26px, 5vw, 68px)',
            fontWeight: '900', lineHeight: '1.1',
            margin: '0 0 12px', maxWidth: '700px',
            wordBreak: 'break-word',
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.6s ease 0.1s both',
          }}>
            {slide.title}
          </h1>
        )}
        {slide.subtitle && (
          <p key={`sub-${current}`} style={{
            color: slide.text_color || '#ffffff', opacity: 0.85,
            fontSize: 'clamp(13px, 2vw, 18px)', maxWidth: '560px',
            lineHeight: '1.5', margin: '0 0 24px',
            wordBreak: 'break-word',
            animation: 'slideUp 0.6s ease 0.2s both',
          }}>
            {slide.subtitle}
          </p>
        )}
        {(slide.cta_text || slide.cta_secondary_text) && (
          <div key={`ctas-${current}`} style={{
            display: 'flex', gap: '10px', flexWrap: 'wrap',
            justifyContent: textAlignMap[textAlign] || 'flex-start',
            animation: 'slideUp 0.6s ease 0.3s both',
          }}>
            {slide.cta_text && slide.cta_link && (
              <Link href={slide.cta_link} style={{
                padding: '12px 24px', background: slide.text_color || '#ffffff',
                color: '#1e293b', borderRadius: '8px', fontWeight: '800',
                fontSize: '14px', textDecoration: 'none', display: 'inline-block',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}>
                {slide.cta_text}
              </Link>
            )}
            {slide.cta_secondary_text && slide.cta_secondary_link && (
              <Link href={slide.cta_secondary_link} style={{
                padding: '12px 24px', background: 'transparent',
                color: slide.text_color || '#ffffff', borderRadius: '8px',
                fontWeight: '700', fontSize: '14px', textDecoration: 'none',
                display: 'inline-block',
                border: `2px solid ${slide.text_color || '#ffffff'}`,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {slide.cta_secondary_text}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          {[{ dir: -1, side: 'left', icon: '‹' }, { dir: 1, side: 'right', icon: '›' }].map(({ dir, side, icon }) => (
            <button key={side} onClick={() => dir === -1 ? prev() : next()}
              className={`hero-carousel-arrow hero-carousel-arrow-${side}`}
              style={{
                position: 'absolute', top: '50%', [side]: '20px', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                color: 'white', fontSize: '24px', fontWeight: '300',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, transform 0.2s',
                zIndex: 10, lineHeight: 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
              {icon}
            </button>
          ))}
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '24px' : '7px', height: '7px',
                borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
                padding: 0, transition: 'all 0.3s ease',
              }} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {slides.length > 1 && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.2)', zIndex: 10 }}>
          <div key={current} style={{
            height: '100%', background: 'white', borderRadius: '999px',
            animation: isHovered ? 'none' : 'progress 5s linear forwards',
          }} />
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hero-carousel-arrow {
            width: 32px !important;
            height: 32px !important;
            font-size: 18px !important;
          }
          .hero-carousel-arrow-left { left: 8px !important; }
          .hero-carousel-arrow-right { right: 8px !important; }
        }
      `}</style>
    </div>
  );
}

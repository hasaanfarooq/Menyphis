'use client';

import { useState, useEffect } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WrenchIcon, CheckCircleIcon } from '@/components/Icons';

export default function MaintenanceOverlay() {
  const { get, loaded: settingsLoaded, refreshSettings } = useSiteSettings();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [togglingOffline, setTogglingOffline] = useState(false);

  useEffect(() => {
    refreshSettings?.();
    const onFocus = () => refreshSettings?.();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [pathname, refreshSettings]);

  useEffect(() => {
    // Support URL parameter ?preview_maintenance=1 for instant testing
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('preview_maintenance') === '1') {
        setPreviewMode(true);
      }
    }
  }, []);

  const rawMode = get('maintenance_mode', false);
  const isMaintenanceMode = rawMode === true || rawMode === 'true' || rawMode === '1' || rawMode === 1;
  const message = get('maintenance_message', "We're upgrading the store. Back soon!");
  const siteName = get('site_name', 'Menyphis');
  const instagram = get('social_instagram', '');
  const twitter = get('social_twitter', '');

  // If settings not loaded yet, or maintenance is off and not previewing, render nothing
  if (!settingsLoaded) return null;
  if (!isMaintenanceMode && !previewMode) return null;

  // Never block admin control panel or staff login page
  const isBypassedRoute = 
    pathname?.startsWith('/admin') || 
    pathname === '/auth/login' || 
    pathname === '/login';

  if (isBypassedRoute) return null;

  // While auth status is loading, show ambient maintenance overlay so visitor never sees protected storefront
  if (authLoading && !previewMode) {
    return (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999999,
          background: '#0b0f17',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
          {siteName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#facc15', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          Maintenance Mode Active
        </div>
      </div>
    );
  }

  const isAdminUser = Boolean(user?.is_admin || user?.role === 'super_admin' || user?.role === 'store_admin');

  // Handle email notification subscription
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.includes('@')) {
      setSubscribeError('Please enter a valid email address');
      return;
    }

    setSubscribeLoading(true);
    setSubscribeError('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail.trim(), source: 'maintenance_mode' })
      });

      const data = await res.json();
      if (res.ok) {
        setSubscribeSuccess(true);
        setSubscribeEmail('');
      } else {
        setSubscribeError(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setSubscribeError('Network error. Please try again.');
    } finally {
      setSubscribeLoading(false);
    }
  };

  // Quick disable maintenance mode directly from admin banner
  const handleDisableMaintenance = async () => {
    setTogglingOffline(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: false })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Failed to disable maintenance mode. Please visit Admin Settings.');
      }
    } catch {
      alert('Network error while disabling maintenance mode.');
    } finally {
      setTogglingOffline(false);
    }
  };

  // Countdown timer state for drop anticipation
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 8,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 0, hours: 4, minutes: 30, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. If maintenance mode is active AND user is an authenticated administrator
  // Display a persistent, floating admin alert without blocking their workflow
  if (isMaintenanceMode && isAdminUser && !previewMode) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60000,
          background: 'linear-gradient(90deg, #b91c1c, #991b1b)',
          color: '#ffffff',
          padding: '8px 16px',
          boxShadow: '0 4px 14px rgba(185, 28, 28, 0.4)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fef08a', animation: 'pulse 1.5s infinite' }} />
          <span>
            <strong>MAINTENANCE MODE IS ACTIVE:</strong> Public visitors see the offline screen. You have Admin Bypass enabled.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Preview Visitor View
          </button>
          <Link
            href="/admin/settings"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Admin Settings
          </Link>
          <button
            type="button"
            disabled={togglingOffline}
            onClick={handleDisableMaintenance}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#ffffff',
              border: 'none',
              color: '#991b1b',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {togglingOffline ? 'Disabling...' : 'Turn Off Now'}
          </button>
        </div>
      </div>
    );
  }

  // 2. If maintenance mode is OFF, show nothing
  if (!isMaintenanceMode && !previewMode) return null;

  const displayBrand = siteName && siteName !== 'TEST' ? siteName : 'MENYPHIS';

  // 3. Full-Screen Luxury Streetwear Maintenance & Drop Portal
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#07080c',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        fontFamily: "'Inter', -apple-system, sans-serif"
      }}
    >
      <style>{`
        @keyframes ticker {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes floatGlow1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.18; }
          50% { transform: translate(60px, 40px) scale(1.15); opacity: 0.28; }
        }
        @keyframes floatGlow2 {
          0%, 100% { transform: translate(0, 0) scale(1.1); opacity: 0.15; }
          50% { transform: translate(-50px, -30px) scale(0.95); opacity: 0.25; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }
        @keyframes shimmerLine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .streetwear-input:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25) !important;
        }
        .vault-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.22) !important;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15) !important;
        }
        .streetwear-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.45) !important;
          background: #6366f1 !important;
        }
      `}</style>

      {/* Cyber Grid Background Matrix */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Ambient Drifting Radial Glow Spheres */}
      <div 
        style={{
          position: 'fixed',
          top: '-15%',
          left: '10%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(7, 8, 12, 0) 70%)',
          animation: 'floatGlow1 14s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '5%',
          width: '650px',
          height: '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(7, 8, 12, 0) 70%)',
          animation: 'floatGlow2 16s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Admin Preview Banner Exit Button */}
      {previewMode && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 100 }}>
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.5)'
            }}
          >
            ✕ Exit Admin Preview
          </button>
        </div>
      )}

      {/* Top Infinite Streetwear Ticker Bar */}
      <div 
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '8px 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(10px)',
          fontSize: '11px',
          letterSpacing: '0.18em',
          fontWeight: 800,
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        <div style={{ display: 'inline-flex', animation: 'ticker 28s linear infinite', gap: '32px' }}>
          <span>⚡ {displayBrand} VAULT SYSTEM REBOOT</span>
          <span>•</span>
          <span>FW26 CAPSULE DROP IMMINENT</span>
          <span>•</span>
          <span>480 GSM HEAVYWEIGHT FRENCH TERRY</span>
          <span>•</span>
          <span>RESTRICTED ACCESS PROTOCOL</span>
          <span>•</span>
          <span>MEMBERS RECEIVE 30-MIN ADVANCE QUEUE</span>
          <span>•</span>
          <span>LIMITED 1-OF-100 RUNS ONLY</span>
          <span>•</span>
          <span>DO NOT SLEEP</span>
          <span>•</span>
          <span>⚡ {displayBrand} VAULT SYSTEM REBOOT</span>
          <span>•</span>
          <span>FW26 CAPSULE DROP IMMINENT</span>
          <span>•</span>
          <span>480 GSM HEAVYWEIGHT FRENCH TERRY</span>
          <span>•</span>
          <span>RESTRICTED ACCESS PROTOCOL</span>
          <span>•</span>
          <span>MEMBERS RECEIVE 30-MIN ADVANCE QUEUE</span>
          <span>•</span>
          <span>LIMITED 1-OF-100 RUNS ONLY</span>
          <span>•</span>
          <span>DO NOT SLEEP</span>
        </div>
      </div>

      {/* Main Top Navigation Header */}
      <header 
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Brand Monogram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
            }}
          >
            {displayBrand[0]}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', lineHeight: 1 }}>
              {displayBrand}
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em', color: '#94a3b8', textTransform: 'uppercase', marginTop: '4px' }}>
              Streetwear Archive // Edition 2026
            </div>
          </div>
        </div>

        {/* Live System Status Pill */}
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 16px',
            borderRadius: '999px',
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.28)',
            color: '#facc15',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          <span 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#eab308',
              boxShadow: '0 0 10px #eab308',
              animation: 'pulseDot 1.8s infinite'
            }} 
          />
          Vault Re-Architecting Active
        </div>

        {/* Social / Direct Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {instagram && (
            <a 
              href={instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}
            >
              Instagram ↗
            </a>
          )}
          {twitter && (
            <a 
              href={twitter} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}
            >
              X / Twitter ↗
            </a>
          )}
          <Link 
            href="/auth/login?redirect=/admin" 
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textDecoration: 'none'
            }}
          >
            Staff Portal →
          </Link>
        </div>
      </header>

      {/* Main 2-Column Responsive Body */}
      <main 
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          padding: '20px 32px 60px',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 0.85fr)',
          gap: '40px',
          alignItems: 'center'
        }}
      >
        {/* Left Column: Drop Pass & Countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Streetwear Drop Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#818cf8',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '4px 12px',
                borderRadius: '6px'
              }}
            >
              DROP STAGE 04 // RE-ENGINEERING
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', letterSpacing: '0.08em' }}>
              LOC: 40.7128° N, 74.0060° W
            </span>
          </div>

          {/* Main Streetwear Title */}
          <div>
            <h1 
              style={{
                fontSize: 'clamp(34px, 5vw, 56px)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
                margin: 0,
                color: '#ffffff'
              }}
            >
              Doors Locked. <br />
              <span 
                style={{
                  background: 'linear-gradient(135deg, #ffffff 30%, #818cf8 70%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Upgrading The Experience.
              </span>
            </h1>

            {/* Custom Admin Maintenance Message */}
            <div 
              style={{
                marginTop: '18px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderLeft: '3px solid #818cf8',
                borderRadius: '0 12px 12px 0',
                color: '#cbd5e1',
                fontSize: '15px',
                lineHeight: 1.6
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#818cf8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                DIRECTIVE FROM HEADQUARTERS
              </div>
              &ldquo;{message}&rdquo;
            </div>
          </div>

          {/* Cyber Countdown Flip-Timer */}
          <div 
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '24px 28px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.14em', color: '#94a3b8', textTransform: 'uppercase' }}>
                Estimated Vault Reopening
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.06em' }}>
                ● CLOCK SYNCED (UTC)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
              {[
                { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
                { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
                { label: 'Minutes', value: String(timeLeft.minutes).padStart(2, '0') },
                { label: 'Seconds', value: String(timeLeft.seconds).padStart(2, '0') },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    style={{
                      fontSize: 'clamp(24px, 3.5vw, 36px)',
                      fontWeight: 900,
                      fontFamily: "'Courier New', Courier, monospace",
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                      lineHeight: 1
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '6px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VIP Drop Pass Subscription Form */}
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.06) 100%)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              borderRadius: '20px',
              padding: '24px 28px',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🎟️</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Claim Priority Drop Pass
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Enter your email to receive an instant VIP access code granting 30-minute early entry before the public release.
            </p>

            {subscribeSuccess ? (
              <div 
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <CheckCircleIcon size={22} color="#4ade80" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>Vault Pass Confirmed!</div>
                  <div style={{ fontSize: '12px', color: '#86efac', marginTop: '2px' }}>
                    You&apos;re priority queued. We will ping your inbox with the private entry token.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                  type="email"
                  required
                  placeholder="Enter your personal email..."
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  className="streetwear-input"
                  style={{
                    flex: '1 1 240px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                />
                <button
                  type="submit"
                  disabled={subscribeLoading}
                  className="streetwear-btn"
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.4)',
                    transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s'
                  }}
                >
                  {subscribeLoading ? 'Verifying...' : 'Claim Pass ⚡'}
                </button>
              </form>
            )}

            {subscribeError && (
              <div style={{ color: '#f87171', fontSize: '12px', marginTop: '10px' }}>
                {subscribeError}
              </div>
            )}

            {/* VIP Perks Row */}
            <div 
              style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                color: '#cbd5e1',
                flexWrap: 'wrap'
              }}
            >
              <span>✓ 15% Reopen Voucher</span>
              <span>✓ 30-Min Early Access</span>
              <span>✓ Secret Capsule Link</span>
            </div>
          </div>
        </div>

        {/* Right Column: "Locked Vault Teaser Drops" */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#94a3b8' }}>
              Locked Vault Drops [FW26]
            </div>
            <div 
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#ec4899',
                background: 'rgba(236, 72, 153, 0.12)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                padding: '3px 8px',
                borderRadius: '4px'
              }}
            >
              3 CAPSULES ENCRYPTED
            </div>
          </div>

          {/* Teaser Drop Card 1 */}
          <div 
            className="vault-card"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s'
            }}
          >
            <div 
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e1b4b, #31104b)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span>🧥</span>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                🔒
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>DROP #01</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>480 GSM French Terry</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                Acid-Spill Heavyweight Hoodie
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: '#ec4899', fontWeight: 700 }}>50 Pcs Only</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>Rs 8,500</span>
              </div>
            </div>
          </div>

          {/* Teaser Drop Card 2 */}
          <div 
            className="vault-card"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s'
            }}
          >
            <div 
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #064e3b, #134e4a)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span>👖</span>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                🔒
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>DROP #02</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Ripstop Cordura Hardware</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                Cyber Modular Tactical Cargo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: '#34d399', fontWeight: 700 }}>Custom Buckles</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>Rs 11,500</span>
              </div>
            </div>
          </div>

          {/* Teaser Drop Card 3 */}
          <div 
            className="vault-card"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s'
            }}
          >
            <div 
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3730a3, #1e293b)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span>👕</span>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(3px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                🔒
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>DROP #03</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>3M Reflective Tech Silk</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                Nocturnal Stealth Windbreaker
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '12px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Water-Repellent</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1' }}>Rs 14,000</span>
              </div>
            </div>
          </div>

          {/* Social Proof / Live Waitlist Metric */}
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span>Over <strong>3,420 collectors</strong> waiting for reopen</span>
            </div>
            <span style={{ color: '#818cf8', fontWeight: 700 }}>FW26 Vault</span>
          </div>
        </div>
      </main>

      {/* Bottom Telemetry & Brand Bar */}
      <footer 
        style={{
          position: 'relative',
          zIndex: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(7, 8, 12, 0.95)',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>© 2026 {displayBrand}. All rights reserved.</span>
          <span>•</span>
          <span style={{ fontFamily: 'monospace' }}>TELEMETRY: 18MS • SECURE PROTOCOL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>PARIS • TOKYO • NEW YORK</span>
          <span>•</span>
          <Link 
            href="/auth/login?redirect=/admin" 
            style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 700 }}
          >
            Store Administration & Login →
          </Link>
        </div>
      </footer>
    </div>
  );
}

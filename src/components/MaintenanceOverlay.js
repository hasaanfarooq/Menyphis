'use client';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function MaintenanceOverlay() {
  const { get, loaded: settingsLoaded } = useSiteSettings();
  const { user, isLoaded: authLoaded } = useAuth();
  const pathname = usePathname();

  if (!settingsLoaded || !authLoaded) return null;

  const isMaintenanceMode = get('maintenance_mode', false);
  const message = get('maintenance_message', 'We are currently performing scheduled maintenance. We will be back online shortly.');
  const siteName = get('site_name', 'Menyphis');

  // Allow admins to bypass maintenance mode
  if (!isMaintenanceMode || user?.is_admin) return null;

  // Allow access to login page for admins to bypass
  if (pathname === '/login') return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: '#1e293b', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '48px', borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '500px', width: '100%',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🛠️</div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>
          {siteName} is under maintenance
        </h1>
        <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
          {message}
        </p>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Admin? <a href="/login" style={{ color: '#a5f3fc', textDecoration: 'underline' }}>Log in to bypass</a>
        </div>
      </div>
    </div>
  );
}

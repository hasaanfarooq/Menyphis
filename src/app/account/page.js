'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { 
  PackageIcon, 
  HeartIcon, 
  TruckIcon, 
  SettingsIcon, 
  CheckCircleIcon, 
  AlertIcon,
  ShoppingBagIcon,
  StoreIcon
} from '@/components/Icons';

export default function CustomerAccountPage() {
  const { user, logout, refreshAuth } = useAuth();
  const { formatPrice } = useCurrency();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit Form
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    async function fetchAccountDetails() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setProfileData(data.user);
            setName(data.user.name || '');
          }
        }
      } catch (err) {
        console.error('Failed to load account details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccountDetails();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        })
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        if (refreshAuth) refreshAuth();
        setProfileData(prev => ({ ...prev, name }));
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update profile' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profileData && !user) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShoppingBagIcon size={32} color="var(--text-muted)" />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Sign in to view account</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Please log in to your Menyphis account to view order history, track shipments, and manage your profile.
        </p>
        <Link 
          href="/auth/login" 
          style={{ 
            padding: '12px 28px', 
            background: 'var(--color-primary)', 
            color: 'white', 
            borderRadius: '9999px', 
            textDecoration: 'none', 
            fontWeight: 600,
            display: 'inline-block'
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const currentUser = profileData || user;
  const isStoreAdmin = !!currentUser.store_id || !!currentUser.store_name;
  const isSuperAdmin = currentUser.is_admin || currentUser.role === 'super_admin';

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px', minHeight: '75vh' }}>
      {/* Header Profile Card */}
      <div 
        style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-color)', 
          padding: '28px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--color-primary), #0f172a)', 
              color: '#ffffff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}
          >
            {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {currentUser.name}
              </h1>
              <span 
                style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  padding: '3px 8px', 
                  borderRadius: '9999px',
                  background: isSuperAdmin ? '#eff6ff' : isStoreAdmin ? '#fdf2f8' : '#f1f5f9',
                  color: isSuperAdmin ? '#1d4ed8' : isStoreAdmin ? '#be185d' : '#475569'
                }}
              >
                {isSuperAdmin ? 'Super Admin' : isStoreAdmin ? `Vendor: ${currentUser.store_name}` : 'Customer'}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
              {currentUser.email}
              {currentUser.created_at && (
                <span style={{ marginLeft: '12px' }}>
                  • Member since {new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(isStoreAdmin || isSuperAdmin) && (
            <Link
              href="/admin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <StoreIcon size={14} color="#ffffff" />
              Admin Portal
            </Link>
          )}
          <button
            onClick={logout}
            style={{
              padding: '10px 18px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '16px', 
          marginBottom: '28px' 
        }}
      >
        <Link
          href="/orders"
          style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
              {currentUser.orders_count ?? 0}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PackageIcon size={22} color="#2563eb" />
          </div>
        </Link>

        <Link
          href="/wishlist"
          style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Saved in Wishlist</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
              {currentUser.wishlist_count ?? 0}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartIcon size={22} color="#ef4444" filled={true} />
          </div>
        </Link>

        <div
          style={{
            background: 'var(--card-bg)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Spent</div>
            <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '4px' }}>
              {formatPrice(currentUser.total_spent ?? 0)}
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleIcon size={22} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Shortcuts & Profile Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Quick Actions Card */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'inherit' }}>
            Account Shortcuts
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PackageIcon size={18} color="var(--color-primary)" />
                View My Orders & Invoices
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>→</span>
            </Link>

            <Link
              href="/track"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TruckIcon size={18} color="var(--color-primary)" />
                Live Order Tracking
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>→</span>
            </Link>

            <Link
              href="/wishlist"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HeartIcon size={18} color="#ef4444" />
                My Saved Wishlist
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '18px' }}>→</span>
            </Link>

            {isStoreAdmin && (
              <Link
                href="/admin"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(79, 70, 229, 0.06)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                  textDecoration: 'none',
                  color: '#4f46e5',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StoreIcon size={18} color="#4f46e5" />
                  Store Admin Portal ({currentUser.store_name})
                </span>
                <span style={{ fontSize: '18px' }}>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Profile Settings Form */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px', color: 'inherit' }}>
            Profile Settings
          </h2>

          {feedback.message && (
            <div 
              style={{ 
                padding: '12px 14px', 
                borderRadius: '8px', 
                marginBottom: '16px', 
                fontSize: '13px', 
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: feedback.type === 'success' ? '#166534' : '#b91c1c',
                border: feedback.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca'
              }}
            >
              {feedback.type === 'success' ? <CheckCircleIcon size={16} /> : <AlertIcon size={16} />}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  fontSize: '13px',
                  color: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.03)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Change Password (optional)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              style={{
                marginTop: '8px',
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: updating ? 0.7 : 1
              }}
            >
              {updating ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

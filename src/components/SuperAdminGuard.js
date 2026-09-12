'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from '@/components/Icons';

export default function SuperAdminGuard({
  children,
  adminInfo: passedAdminInfo,
  feature = 'Platform Administration',
  description = 'This configuration module is restricted to platform super administrators. As a store administrator, you can manage your products, orders, reviews, and store settings.',
}) {
  const [adminInfo, setAdminInfo] = useState(passedAdminInfo || null);
  const [loading, setLoading] = useState(!passedAdminInfo && Boolean(children));

  useEffect(() => {
    if (passedAdminInfo) {
      setAdminInfo(passedAdminInfo);
      setLoading(false);
      return;
    }

    if (!children) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          setAdminInfo(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [children, passedAdminInfo]);

  // If used as a wrapper: <SuperAdminGuard>{children}</SuperAdminGuard>
  if (children) {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px', color: '#64748b' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: '#1e293b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <span>Verifying administrator privileges...</span>
        </div>
      );
    }

    // If user is verified as Super Admin, render the protected children
    if (adminInfo && adminInfo.isSuperAdmin) {
      return children;
    }
  }

  // Otherwise, render the restricted access card
  return (
    <div
      className="admin-card"
      style={{
        textAlign: 'center',
        padding: '60px 24px',
        maxWidth: '560px',
        margin: '60px auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <ShieldCheckIcon size={26} color="#2563eb" />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
        Super Admin Privileges Required
      </h2>
      <div
        style={{
          display: 'inline-block',
          background: '#f1f5f9',
          color: '#475569',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '16px',
        }}
      >
        Restricted: {feature}
      </div>
      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
        {description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <Link
          href="/admin"
          style={{
            padding: '10px 20px',
            background: '#0f172a',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Return to Admin Overview
        </Link>
        <Link
          href="/admin/store-settings"
          style={{
            padding: '10px 20px',
            background: '#f1f5f9',
            color: '#334155',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Store Settings &rarr;
        </Link>
      </div>
    </div>
  );
}

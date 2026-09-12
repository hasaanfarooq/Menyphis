'use client';

import Link from 'next/link';

export default function SellerRegisterPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'var(--bg-secondary, #0b0f17)' }}>
      <div 
        style={{ 
          maxWidth: '560px', 
          width: '100%', 
          background: 'var(--card-bg, #111827)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '20px', 
          padding: '48px 36px', 
          textAlign: 'center', 
          boxShadow: '0 25px 60px rgba(0,0,0,0.45)', 
          color: '#ffffff' 
        }}
      >
        <div 
          style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.15)', 
            color: '#818cf8', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '24px' 
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px', color: '#ffffff', letterSpacing: '-0.02em' }}>
          Curated Brand Partner Access
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.6, marginBottom: '20px' }}>
          Menyphis is a curated multi-vendor marketplace. Seller accounts and brand storefronts are provisioned exclusively by platform administrators.
        </p>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.5, marginBottom: '32px' }}>
          If you have been issued store credentials by the Menyphis management team, please sign in to access your vendor portal.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/auth/login"
            style={{
              padding: '12px 26px',
              borderRadius: '10px',
              background: '#4f46e5',
              color: '#ffffff',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '14px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
            }}
          >
            Sign In to Store Portal
          </Link>
          <Link
            href="/"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', background: 'var(--card-bg)', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
      <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 700 }}>Thank you for your order!</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '16px', lineHeight: 1.5 }}>
        Your order has been successfully placed. We're getting it ready to be shipped. 
        {orderId && <span><br />Your order ID is <strong>#{orderId}</strong>.</span>}
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/track" style={{ padding: '12px 24px', borderRadius: '8px', border: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
          Track Your Order
        </Link>
        <Link href="/orders" style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-color)', fontWeight: 600, textDecoration: 'none' }}>
          View My Orders
        </Link>
        <Link href="/shop" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', fontWeight: 600, textDecoration: 'none' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

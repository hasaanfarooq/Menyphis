'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PackageIcon, SlidersIcon, TruckIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@/components/Icons';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId.replace('#', '').trim() })
      });

      if (res.ok) {
        setOrder(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || 'Order not found');
      }
    } catch (err) {
      setError('An error occurred while tracking the order.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { text: 'Order Received', color: '#eab308', icon: <PackageIcon size={36} color="#eab308" /> };
      case 'processing': return { text: 'Processing', color: '#3b82f6', icon: <SlidersIcon size={36} color="#3b82f6" /> };
      case 'shipped': return { text: 'Shipped', color: '#8b5cf6', icon: <TruckIcon size={36} color="#8b5cf6" /> };
      case 'delivered': return { text: 'Delivered', color: '#22c55e', icon: <CheckCircleIcon size={36} color="#22c55e" /> };
      case 'cancelled': return { text: 'Cancelled', color: '#ef4444', icon: <XCircleIcon size={36} color="#ef4444" /> };
      default: return { text: status, color: '#64748b', icon: <ClockIcon size={36} color="#64748b" /> };
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', background: 'var(--bg-secondary)' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>Track Your Order</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your order ID below to check the current status and tracking details of your shipment.</p>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', marginBottom: '32px' }}>
          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="e.g. 1042"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ padding: '0 32px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'var(--text-light)', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px' }}
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>
          {error && <div style={{ color: '#ef4444', marginTop: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        </div>

        {order && (
          <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Order #{order.id}</h2>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>${parseFloat(order.total).toFixed(2)}</div>
              </div>
            </div>

            {/* Status Section */}
            {(() => {
              const display = getStatusDisplay(order.status);
              return (
                <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '40px' }}>{display.icon}</div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '4px' }}>Current Status</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: display.color }}>{display.text}</div>
                  </div>
                </div>
              )
            })()}

            {/* Tracking Info */}
            {order.tracking_number && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>Shipping Details</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Carrier</div>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: '#0f172a' }}>{order.carrier || 'Standard Shipping'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Tracking Number</div>
                    <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--color-accent)' }}>{order.tracking_number}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Order Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: 'var(--border-color)', borderRadius: '8px' }}></div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{item.product_name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.size && `Size: ${item.size} `}
                      {item.color && `• Color: ${item.color}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>${parseFloat(item.price).toFixed(2)}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Link href="/shop" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: '500' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

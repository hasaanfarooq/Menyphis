'use client';
import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import { PackageIcon } from '@/components/Icons';

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return { bg: '#fef3c7', text: '#92400e' };
      case 'processing': return { bg: '#e0f2fe', text: '#0369a1' };
      case 'shipped': return { bg: '#f3e8ff', text: '#6b21a8' };
      case 'delivered': return { bg: '#dcfce7', text: '#166534' };
      case 'cancelled': return { bg: '#fee2e2', text: '#b91c1c' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: 700 }}>My Orders</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <PackageIcon size={48} color="var(--text-muted)" />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>No orders yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You haven't placed any orders with us yet.</p>
          <Link href="/shop" style={{ padding: '12px 24px', background: 'var(--color-primary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => {
            const statusStyle = getStatusColor(order.status);
            return (
              <div key={order.id} style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Order Placed</div>
                    <div style={{ fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total</div>
                    <div style={{ fontWeight: 600 }}>{formatPrice(order.total)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Order #</div>
                    <div style={{ fontWeight: 600 }}>{order.id}</div>
                  </div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Status: <span style={{ background: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{order.status}</span></h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Shipping to: {order.shipping_address}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import Image from 'next/image';
import { PackageIcon, TruckIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@/components/Icons';

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setOrders(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { bg: '#dcfce7', text: '#166534', icon: <CheckCircleIcon size={14} color="#166534" />, label: 'Delivered' };
      case 'shipped':
        return { bg: '#f3e8ff', text: '#6b21a8', icon: <TruckIcon size={14} color="#6b21a8" />, label: 'Shipped' };
      case 'processing':
        return { bg: '#e0f2fe', text: '#0369a1', icon: <ClockIcon size={14} color="#0369a1" />, label: 'Processing' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#b91c1c', icon: <XCircleIcon size={14} color="#b91c1c" />, label: 'Cancelled' };
      case 'pending':
      default:
        return { bg: '#fef3c7', text: '#92400e', icon: <ClockIcon size={14} color="#92400e" />, label: 'Pending' };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>My Orders</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Track and review your recent marketplace purchases
          </p>
        </div>
        <Link 
          href="/shop" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 18px', 
            background: 'var(--color-primary)', 
            color: 'white', 
            borderRadius: '9999px', 
            textDecoration: 'none', 
            fontSize: '13px', 
            fontWeight: 600,
            transition: 'opacity 0.2s'
          }}
        >
          Explore Shop
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '12px' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', padding: '60px 24px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageIcon size={32} color="var(--text-muted)" />
            </div>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>No orders placed yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Looks like you haven&apos;t placed any orders yet. Discover trending streetwear from independent creators.
          </p>
          <Link 
            href="/shop" 
            style={{ 
              padding: '12px 28px', 
              background: 'var(--color-primary)', 
              color: 'white', 
              borderRadius: '9999px', 
              textDecoration: 'none', 
              fontWeight: 600, 
              fontSize: '14px',
              display: 'inline-block'
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const items = order.items || [];

            return (
              <div 
                key={order.id} 
                style={{ 
                  background: 'var(--card-bg)', 
                  borderRadius: '16px', 
                  border: '1px solid var(--border-color)', 
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {/* Header Bar */}
                <div 
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--border-color)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap', 
                    gap: '16px', 
                    background: 'rgba(0,0,0,0.02)' 
                  }}
                >
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Order Placed</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Total</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{formatPrice(order.total)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>Order ID</div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>#{order.id}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span 
                      style={{ 
                        background: badge.bg, 
                        color: badge.text, 
                        padding: '4px 12px', 
                        borderRadius: '9999px', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <Link
                      href={`/track?code=${order.id}`}
                      style={{
                        padding: '6px 14px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <TruckIcon size={13} color="currentColor" />
                      Track Package
                    </Link>
                  </div>
                </div>

                {/* Body Content / Items */}
                <div style={{ padding: '20px' }}>
                  {items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {items.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            paddingBottom: idx !== items.length - 1 ? '14px' : '0',
                            borderBottom: idx !== items.length - 1 ? '1px solid var(--border-color)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {item.product_image ? (
                              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', position: 'relative', background: '#f1f5f9', flexShrink: 0 }}>
                                <Image 
                                  src={item.product_image} 
                                  alt={item.product_name || 'Product'} 
                                  fill
                                  sizes="56px"
                                  style={{ objectFit: 'cover' }}
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <PackageIcon size={20} color="var(--text-muted)" />
                              </div>
                            )}
                            <div>
                              <Link 
                                href={item.product_slug ? `/product/${item.product_slug}` : '#'}
                                style={{ fontWeight: 600, fontSize: '14px', color: 'inherit', textDecoration: 'none' }}
                              >
                                {item.product_name || `Product #${item.product_id}`}
                              </Link>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>• Color: {item.color}</span>}
                                <span>• Qty: {item.quantity}</span>
                                {item.store_name && (
                                  <Link 
                                    href={item.store_slug ? `/store/${item.store_slug}` : '#'}
                                    style={{ 
                                      color: 'var(--color-primary)', 
                                      fontWeight: 600, 
                                      textDecoration: 'none',
                                      background: 'rgba(0,0,0,0.04)',
                                      padding: '2px 8px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {item.store_name}
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>
                            {formatPrice(parseFloat(item.price) * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Order details processed. Destination: {order.shipping_address}
                    </div>
                  )}

                  {/* Tracking info if dispatched */}
                  {(order.tracking_number || order.carrier) && (
                    <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '13px', color: '#475569' }}>
                        Carrier: <strong>{order.carrier || 'Standard Shipping'}</strong> • Tracking: <strong>{order.tracking_number}</strong>
                      </div>
                      <Link 
                        href={`/track?code=${order.id}`}
                        style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        Live Tracking Details →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

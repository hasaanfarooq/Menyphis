'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TagIcon, AlertIcon, XIcon, TruckIcon } from '@/components/Icons';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, isLoaded } = useCart();
  const { formatPrice } = useCurrency();
  const { get, loaded: settingsLoaded } = useSiteSettings();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponData, setCouponData] = useState(null); // { discountAmount, finalTotal, freeShipping, coupon }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && items.length === 0 && !isSuccess) {
      router.push('/shop');
    }
  }, [items, isLoaded, router, isSuccess]);

  useEffect(() => {
    if (settingsLoaded && !authLoading) {
      const allowGuest = get('guest_checkout', true);
      if (!allowGuest && !user) {
        router.push('/auth/login?redirect=/checkout');
      }
    }
  }, [settingsLoaded, authLoading, get, user, router]);

  useEffect(() => {
    if (user) {
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.name && !customerName) setCustomerName(user.name);
    }
  }, [user]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    setCouponData(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          orderTotal: totalPrice,
          items: items.map(i => ({ id: i.id, price: i.price, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponData(data);
        setCouponCode(couponInput.trim().toUpperCase());
      } else {
        setCouponError(data.error || 'Invalid coupon');
      }
    } catch {
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setCouponCode('');
    setCouponInput('');
    setCouponError('');
  };

  // Calculations
  const discountAmount = couponData ? couponData.discountAmount : 0;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  
  const freeShippingThreshold = parseFloat(get('free_shipping_threshold', 99));
  const defaultShippingCost = parseFloat(get('default_shipping_cost', 0));
  const taxRate = parseFloat(get('tax_rate', 0));

  const hasFreeShippingFromSettings = freeShippingThreshold > 0 && subtotalAfterDiscount >= freeShippingThreshold;
  const freeShipping = couponData?.freeShipping || hasFreeShippingFromSettings;
  const shippingCost = freeShipping ? 0 : defaultShippingCost;

  const taxCost = subtotalAfterDiscount * (taxRate / 100);
  const finalTotal = subtotalAfterDiscount + shippingCost + taxCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total: finalTotal,
          shipping_address: shippingAddress,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          coupon_code: couponCode || null,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            size: i.size,
            color: i.color
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        clearCart();
        router.push(`/checkout/success?order_id=${data.orderId}`);
      } else {
        alert(data.error || 'Failed to place order');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to place order due to a network error.');
      setLoading(false);
    }
  };

  if (!isLoaded || !settingsLoaded || authLoading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!isSuccess && items.length === 0) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Redirecting to shop...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', fontWeight: 700 }}>Checkout</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
        {/* Left Form Area */}
        <div>
          <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Contact Information */}
            <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'var(--color-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
                Contact Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="alex@example.com"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  We will send your order confirmation receipt and live tracking updates to this email.
                </span>
              </div>
            </div>

            {/* Shipping Info */}
            <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'var(--color-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                Shipping Address
              </h2>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Full Address *</label>
                <textarea 
                  required 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="123 Street Name, Apartment/Suite, City, Province/State, Postal Code"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', minHeight: '90px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Payment Info (Mock) */}
            <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'var(--color-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
                Payment Information
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>This is a simulated checkout. No real payment is required.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Card Number (Mock)</label>
                  <input type="text" placeholder="0000 0000 0000 0000" defaultValue="4242 4242 4242 4242"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Expiry (MM/YY)</label>
                    <input type="text" placeholder="12/26" defaultValue="12/26"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>CVC</label>
                    <input type="text" placeholder="123" defaultValue="123"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right Summary Area */}
        <div>
          <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Order Summary</h2>
            
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', maxHeight: '300px', overflowY: 'auto' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '15px' }}>
                  <img src={item.image_url} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.size} / {item.color} · Qty {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Input */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px' }}>Coupon Code</div>
              {couponData ? (
                // Applied coupon badge
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TagIcon size={14} color="#16a34a" /> {couponData.coupon.code} applied!
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {couponData.freeShipping ? 'Free shipping applied' : `You save ${formatPrice(couponData.discountAmount)}`}
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon}
                    aria-label="Remove coupon"
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XIcon size={14} color="#ef4444" />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    placeholder="Enter code..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${couponError ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--bg-color)', color: 'var(--text-color)', fontSize: '14px', letterSpacing: '1px', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    style={{ padding: '10px 16px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: couponLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', opacity: couponLoading || !couponInput.trim() ? 0.6 : 1 }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertIcon size={13} color="#ef4444" /> {couponError}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                <span style={{ color: freeShipping ? '#22c55e' : 'inherit' }}>
                  {freeShipping ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      FREE <TruckIcon size={14} color="#22c55e" />
                    </span>
                  ) : formatPrice(shippingCost)}
                </span>
              </div>
              {taxCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tax ({taxRate}%)</span>
                  <span>{formatPrice(taxCost)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                  <span style={{ color: '#22c55e', fontWeight: '600' }}>Coupon Discount</span>
                  <span style={{ color: '#22c55e', fontWeight: '700' }}>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed var(--border-color)', fontSize: '18px', fontWeight: 700 }}>
                <span>Total</span>
                <div style={{ textAlign: 'right' }}>
                  {(discountAmount > 0 || freeShipping) && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '400' }}>
                      {formatPrice(totalPrice + defaultShippingCost + (totalPrice * (taxRate/100)))}
                    </div>
                  )}
                  <span style={{ color: discountAmount > 0 ? 'var(--color-primary)' : 'inherit' }}>
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={loading}
              style={{ 
                width: '100%', padding: '16px', 
                background: 'var(--color-primary)', color: 'white', 
                border: 'none', borderRadius: '8px', 
                fontSize: '16px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Processing...' : `Place Order · ${formatPrice(finalTotal)}`}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Link href="/shop" style={{ color: 'var(--color-primary)' }}>← Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

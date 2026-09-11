'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFlashSale } from '@/context/FlashSaleContext';
import { ZapIcon, CheckIcon } from '@/components/Icons';

function useCountdown(endsAt) {
  const calcTimeLeft = () => {
    const diff = new Date(endsAt) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { hours, minutes, seconds, expired: false };
  };
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return timeLeft;
}

function TimerUnit({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '10px',
        padding: '8px 14px',
        minWidth: '56px',
        textAlign: 'center',
        fontSize: '28px',
        fontWeight: '800',
        color: '#fff',
        letterSpacing: '-1px',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {String(value).padStart(2, '0')}
      </div>
      <span style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </span>
    </div>
  );
}

function FlashProductCard({ product, saleDiscount, formatPrice }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const effectiveDiscount = product.custom_discount_percent ?? saleDiscount;
  const salePrice = (product.price * (1 - effectiveDiscount / 100));

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    addItem({ ...product, price: salePrice });
    setTimeout(() => setAdding(false), 800);
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      flexShrink: 0,
      width: '200px',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}
    >
      <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white', borderRadius: '999px',
            padding: '4px 10px', fontSize: '12px', fontWeight: '800',
            boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
          }}>
            -{effectiveDiscount}%
          </div>
        </div>
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>
              {formatPrice(salePrice)}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={handleAdd}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: adding ? '#22c55e' : '#1e293b',
            color: 'white', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', transition: 'background 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {adding ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckIcon size={14} color="white" /> Added!
            </span>
          ) : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function FlashSaleSection() {
  const { sale, loading } = useFlashSale();
  const scrollRef = useRef(null);
  const { formatPrice } = useCurrency();
  const timeLeft = useCountdown(sale?.ends_at || new Date().toISOString());

  if (loading || !sale) return null;
  if (timeLeft.expired) return null;

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #7f1d1d 100%)',
      padding: '48px 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative glows */}
      <div style={{ position: 'absolute', top: '-60px', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-80px', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          {/* Left: Badge + Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white', borderRadius: '6px',
                padding: '5px 14px', fontSize: '12px', fontWeight: '800',
                letterSpacing: '2px', textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                animation: 'pulse 2s infinite',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}>
                <ZapIcon size={12} color="white" /> {sale.badge_text}
              </span>
              <span style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: '700' }}>
                Up to {sale.discount_percent}% OFF
              </span>
            </div>
            <h2 style={{ color: 'white', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>
              {sale.title}
            </h2>
            {sale.subtitle && (
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '15px' }}>{sale.subtitle}</p>
            )}
          </div>

          {/* Right: Countdown */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Ends in
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TimerUnit value={timeLeft.hours} label="Hrs" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>:</span>
              <TimerUnit value={timeLeft.minutes} label="Min" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '28px', fontWeight: '800', marginBottom: '16px' }}>:</span>
              <TimerUnit value={timeLeft.seconds} label="Sec" />
            </div>
          </div>
        </div>

        {/* Products Scroll Row */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            style={{
              position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 2, width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', cursor: 'pointer', fontSize: '18px', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >‹</button>

          <div ref={scrollRef} style={{
            display: 'flex', gap: '16px', overflowX: 'auto', padding: '8px 4px 16px',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {(sale.products || []).map(p => (
              <FlashProductCard key={p.id} product={p} saleDiscount={sale.discount_percent} formatPrice={formatPrice} />
            ))}
          </div>

          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            style={{
              position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 2, width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', cursor: 'pointer', fontSize: '18px', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >›</button>
        </div>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/shop" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600',
            textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)',
            paddingBottom: '2px', transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          >
            View all sale items →
          </Link>
        </div>
      </div>
    </section>
  );
}

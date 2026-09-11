'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { StarIcon, StoreIcon, TagIcon, BadgeCheckIcon } from '@/components/Icons';

export default function TopStoresSection() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch('/api/stores?limit=6');
        if (res.ok) {
          const data = await res.json();
          setStores(data);
        }
      } catch (err) {
        console.error('Failed to load top stores:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  if (!loading && stores.length === 0) {
    return null;
  }

  return (
    <section className="top-stores-showcase-section">
      <div className="container">
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px', 
              background: 'rgba(139, 92, 246, 0.08)', 
              border: '1px solid rgba(139, 92, 246, 0.25)', 
              borderRadius: '2px', 
              fontSize: '11px', 
              fontWeight: 800, 
              color: 'var(--color-accent, #8B5CF6)', 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase', 
              marginBottom: '8px' 
            }}>
              <BadgeCheckIcon size={13} color="currentColor" /> Verified Multi-Store Marketplace
            </div>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Featured Brands & Stores
            </h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Explore independent streetwear designers, official flagship drops, and specialty creators
            </p>
          </div>

          <Link 
            href="/stores" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            Explore All Stores ({stores.length}) →
          </Link>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="top-stores-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '380px', borderRadius: '4px' }} />
            ))}
          </div>
        ) : (
          <div className="top-stores-grid">
            {stores.map((store) => (
              <Link 
                key={store.id} 
                href={`/store/${store.slug}`}
                className="store-showcase-card"
              >
                {/* Banner */}
                <div className="store-showcase-banner">
                  <img 
                    src={store.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=300&fit=crop'} 
                    alt={store.name} 
                  />
                  <div className="store-showcase-banner-overlay" />
                  
                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    <span style={{ 
                      background: 'rgba(0, 0, 0, 0.65)', 
                      backdropFilter: 'blur(6px)', 
                      color: '#FFD700', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '3px 8px', 
                      borderRadius: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <StarIcon size={12} color="#FFD700" filled={true} /> {parseFloat(store.rating || 5.0).toFixed(1)}
                    </span>
                  </div>

                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    {store.is_featured ? (
                      <span style={{ 
                        background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.9), rgba(249, 115, 22, 0.9))', 
                        color: '#000000', 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        letterSpacing: '0.5px',
                        padding: '3px 8px', 
                        borderRadius: '2px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        FEATURED
                      </span>
                    ) : (
                      <span style={{ 
                        background: 'rgba(0, 0, 0, 0.55)', 
                        backdropFilter: 'blur(4px)',
                        color: '#f8fafc', 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '2px'
                      }}>
                        OFFICIAL
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="store-showcase-body">
                  <div className="store-showcase-header">
                    <div className="store-showcase-avatar">
                      <img 
                        src={store.logo_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=160&h=160&fit=crop'} 
                        alt={store.name} 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="store-showcase-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <TagIcon size={11} color="currentColor" /> {store.product_count || 0} {store.product_count === 1 ? 'item' : 'items'}
                      </span>
                      <span className="store-showcase-pill" style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <BadgeCheckIcon size={12} color="#16a34a" /> Verified
                      </span>
                    </div>
                  </div>

                  <h3 className="store-showcase-title">
                    <span>{store.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#8B5CF6">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </h3>

                  <p className="store-showcase-tagline">
                    {store.tagline || store.description || 'Exclusive streetwear drops and curated designer collections.'}
                  </p>

                  {/* Curated Product Previews */}
                  {Array.isArray(store.preview_products) && store.preview_products.length > 0 && (
                    <div className="store-showcase-products">
                      <div className="store-showcase-products-label">
                        Featured Drops
                      </div>
                      <div className="store-showcase-thumbnails">
                        {store.preview_products.slice(0, 3).map((prod) => (
                          <div key={prod.id} className="store-thumbnail-item" title={prod.name}>
                            <img src={prod.image_url} alt={prod.name} loading="lazy" />
                            {prod.price && (
                              <span className="store-thumbnail-price">
                                {formatPrice(parseFloat(prod.price))}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bottom Action CTA */}
                  <div className="store-showcase-cta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <StoreIcon size={14} color="currentColor" /> Visit Flagship Storefront
                    </span>
                    <span className="arrow" style={{ fontSize: '15px', color: 'var(--text-primary)', transition: 'transform 0.2s ease' }}>
                      Shop Now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


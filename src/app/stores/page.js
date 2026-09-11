'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchIcon, StarIcon, StoreIcon, TagIcon, BadgeCheckIcon } from '@/components/Icons';

export default function AllStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch('/api/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data);
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.tagline && s.tagline.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ background: 'var(--bg-primary)', padding: '40px 0 80px', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ 
            display: 'inline-block', 
            padding: '4px 14px', 
            background: 'rgba(139, 92, 246, 0.08)', 
            border: '1px solid rgba(139, 92, 246, 0.2)', 
            borderRadius: 'var(--radius-full, 9999px)', 
            fontSize: '11px', 
            fontWeight: 700, 
            color: 'var(--color-accent, #8B5CF6)', 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase', 
            marginBottom: '10px' 
          }}>
            Multi-Store Marketplace
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 8px', color: 'var(--text-primary)' }}>
            Explore Verified Stores
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '560px', margin: '0 auto 24px' }}>
            Discover official designer drops, independent streetwear boutiques, and specialty creators.
          </p>

          <div style={{ maxWidth: '440px', margin: '0 auto', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search stores by name or style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 18px 10px 38px',
                borderRadius: 'var(--radius-full, 9999px)',
                border: '1px solid var(--border-color, #E8E8E8)',
                background: 'var(--bg-card, #FFFFFF)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              <SearchIcon size={16} color="currentColor" />
            </span>
          </div>
        </div>

        {loading ? (
          <div className="top-stores-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: '360px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--bg-surface, #FAFAFA)', borderRadius: 'var(--radius-lg, 12px)', border: '1px solid var(--border-color, #E8E8E8)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No stores found matching &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className="top-stores-grid">
            {filteredStores.map(store => (
              <Link 
                key={store.id} 
                href={`/store/${store.slug}`}
                className="store-showcase-card"
              >
                <div className="store-showcase-cover">
                  <img 
                    src={store.cover_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'} 
                    alt="" 
                  />
                  <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    <span style={{ 
                      background: 'rgba(0, 0, 0, 0.65)', 
                      backdropFilter: 'blur(6px)', 
                      color: '#FFD700', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '3px 9px', 
                      borderRadius: '9999px',
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
                        padding: '3px 10px', 
                        borderRadius: '9999px'
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
                        padding: '3px 9px', 
                        borderRadius: '9999px'
                      }}>
                        OFFICIAL
                      </span>
                    )}
                  </div>
                </div>

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

                  {Array.isArray(store.preview_products) && store.preview_products.length > 0 && (
                    <div className="store-showcase-products">
                      <div className="store-showcase-products-label">Featured Drops</div>
                      <div className="store-showcase-thumbnails">
                        {store.preview_products.slice(0, 3).map(prod => (
                          <div key={prod.id} className="store-thumbnail-item" title={prod.name}>
                            <img src={prod.image_url} alt={prod.name} loading="lazy" />
                            {prod.price && (
                              <span className="store-thumbnail-price">${prod.price}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
    </div>
  );
}

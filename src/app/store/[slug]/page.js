'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { StoreIcon, StarIcon, SearchIcon, BadgeCheckIcon, TagIcon, ZapIcon, CheckIcon, ClockIcon } from '@/components/Icons';

export default function StoreFrontPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [storeData, setStoreData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        const res = await fetch(`/api/stores/${slug}`);
        if (!res.ok) {
          throw new Error('Store not found');
        }
        const data = await res.json();
        setStoreData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [slug]);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg, 12px)', marginBottom: '24px' }} />
        <div className="product-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-md, 8px)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
          <StoreIcon size={48} color="currentColor" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>Store Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The store you are looking for does not exist or is currently unavailable.
        </p>
        <Link 
          href="/stores" 
          style={{ 
            display: 'inline-block', 
            padding: '10px 24px', 
            background: 'var(--color-primary, #222222)', 
            color: '#fff', 
            borderRadius: 'var(--radius-md, 8px)', 
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Browse All Stores
        </Link>
      </div>
    );
  }

  const { store, products = [], categories = [], coupons = [], activeSale = null } = storeData;

  // Filter products by selected category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_slug === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="store-page" style={{ paddingBottom: '60px', background: 'var(--bg-primary)' }}>
      {/* Store Hero Banner */}
      <div style={{ position: 'relative', background: 'var(--bg-secondary, #F5F5F5)', borderBottom: '1px solid var(--border-color, #E8E8E8)' }}>
        <div style={{ height: '220px', width: '100%', position: 'relative', overflow: 'hidden' }}>
          <img 
            src={store.banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=500&fit=crop'} 
            alt={store.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)' }} />
        </div>

        <div className="container" style={{ position: 'relative', marginTop: '-50px', paddingBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px' }}>
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '6px', 
                border: '4px solid var(--bg-primary, #FFFFFF)', 
                overflow: 'hidden', 
                background: '#FFFFFF', 
                boxShadow: 'var(--shadow-md)', 
                flexShrink: 0 
              }}>
                <img 
                  src={store.logo_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop'} 
                  alt={store.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {store.name}
                  </h1>
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    color: '#93c5fd', 
                    backdropFilter: 'blur(4px)', 
                    border: '1px solid rgba(59, 130, 246, 0.4)', 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-full, 9999px)', 
                    fontSize: '11px', 
                    fontWeight: 700 
                  }}>
                    <BadgeCheckIcon size={12} color="#93c5fd" /> Verified Store
                  </span>
                  {store.is_featured && (
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(255, 215, 0, 0.2)', 
                      color: '#FFD700', 
                      backdropFilter: 'blur(4px)', 
                      border: '1px solid rgba(255, 215, 0, 0.4)', 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-full, 9999px)', 
                      fontSize: '11px', 
                      fontWeight: 700 
                    }}>
                      <StarIcon size={11} color="#FFD700" filled={true} /> Featured Brand
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', maxWidth: '600px', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                  {store.tagline || store.description}
                </p>
              </div>
            </div>

            {/* Store Stats */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-card, #FFFFFF)', border: '1px solid var(--border-color, #E8E8E8)', borderRadius: 'var(--radius-lg, 12px)', padding: '10px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ textAlign: 'center', paddingRight: '12px', borderRight: '1px solid var(--border-color, #E8E8E8)' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <StarIcon size={14} color="#F59E0B" filled={true} /> {parseFloat(store.rating || 5.0).toFixed(1)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Store Rating</div>
              </div>
              <div style={{ textAlign: 'center', paddingRight: '12px', borderRight: '1px solid var(--border-color, #E8E8E8)' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{products.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Products</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981' }}>100%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fulfillment</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '24px' }}>
        {/* Active Store Promotion / Flash Sale Banner */}
        {activeSale && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '18px 24px', 
            borderRadius: '12px', 
            background: activeSale.banner_bg || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '10px', 
                background: 'rgba(239, 68, 68, 0.2)', 
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ZapIcon size={22} color="#f87171" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: '#ef4444', 
                    color: '#fff', 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {activeSale.badge_text || 'Store Promotion'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                    {activeSale.title}
                  </h3>
                  {activeSale.discount_percent && (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fef08a' }}>
                      Up to {activeSale.discount_percent}% OFF
                    </span>
                  )}
                </div>
                {activeSale.subtitle && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    {activeSale.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#f8fafc', background: 'rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '6px' }}>
              <ClockIcon size={14} color="#94a3b8" />
              <span>Limited Time Store Event</span>
            </div>
          </div>
        )}

        {/* Exclusive Store Coupons Section */}
        {coupons && coupons.length > 0 && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px 20px', 
            borderRadius: '12px', 
            background: 'var(--bg-card, #ffffff)', 
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <TagIcon size={16} color="#4f46e5" />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4f46e5' }}>
                Store Coupons & Discounts
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>— Apply at checkout for {store.name} products</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {coupons.map((c) => (
                <div 
                  key={c.id} 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '8px 14px', 
                    borderRadius: '8px', 
                    border: '1px dashed #6366f1', 
                    background: '#f5f3ff' 
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#4338ca', letterSpacing: '0.05em' }}>
                        {c.code}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                        {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {parseFloat(c.min_order_amount) > 0 ? `Min. order $${parseFloat(c.min_order_amount).toFixed(0)}` : 'No minimum spend'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCoupon(c.code)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: copiedCode === c.code ? '#16a34a' : '#4f46e5',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {copiedCode === c.code ? (
                      <>
                        <CheckIcon size={12} color="#ffffff" />
                        Copied
                      </>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full, 9999px)',
                border: selectedCategory === 'all' ? '1px solid var(--color-primary, #222222)' : '1px solid var(--border-color, #E8E8E8)',
                background: selectedCategory === 'all' ? 'var(--color-primary, #222222)' : 'var(--bg-card, #FFFFFF)',
                color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full, 9999px)',
                  border: selectedCategory === cat.slug ? '1px solid var(--color-primary, #222222)' : '1px solid var(--border-color, #E8E8E8)',
                  background: selectedCategory === cat.slug ? 'var(--color-primary, #222222)' : 'var(--bg-card, #FFFFFF)',
                  color: selectedCategory === cat.slug ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search within store */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder={`Search ${store.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px 8px 34px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color, #E8E8E8)',
                background: 'var(--bg-card, #FFFFFF)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              <SearchIcon size={14} color="currentColor" />
            </span>
          </div>
        </div>

        {/* Product Catalog */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--bg-surface, #FAFAFA)', borderRadius: 'var(--radius-lg, 12px)', border: '1px solid var(--border-color, #E8E8E8)' }}>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>No products found in this store matching your criteria.</p>
            <button 
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              style={{ marginTop: '10px', padding: '6px 16px', borderRadius: 'var(--radius-sm, 4px)', background: 'var(--color-primary, #222222)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


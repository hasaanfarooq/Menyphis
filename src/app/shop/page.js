'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { SearchIcon, XIcon } from '@/components/Icons';

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const storeParam = searchParams.get('store');
  const queryParam = searchParams.get('q');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ slug: 'all', name: 'All' }]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [activeStore, setActiveStore] = useState(storeParam || 'all');
  const [searchQuery, setSearchQuery] = useState(queryParam || '');
  const [activeSort, setActiveSort] = useState('newest');

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
  ];

  // Fetch dynamic categories and stores
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, storeRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/stores')
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData)) {
            setCategories([{ slug: 'all', name: 'All Categories' }, ...catData]);
          }
        }
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          if (Array.isArray(storeData)) {
            setStores(storeData);
          }
        }
      } catch (e) {
        console.error('Failed to load shop filters:', e);
      }
    }
    loadMeta();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/products?sort=${activeSort}`;
      if (activeCategory !== 'all') url += `&category=${encodeURIComponent(activeCategory)}`;
      if (activeStore !== 'all') url += `&store=${encodeURIComponent(activeStore)}`;
      if (searchQuery.trim()) url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeStore, activeSort, searchQuery]);

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    if (storeParam) setActiveStore(storeParam);
  }, [storeParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-header">
          <div>
            <h1 className="shop-title">
              {activeCategory === 'all' 
                ? (activeStore !== 'all' ? `${stores.find(s => s.slug === activeStore || String(s.id) === activeStore)?.name || 'Store'} Collection` : 'Explore Streetwear')
                : (categories.find(c => c.slug === activeCategory)?.name || 'Shop')}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', marginTop: '12px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', pointerEvents: 'none' }}>
              <SearchIcon size={16} color="var(--text-muted)" />
            </div>
            <input 
              type="text" 
              placeholder="Search products or styles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 36px 10px 36px',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  color: 'var(--text-muted)'
                }}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter controls */}
        <div className="shop-filters" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className={`filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Store Brand selector */}
            {stores.length > 0 && (
              <select
                value={activeStore}
                onChange={(e) => setActiveStore(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                <option value="all">All Brands / Stores</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            )}

            {/* Sort selector */}
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <SearchIcon size={48} color="var(--border-color)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>No products found</h3>
            <p>Try searching for something else or clearing active brand and category filters.</p>
            {(activeCategory !== 'all' || activeStore !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveStore('all');
                  setSearchQuery('');
                }}
                style={{
                  marginTop: '16px',
                  padding: '8px 20px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="shop-page">
        <div className="container">
          <div className="skeleton" style={{ height: '36px', width: '200px', marginBottom: '16px', marginTop: '24px' }} />
          <div className="product-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '3/4', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '6px' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}

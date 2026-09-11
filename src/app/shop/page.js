'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { SearchIcon } from '@/components/Icons';

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(categoryParam || 'all');
  const [activeSort, setActiveSort] = useState('newest');

  const categories = [
    { slug: 'all', name: 'All' },
    { slug: 'shirts', name: 'Shirts' },
    { slug: 'hoodies', name: 'Hoodies' },
    { slug: 'limited-edition', name: 'Limited Edition' },
    { slug: 'new-arrivals', name: 'New Arrivals' },
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/products?sort=${activeSort}`;
      if (activeCategory !== 'all') url += `&category=${activeCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSort]);

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="shop-page">
      <div className="container">
        <div className="shop-header">
          <h1 className="shop-title">
            {activeCategory === 'all' ? 'Shop All' : categories.find(c => c.slug === activeCategory)?.name || 'Shop'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="shop-filters">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              className={`filter-btn ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              borderRadius: '9999px',
              background: 'white',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
            <p>Try a different category or check back later.</p>
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

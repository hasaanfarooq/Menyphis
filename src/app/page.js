'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import ProductCard from '@/components/ProductCard';
import FlashSaleSection from '@/components/FlashSaleSection';
import AnnouncementBar from '@/components/AnnouncementBar';
import PopupBanner from '@/components/PopupBanner';
import TopStoresSection from '@/components/TopStoresSection';
import { useCurrency } from '@/context/CurrencyContext';
import { useFlashSale } from '@/context/FlashSaleContext';
import { ZapIcon } from '@/components/Icons';

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const catRowRef = useRef(null);
  const { formatPrice } = useCurrency();
  const { sale: flashSale } = useFlashSale();

  // Real countdown timer calculation based on flash sale ends_at
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
  useEffect(() => {
    if (!flashSale || !flashSale.ends_at) return;
    const calculate = () => {
      const diff = new Date(flashSale.ends_at) - new Date();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { hours, minutes, seconds, expired: false };
    };
    setFlashTimeLeft(calculate());
    const interval = setInterval(() => {
      setFlashTimeLeft(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  const timerExpired = flashTimeLeft.expired;

  useEffect(() => {
    async function load() {
      try {
        let [prodRes, featRes, catRes] = await Promise.all([
          fetch('/api/products?limit=50'),
          fetch('/api/products?featured=true&limit=20'),
          fetch('/api/categories')
        ]);
        
        let data = await prodRes.json();
        let featData = await featRes.json();
        let catData = await catRes.json();

        if (Array.isArray(data) && data.length === 0 && !seeded) {
          setSeeded(true);
          await fetch('/api/seed');
          prodRes = await fetch('/api/products?limit=50');
          featRes = await fetch('/api/products?featured=true&limit=20');
          catRes = await fetch('/api/categories');
          data = await prodRes.json();
          featData = await featRes.json();
          catData = await catRes.json();
        }

        if (Array.isArray(data)) {
          setAllProducts(data);
        }
        if (Array.isArray(featData)) {
          setFeaturedProducts(featData);
        } else if (Array.isArray(data)) {
          setFeaturedProducts(data.filter(p => p.featured));
        }
        
        if (Array.isArray(catData)) {
          setCategories(catData);
        }
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [seeded]);

  const scrollCategories = (dir) => {
    if (catRowRef.current) {
      catRowRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  return (
    <>
      <AnnouncementBar />
      <PopupBanner />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Deals Bar */}
      <div className="deals-bar">
        <div className="deals-bar-inner">
          <div className="deal-item">
            <span className="deal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </span>
            <span><strong>Free Shipping</strong> on {formatPrice(99)}+</span>
          </div>
          <div className="deal-item">
            <span className="deal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </span>
            <span><strong>30 Day</strong> Free Returns</span>
          </div>
          <div className="deal-item">
            <span className="deal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <span><strong>Secure</strong> Payment</span>
          </div>
          <div className="deal-item">
            <span className="deal-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </span>
            <span><strong>Premium</strong> Quality</span>
          </div>
        </div>
      </div>

      {/* Top Stores Showcase (Multi-Tenant Marketplace) */}
      <TopStoresSection />

      {/* Category Circles */}
      <section className="categories-section">
        <div className="container">
          <div className="categories-row-wrapper">
            <button className="categories-nav-btn left" onClick={() => scrollCategories(-1)} aria-label="Scroll left">
              ‹
            </button>
            <div className="categories-row" ref={catRowRef}>
              {categories.map((cat, i) => (
                <Link key={i} href={`/shop?category=${cat.slug}`} className="category-circle">
                  <div className="category-circle-img">
                    <img 
                      src={cat.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&h=150&fit=crop'} 
                      alt={cat.name} 
                      loading="lazy" 
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=200&h=200&fit=crop'; }}
                    />
                  </div>
                  <span className="category-circle-name">{cat.name}</span>
                </Link>
              ))}
            </div>
            <button className="categories-nav-btn right" onClick={() => scrollCategories(1)} aria-label="Scroll right">
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Dynamic Flash Sale Section */}
      <FlashSaleSection />

      {/* Flash Sale Bar — dynamically bound to active sale countdown */}
      {flashSale && !timerExpired && (
        <div className="flash-sale">
          <div className="flash-sale-inner">
            <div className="flash-sale-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ZapIcon size={16} color="#FFD700" /> {flashSale.title ? flashSale.title.toUpperCase() : 'FLASH SALE'}
            </div>
            <div className="flash-sale-timer">
              <span className="flash-timer-unit">{String(flashTimeLeft.hours).padStart(2, '0')}</span>
              <span className="flash-timer-sep">:</span>
              <span className="flash-timer-unit">{String(flashTimeLeft.minutes).padStart(2, '0')}</span>
              <span className="flash-timer-sep">:</span>
              <span className="flash-timer-unit">{String(flashTimeLeft.seconds).padStart(2, '0')}</span>
            </div>
            <Link href="/shop" style={{ color: '#FFD700', fontSize: '13px', fontWeight: 600 }}>
              Shop Deals →
            </Link>
          </div>
        </div>
      )}

      {/* Featured Products */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link href="/shop" className="section-more">
              View All →
            </Link>
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
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All Products */}
      <section className="products-section" style={{ background: 'var(--bg-secondary)', padding: '32px 0 48px' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">All Products</h2>
            <Link href="/shop" className="section-more">
              View All →
            </Link>
          </div>

          {!loading && (
            <div className="product-grid">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Side tab */}
      <div className="side-tab">GET 20% OFF</div>
    </>
  );
}

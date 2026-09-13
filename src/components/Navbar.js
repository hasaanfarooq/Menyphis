'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [spacerHeight, setSpacerHeight] = useState(136);

  const headerRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const { toggleCart, totalItems } = useCart();
  const { user, logout } = useAuth();
  const { currency, changeCurrency, formatPrice } = useCurrency();
  const { items: wishlistItems } = useWishlist();

  // Measure initial header height for seamless content spacing
  useEffect(() => {
    if (headerRef.current) {
      setSpacerHeight(headerRef.current.offsetHeight);
    }
    const handleResize = () => {
      if (headerRef.current && window.scrollY < 10) {
        setSpacerHeight(headerRef.current.offsetHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll listener for sticky compacting and reading progress bar
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const top = window.scrollY;
          setScrolled(top > 20);

          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            setScrollProgress(Math.min(100, Math.max(0, (top / totalHeight) * 100)));
          } else {
            setScrollProgress(0);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const DEFAULT_CATEGORIES = [
    { name: 'Stores', href: '/stores', sale: false, isStore: true },
    { name: 'New In', href: '/shop?category=new-arrivals', sale: false },
    { name: 'Sale', href: '/shop?category=limited-edition', sale: true },
    { name: 'Shirts', href: '/shop?category=shirts', sale: false },
    { name: 'Hoodies', href: '/shop?category=hoodies', sale: false },
    { name: 'Limited Edition', href: '/shop?category=limited-edition', sale: false },
    { name: 'Streetwear', href: '/shop', sale: false },
    { name: 'Trending', href: '/shop?sort=popular', sale: false },
  ];

  const [navCategories, setNavCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    let active = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && active) {
            const dynamicList = data.map((c) => ({
              name: c.name,
              href: `/shop?category=${encodeURIComponent(c.slug)}`,
              sale: (c.slug || '').toLowerCase().includes('sale'),
            }));
            setNavCategories([
              { name: 'Stores', href: '/stores', sale: false, isStore: true },
              { name: 'New In', href: '/shop?category=new-arrivals', sale: false },
              { name: 'Sale', href: '/shop?category=limited-edition', sale: true },
              ...dynamicList,
            ]);
          }
        }
      } catch {
        // Fallback remains active
      }
    }
    fetchCategories();
    return () => { active = false; };
  }, []);

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      {/* Spacer maintains natural document flow so page content starts cleanly below */}
      <div 
        className="navbar-spacer" 
        style={{ 
          height: `${spacerHeight}px`, 
          width: '100%', 
          pointerEvents: 'none',
          flexShrink: 0
        }} 
        aria-hidden="true" 
      />

      <header ref={headerRef} className={`navbar-header-fixed ${scrolled ? 'is-scrolled' : ''}`}>
        {/* Top announcement bar (smoothly collapses when scrolling) */}
        <div className="top-bar">
          <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
            </svg>
          </span>
          FREE SHIPPING on orders over {formatPrice(99)} — Use code <Link href="/shop" style={{ color: '#FFD700', fontWeight: 700 }}>MENYPHIS20</Link> for 20% OFF
        </div>

        <nav className="navbar">
          {/* Main row: Logo | Search | Actions */}
          <div className="navbar-main">
            <button
              className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>

            <Link href="/" className="navbar-logo">
              Menyphis
            </Link>

            <form onSubmit={handleSearch} className="navbar-search">
              <input 
                type="text" 
                placeholder="Search styles, brands, streetwear..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="navbar-search-btn" aria-label="Search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>

            <div className="navbar-actions">
              <div className="navbar-user-menu" style={{ marginRight: '4px' }}>
                <button className="navbar-action-btn" title="Currency" style={{ padding: '6px 8px', fontSize: '13px', fontWeight: 700 }}>
                  {currency}
                </button>
                <div className="navbar-dropdown" style={{ minWidth: '110px' }}>
                  <button onClick={() => changeCurrency('USD')} className={`dropdown-item ${currency === 'USD' ? 'active' : ''}`}>USD ($)</button>
                  <button onClick={() => changeCurrency('PKR')} className={`dropdown-item ${currency === 'PKR' ? 'active' : ''}`}>PKR (Rs)</button>
                </div>
              </div>

              {user ? (
                <div className="navbar-user-menu">
                  <Link href="/account" className="navbar-action-btn" title="Account">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>{user.name ? user.name.split(' ')[0] : 'Account'}</span>
                  </Link>
                  <div className="navbar-dropdown">
                    <div className="dropdown-item user-info">{user.email}</div>
                    <Link href="/account" className="dropdown-item" style={{ textDecoration: 'none' }}>
                      My Account
                    </Link>
                    <Link href="/orders" className="dropdown-item" style={{ textDecoration: 'none' }}>
                      My Orders
                    </Link>
                    <Link href="/wishlist" className="dropdown-item" style={{ textDecoration: 'none' }}>
                      My Wishlist
                    </Link>
                    {user.store_name ? (
                      <Link href="/admin" className="dropdown-item admin-badge" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        Store Portal ({user.store_name})
                      </Link>
                    ) : (user.is_admin || user.role === 'super_admin') ? (
                      <Link href="/admin" className="dropdown-item admin-badge" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        Super Admin
                      </Link>
                    ) : null}
                    <button onClick={logout} className="dropdown-item text-danger">Logout</button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="navbar-action-btn" title="Account">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Account</span>
                </Link>
              )}

              <Link href="/wishlist" className="navbar-action-btn hide-mobile" title="Wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>Wishlist</span>
                {wishlistItems && wishlistItems.length > 0 && (
                  <span className="navbar-action-badge">{wishlistItems.length}</span>
                )}
              </Link>

              <Link href="/track" className="navbar-action-btn hide-mobile" title="Track Order">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
                  <path d="M16 8h4l3 3v5h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <span>Track</span>
              </Link>

              <button className="navbar-action-btn" onClick={toggleCart} title="Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="navbar-action-badge" key={totalItems}>{totalItems}</span>
                )}
              </button>
            </div>
          </div>

          {/* Category row */}
          {!isAdminRoute && (
            <div className="navbar-categories">
              <div className="navbar-categories-inner">
                {navCategories.map((cat, i) => (
                  <Link
                    key={i}
                    href={cat.href}
                    className={`navbar-cat-link ${cat.sale ? 'sale' : ''}`}
                    style={cat.isStore ? { display: 'inline-flex', alignItems: 'center', gap: '5px' } : undefined}
                  >
                    {cat.isStore && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    )}
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reading scroll progress line */}
          <div 
            className="navbar-scroll-progress" 
            style={{ 
              transform: `scaleX(${scrollProgress / 100})`,
              opacity: scrolled ? 1 : 0 
            }} 
          />
        </nav>
      </header>

      {/* Mobile nav drawer */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav-panel ${mobileOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '20px', fontWeight: 800, fontSize: '20px', textTransform: 'uppercase' }}>Menyphis</div>
        
        {/* Mobile Search */}
        <form onSubmit={handleSearch} style={{ marginBottom: '16px', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </form>

        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href="/stores" onClick={() => setMobileOpen(false)} style={{ color: '#4f46e5', fontWeight: 600 }}>Brand Stores</Link>
        <Link href="/shop" onClick={() => setMobileOpen(false)}>Shop All</Link>
        <Link href="/wishlist" onClick={() => setMobileOpen(false)}>Wishlist {wishlistItems?.length ? `(${wishlistItems.length})` : ''}</Link>
        <Link href="/track" onClick={() => setMobileOpen(false)}>Track Order</Link>
        <div style={{ height: '1px', background: '#eee', margin: '8px 0' }} />
        {navCategories.filter(c => !c.isStore).slice(0, 8).map((cat, idx) => (
          <Link 
            key={idx} 
            href={cat.href} 
            onClick={() => setMobileOpen(false)}
            style={cat.sale ? { color: 'var(--color-sale, #ef4444)', fontWeight: 600 } : undefined}
          >
            {cat.name}
          </Link>
        ))}
        {user ? (
          <>
            <div style={{ padding: '15px 20px', color: '#666', borderTop: '1px solid #eee' }}>Hi, {user.name}</div>
            <Link href="/account" onClick={() => setMobileOpen(false)}>My Account</Link>
            <Link href="/orders" onClick={() => setMobileOpen(false)}>My Orders</Link>
            {user.store_name ? (
              <Link href="/admin" onClick={() => setMobileOpen(false)} style={{ color: '#4f46e5', fontWeight: 600 }}>
                Store Portal ({user.store_name})
              </Link>
            ) : (user.is_admin || user.role === 'super_admin') ? (
              <Link href="/admin" onClick={() => setMobileOpen(false)} style={{ color: '#4f46e5', fontWeight: 600 }}>
                Super Admin Dashboard
              </Link>
            ) : null}
            <button onClick={() => { logout(); setMobileOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', padding: '15px 20px', fontSize: '18px', fontWeight: '500', color: 'red', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Account / Login</Link>
          </>
        )}
      </div>
    </>
  );
}

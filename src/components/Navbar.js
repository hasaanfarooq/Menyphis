'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toggleCart, totalItems } = useCart();
  const { user, logout } = useAuth();
  const { currency, changeCurrency, formatPrice } = useCurrency();
  const { items: wishlistItems } = useWishlist();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const categories = [
    { name: 'New In', href: '/shop?category=new-arrivals', sale: false },
    { name: 'Sale', href: '/shop?category=limited-edition', sale: true },
    { name: 'Shirts', href: '/shop?category=shirts', sale: false },
    { name: 'Hoodies', href: '/shop?category=hoodies', sale: false },
    { name: 'Limited Edition', href: '/shop?category=limited-edition', sale: false },
    { name: 'Streetwear', href: '/shop', sale: false },
    { name: 'Trending', href: '/shop?sort=popular', sale: false },
    { name: 'New Arrivals', href: '/shop?category=new-arrivals', sale: false },
    { name: 'Graphic Tees', href: '/shop?category=shirts', sale: false },
    { name: 'Oversized', href: '/shop?category=hoodies', sale: false },
    { name: 'Premium', href: '/shop', sale: false },
    { name: 'Best Sellers', href: '/shop?sort=popular', sale: false },
  ];

  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      {/* Top announcement bar */}
      <div className="top-bar">
        <span style={{ marginRight: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
        </span>
        FREE SHIPPING on orders over {formatPrice(99)} — Use code <a href="#">MENYPHIS20</a> for 20% OFF
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

          <div className="navbar-search">
            <input type="text" placeholder="Search Menyphis" />
            <button className="navbar-search-btn" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>

          <div className="navbar-actions">
            <div className="navbar-user-menu" style={{ marginRight: '8px' }}>
              <button className="navbar-action-btn" title="Currency" style={{ padding: '0 8px', fontSize: '14px', fontWeight: 600 }}>
                {currency}
              </button>
              <div className="navbar-dropdown" style={{ minWidth: '100px' }}>
                <button onClick={() => changeCurrency('USD')} className={`dropdown-item ${currency === 'USD' ? 'active' : ''}`}>USD ($)</button>
                <button onClick={() => changeCurrency('PKR')} className={`dropdown-item ${currency === 'PKR' ? 'active' : ''}`}>PKR (Rs)</button>
              </div>
            </div>

            {user ? (
              <div className="navbar-user-menu">
                <button className="navbar-action-btn" title="Account">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                <div className="navbar-dropdown">
                  <div className="dropdown-item user-info">{user.email}</div>
                  {user.is_admin && <Link href="/admin" className="dropdown-item admin-badge" style={{ textDecoration: 'none' }}>Admin Dashboard</Link>}
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

            <Link href="/wishlist" className="navbar-action-btn" title="Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>Wishlist</span>
              {wishlistItems && wishlistItems.length > 0 && (
                <span className="navbar-action-badge">{wishlistItems.length}</span>
              )}
            </Link>

            <Link href="/track" className="navbar-action-btn" title="Track Order">
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
              {categories.map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  className={`navbar-cat-link ${cat.sale ? 'sale' : ''}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile nav */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`mobile-nav-panel ${mobileOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '20px', fontWeight: 800, fontSize: '20px', textTransform: 'uppercase' }}>Menyphis</div>
        <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href="/shop" onClick={() => setMobileOpen(false)}>Shop All</Link>
        <Link href="/track" onClick={() => setMobileOpen(false)}>Track Order</Link>
        <Link href="/shop?category=shirts" onClick={() => setMobileOpen(false)}>Shirts</Link>
        <Link href="/shop?category=hoodies" onClick={() => setMobileOpen(false)}>Hoodies</Link>
        <Link href="/shop?category=limited-edition" onClick={() => setMobileOpen(false)}>Limited Edition</Link>
        <Link href="/shop?category=new-arrivals" onClick={() => setMobileOpen(false)}>New Arrivals</Link>
        {user ? (
          <>
            <div style={{ padding: '15px 20px', color: '#666', borderTop: '1px solid #eee' }}>Hi, {user.name}</div>
            <button onClick={() => { logout(); setMobileOpen(false); }} style={{ textAlign: 'left', background: 'none', border: 'none', padding: '15px 20px', fontSize: '18px', fontWeight: '500', color: 'red', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Account</Link>
        )}
      </div>
    </>
  );
}

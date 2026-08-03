'use client';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const { items, loading } = useWishlist();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="section-padding container">
        <div className="section-header-center">
          <h1 className="section-title">My Wishlist</h1>
        </div>
        <div className="product-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding container" style={{ minHeight: '60vh' }}>
      <div className="section-header-center">
        <h1 className="section-title">My Wishlist</h1>
        {!user && items.length > 0 && (
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            <Link href="/auth/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}>Log in</Link> to save your wishlist across devices.
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: '48px', color: 'var(--border-color)', marginBottom: '16px' }}>♡</div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Tap the heart icon on any product to save it for later.
          </p>
          <Link href="/shop" className="btn-primary-dark" style={{ display: 'inline-block', width: 'auto', padding: '12px 32px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

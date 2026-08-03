'use client';
import { useState, useEffect, use } from 'react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFlashSale } from '@/context/FlashSaleContext';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';

const colorMap = {
  'Black': '#1a1a1a', 'Charcoal': '#36454F', 'Navy': '#1B2A4A',
  'Purple': '#7C3AED', 'Dark Green': '#1B4332', 'White': '#F5F5F5',
  'Pink': '#EC4899', 'Midnight Blue': '#191970', 'Grey': '#6B7280',
  'Dark Red': '#8B0000', 'Red': '#DC2626', 'Aurora Green': '#00D084',
  'Deep Purple': '#6B21A8', 'Phantom Black': '#0D0D0D', 'Ghost White': '#F8F8FF',
  'Slate': '#475569', 'Multi': 'linear-gradient(135deg, #A855F7, #EC4899, #06B6D4)',
  'Black Base': '#111111', 'White Base': '#EEEEEE',
  'Cloud White': '#F0F0F0', 'Sky Blue': '#87CEEB', 'Storm Grey': '#708090',
};

export default function ProductDetail({ params }) {
  const { slug } = use(params);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { getSaleInfo } = useFlashSale();

  const wishlisted = product ? isWishlisted(product.id) : false;
  const saleInfo = product && getSaleInfo ? getSaleInfo(product.id, parseFloat(product.price)) : null;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
          setRelated(data.related || []);
          setSelectedSize(data.product.sizes?.[1] || data.product.sizes?.[0] || '');
          setSelectedColor(data.product.colors?.[0] || '');
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product || !selectedSize || !selectedColor) return;
    const cartPrice = saleInfo ? saleInfo.salePrice : parseFloat(product.price);
    addItem({
      id: product.id,
      name: product.name,
      price: cartPrice,
      image_url: product.image_url,
      slug: product.slug,
    }, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="product-detail-grid">
            <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: '8px' }} />
            <div style={{ padding: '8px 0' }}>
              <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '28px', width: '70%', marginBottom: '14px' }} />
              <div className="skeleton" style={{ height: '24px', width: '120px', marginBottom: '20px' }} />
              <div className="skeleton" style={{ height: '60px', width: '100%', marginBottom: '24px' }} />
              <div className="skeleton" style={{ height: '48px', width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Product Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>This product doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0;

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-detail-grid">
          <div className="product-gallery">
            <div className="product-gallery-main">
              <img src={product.image_url} alt={product.name} />
            </div>
          </div>

          <div className="product-detail-info">
            <div className="product-detail-category">{product.category_name || 'Streetwear'}</div>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-detail-price-row">
              {saleInfo ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>
                      ⚡ {saleInfo.badgeText} -{saleInfo.discount}% OFF
                    </span>
                  </div>
                  <span className="product-detail-price" style={{ color: '#ef4444' }}>{formatPrice(saleInfo.salePrice)}</span>
                  <span className="product-detail-compare">{formatPrice(product.price)}</span>
                  <span className="product-detail-discount">Save {formatPrice(parseFloat(product.price) - saleInfo.salePrice)}</span>
                </>
              ) : (
                <>
                  <span className="product-detail-price">{formatPrice(product.price)}</span>
                  {product.compare_price && (
                    <>
                      <span className="product-detail-compare">{formatPrice(product.compare_price)}</span>
                      <span className="product-detail-discount">-{Math.round((1 - product.price / product.compare_price) * 100)}%</span>
                    </>
                  )}
                </>
              )}
            </div>

            {product.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px' }}>
                <span style={{ color: '#FFB800' }}>{'★'.repeat(Math.round(parseFloat(product.rating)))}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {parseFloat(product.rating).toFixed(1)} ({product.review_count} reviews)
                </span>
                <span style={{ color: 'var(--text-muted)' }}>| {product.review_count * 3}+ sold</span>
              </div>
            )}

            <p className="product-detail-description">{product.description}</p>

            {product.colors && product.colors.length > 0 && (
              <div className="product-option-group">
                <div className="product-option-label">Color: {selectedColor}</div>
                <div className="product-colors">
                  {product.colors.map((color) => (
                    <button key={color} className={`color-btn ${selectedColor === color ? 'active' : ''}`} style={{ background: colorMap[color] || color }} onClick={() => setSelectedColor(color)} title={color} />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="product-option-group">
                <div className="product-option-label">Size: {selectedSize}</div>
                <div className="product-sizes">
                  {product.sizes.map((size) => (
                    <button key={size} className={`size-btn ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="product-add-section">
              <button className="product-add-btn" onClick={handleAddToCart}>
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button 
                className="product-wishlist-btn" 
                onClick={() => toggleWishlist(product)}
                style={wishlisted ? { color: 'var(--color-sale)', borderColor: 'var(--color-sale)' } : {}}
              >
                {wishlisted ? '♥' : '♡'}
              </button>
            </div>

            <div className="product-features">
              <div className="product-feature">
                <span className="product-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                </span>
                <span className="product-feature-text">Free shipping over {formatPrice(99)}</span>
              </div>
              <div className="product-feature">
                <span className="product-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                </span>
                <span className="product-feature-text">30-day free returns</span>
              </div>
              <div className="product-feature">
                <span className="product-feature-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                </span>
                <span className="product-feature-text">100% premium cotton</span>
              </div>
              <div className="product-feature">
                <span className="product-feature-icon">✨</span>
                <span className="product-feature-text">Exclusive design</span>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section-padding">
            <div className="section-header">
              <h2 className="section-title">You May Also Like</h2>
            </div>
            <div className="product-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Customer Reviews */}
        {product && <ProductReviews productId={product.id} />}
      </div>

      {added && (
        <div className="toast toast-success">
          <span className="toast-icon">✓</span>
          Added to cart!
        </div>
      )}
    </div>
  );
}

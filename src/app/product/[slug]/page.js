'use client';
import { useState, useEffect, use } from 'react';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFlashSale } from '@/context/FlashSaleContext';
import ProductCard from '@/components/ProductCard';
import ProductReviews from '@/components/ProductReviews';
import { ZapIcon, StarIcon, HeartIcon, SparklesIcon, CheckIcon } from '@/components/Icons';

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
  const [activeImage, setActiveImage] = useState('');
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
          const p = data.product;
          setProduct(p);
          setRelated(data.related || []);
          setSelectedSize(p.sizes?.[1] || p.sizes?.[0] || '');
          const initialColor = p.colors?.[0] || '';
          setSelectedColor(initialColor);
          const initialImg = (p.color_images && p.color_images[initialColor]) || p.image_url;
          setActiveImage(initialImg);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    if (product?.color_images && product.color_images[color]) {
      setActiveImage(product.color_images[color]);
    }
  };

  const isOutOfStock = product?.stock !== undefined && product?.stock !== null && parseInt(product.stock) <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock || !product || !selectedSize || !selectedColor) return;
    const cartPrice = saleInfo ? saleInfo.salePrice : parseFloat(product.price);
    const cartImage = (product.color_images && product.color_images[selectedColor]) || activeImage || product.image_url;
    addItem({
      id: product.id,
      name: product.name,
      price: cartPrice,
      image_url: cartImage,
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
              <img src={activeImage || product.image_url} alt={product.name} />
            </div>
            {/* Color Variant Thumbnails */}
            {product.colors && product.colors.length > 0 && product.color_images && Object.keys(product.color_images).length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {product.colors.map(color => {
                  const img = product.color_images[color];
                  if (!img) return null;
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                        overflow: 'hidden',
                        padding: 0,
                        background: '#f8fafc',
                        cursor: 'pointer',
                        opacity: isSelected ? 1 : 0.65,
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                      title={`View ${color}`}
                    >
                      <img src={img} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <div className="product-detail-category">{product.category_name || 'Streetwear'}</div>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-detail-price-row">
              {saleInfo ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: 'white', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ZapIcon size={12} color="white" /> {saleInfo.badgeText} -{saleInfo.discount}% OFF
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
              {isOutOfStock ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ● Sold Out
                </span>
              ) : (
                product.stock !== undefined && product.stock !== null && product.stock <= 5 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                    Low Stock: Only {product.stock} left!
                  </span>
                )
              )}
            </div>

            {product.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  {[...Array(Math.min(5, Math.max(1, Math.round(parseFloat(product.rating)))))].map((_, idx) => (
                    <StarIcon key={idx} size={14} />
                  ))}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {parseFloat(product.rating).toFixed(1)} ({product.review_count} reviews)
                </span>
                {parseInt(product.total_sold || 0) > 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>| {product.total_sold} sold</span>
                )}
              </div>
            )}

            <p className="product-detail-description">{product.description}</p>

            {product.colors && product.colors.length > 0 && (
              <div className="product-option-group">
                <div className="product-option-label">Color: {selectedColor}</div>
                <div className="product-colors">
                  {product.colors.map((color) => (
                    <button 
                      key={color} 
                      className={`color-btn ${selectedColor === color ? 'active' : ''}`} 
                      style={{ background: colorMap[color] || color }} 
                      onClick={() => handleColorSelect(color)} 
                      title={color} 
                    />
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
              {isOutOfStock ? (
                <button 
                  className="product-add-btn" 
                  disabled 
                  style={{ 
                    background: '#f1f5f9', 
                    color: '#94a3b8', 
                    cursor: 'not-allowed', 
                    border: '1px solid #e2e8f0',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  Sold Out
                </button>
              ) : (
                <button className="product-add-btn" onClick={handleAddToCart} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {added ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <CheckIcon size={16} /> Added to Cart!
                    </span>
                  ) : 'Add to Cart'}
                </button>
              )}
              <button 
                className="product-wishlist-btn" 
                onClick={() => toggleWishlist(product)}
                style={wishlisted ? { color: 'var(--color-sale)', borderColor: 'var(--color-sale)' } : {}}
              >
                <HeartIcon size={18} filled={wishlisted} />
              </button>
            </div>

            {/* Dynamic Customizable Tags */}
            <div className="product-features">
              {(product.features && product.features.length > 0 ? product.features : [
                `Free shipping over ${formatPrice(99)}`,
                '30-day free returns',
                '100% premium cotton',
                'Exclusive design'
              ]).map((feat, idx) => {
                const lower = feat.toLowerCase();
                let icon = <SparklesIcon size={18} />;

                if (lower.includes('ship') || lower.includes('deliver')) {
                  icon = (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  );
                } else if (lower.includes('return') || lower.includes('refund')) {
                  icon = (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                      <path d="M3 3v5h5"></path>
                    </svg>
                  );
                } else if (lower.includes('cotton') || lower.includes('silk') || lower.includes('fabric') || lower.includes('material') || lower.includes('eco') || lower.includes('leather')) {
                  icon = (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                    </svg>
                  );
                } else if (lower.includes('warrant') || lower.includes('guarantee') || lower.includes('authentic') || lower.includes('shield')) {
                  icon = (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  );
                }

                return (
                  <div className="product-feature" key={idx}>
                    <span className="product-feature-icon">
                      {icon}
                    </span>
                    <span className="product-feature-text">{feat}</span>
                  </div>
                );
              })}
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
        <div className="toast toast-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="toast-icon"><CheckIcon size={14} /></span>
          Added to cart!
        </div>
      )}
    </div>
  );
}

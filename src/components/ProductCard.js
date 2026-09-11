'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { useFlashSale } from '@/context/FlashSaleContext';
import { ZapIcon, HeartIcon, StarIcon, CheckIcon, StoreIcon } from '@/components/Icons';

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

export default function ProductCard({ product }) {
  const cardRef = useRef(null);
  const [showToast, setShowToast] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { getSaleInfo } = useFlashSale();

  const wishlisted = isWishlisted(product.id);
  const saleInfo = getSaleInfo ? getSaleInfo(product.id, parseFloat(product.price)) : null;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultSize = product.sizes?.[1] || product.sizes?.[0] || 'M';
    const defaultColor = product.colors?.[0] || 'Black';
    const cartPrice = saleInfo ? saleInfo.salePrice : parseFloat(product.price);
    const cartImage = (product.color_images && product.color_images[defaultColor]) || product.image_url;
    addItem({
      id: product.id,
      name: product.name,
      price: cartPrice,
      image_url: cartImage,
      slug: product.slug,
    }, defaultSize, defaultColor);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0;
  
  // Flash sale overrides compare_price discount if applicable
  const displayPrice = saleInfo ? saleInfo.salePrice : parseFloat(product.price);
  const displayOriginal = saleInfo ? parseFloat(product.price) : (product.compare_price ? parseFloat(product.compare_price) : null);
  const displayDiscount = saleInfo ? saleInfo.discount : discount;
  const soldCount = parseInt(product.total_sold || 0);

  return (
    <>
      <Link href={`/product/${product.slug}`} className="product-card" ref={cardRef}>
        <div className="product-card-inner">
          <div className="product-card-image">
            <img src={previewImage || product.image_url} alt={product.name} loading="lazy" />
            
            {product.trending && !saleInfo && <span className="product-badge hot">HOT</span>}
            {saleInfo && (
              <span className="product-badge sale" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', animation: 'pulse 2s infinite', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ZapIcon size={12} color="#ffffff" /> -{saleInfo.discount}%
              </span>
            )}
            {!product.trending && !saleInfo && displayDiscount > 0 && <span className="product-badge sale">-{displayDiscount}%</span>}

            <button 
              className="product-card-wishlist" 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                toggleWishlist(product);
              }}
              style={wishlisted ? { color: 'var(--color-sale)', borderColor: 'var(--color-sale)' } : {}}
            >
              <HeartIcon size={16} filled={wishlisted} />
            </button>

            <div className="product-card-overlay">
              <button className="product-quick-add" onClick={handleQuickAdd}>
                + Add to Cart
              </button>
            </div>
          </div>

          <div className="product-card-info">
            <div className="product-card-name">{product.name}</div>
            {product.store_name && (
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/store/${product.store_slug}`;
                }}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '11px', 
                  color: 'var(--text-secondary, #a1a1aa)', 
                  margin: '1px 0 3px',
                  cursor: 'pointer'
                }}
                title={`Visit ${product.store_name}`}
              >
                <StoreIcon size={12} color="currentColor" />
                <span style={{ textDecoration: 'underline', textUnderlineOffset: '2px', fontWeight: 500 }}>{product.store_name}</span>
              </div>
            )}
            {saleInfo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '0.5px' }}>
                <ZapIcon size={12} color="#ef4444" /> {saleInfo.badgeText}
              </div>
            )}
            <div className="product-card-price">
              <span className="product-price-current" style={saleInfo ? { color: '#ef4444' } : {}}>{formatPrice(displayPrice)}</span>
              {displayOriginal && (
                <span className="product-price-compare">{formatPrice(displayOriginal)}</span>
              )}
              {displayDiscount > 0 && (
                <span className="product-price-discount">-{displayDiscount}%</span>
              )}
            </div>
            {product.colors && product.colors.length > 0 && (
              <div className="product-card-colors">
                {product.colors.slice(0, 5).map((color, i) => {
                  const hasColorImg = product.color_images && product.color_images[color];
                  return (
                    <span
                      key={i}
                      className="product-color-dot"
                      style={{ 
                        background: colorMap[color] || color,
                        transform: previewImage && previewImage === hasColorImg ? 'scale(1.25)' : undefined,
                        boxShadow: previewImage && previewImage === hasColorImg ? '0 0 0 2px #0f172a' : undefined
                      }}
                      title={color}
                      onMouseEnter={() => {
                        if (hasColorImg) setPreviewImage(hasColorImg);
                      }}
                      onMouseLeave={() => {
                        setPreviewImage(null);
                      }}
                      onClick={(e) => {
                        if (hasColorImg) {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImage(hasColorImg);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
            {product.rating > 0 && (
              <div className="product-card-rating">
                <span className="stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
                  {[...Array(Math.min(5, Math.max(1, Math.round(parseFloat(product.rating)))))].map((_, idx) => (
                    <StarIcon key={idx} size={11} />
                  ))}
                </span>
                <span>{parseFloat(product.rating).toFixed(1)}</span>
              </div>
            )}
            {soldCount > 0 && (
              <div className="product-card-sold">{soldCount}+ sold recently</div>
            )}
          </div>
        </div>
      </Link>

      {showToast && (
        <div className="toast toast-success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="toast-icon"><CheckIcon size={14} /></span>
          Added to cart!
        </div>
      )}
    </>
  );
}

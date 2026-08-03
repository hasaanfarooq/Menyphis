'use client';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

export default function HeroBanner({ products = [] }) {
  const { formatPrice } = useCurrency();
  const heroProducts = products.slice(0, 4);

  return (
    <section className="hero-banner">
      <div className="hero-banner-inner">
        <div className="hero-banner-text">
          <div className="hero-banner-title">Trends</div>
          <div className="hero-banner-subtitle">#Street Styles</div>
        </div>

        <div className="hero-products-row">
          {heroProducts.length > 0 ? (
            heroProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="hero-product-card"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="eager"
                />
                <div className="hero-product-info">
                  <div className="hero-product-name">{product.name}</div>
                  <div className="hero-product-price">
                    {formatPrice(product.price)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Placeholder cards while loading
            [...Array(4)].map((_, i) => (
              <div key={i} className="hero-product-card">
                <div className="skeleton" style={{ aspectRatio: '3/4' }} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

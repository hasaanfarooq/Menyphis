'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const FlashSaleContext = createContext(null);

export function FlashSaleProvider({ children }) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/flash-sale')
      .then(r => r.json())
      .then(data => {
        setSale(data && data.id ? data : null);
      })
      .catch(() => setSale(null))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Check if a product is in the active flash sale.
   * Returns: { inSale: bool, salePrice: number, discount: number } or null
   */
  const getSaleInfo = (productId, originalPrice) => {
    if (!sale || !sale.products) return null;
    const saleProduct = sale.products.find(p => p.id === productId);
    if (!saleProduct) return null;

    const discount = saleProduct.effective_discount ?? sale.discount_percent;
    const salePrice = parseFloat((originalPrice * (1 - discount / 100)).toFixed(2));

    return {
      inSale: true,
      discount,
      salePrice,
      badgeText: sale.badge_text || 'FLASH SALE',
      saleTitle: sale.title,
    };
  };

  return (
    <FlashSaleContext.Provider value={{ sale, loading, getSaleInfo }}>
      {children}
    </FlashSaleContext.Provider>
  );
}

export function useFlashSale() {
  return useContext(FlashSaleContext);
}

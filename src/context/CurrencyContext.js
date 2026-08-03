'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const CurrencyContext = createContext();

const EXCHANGE_RATES = {
  USD: 1,
  PKR: 280, // 1 USD = 280 PKR
};

export function CurrencyProvider({ children }) {
  const { get, loaded } = useSiteSettings();
  const [currency, setCurrency] = useState('USD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loaded) return; // Wait until settings are loaded
    
    // Check local storage for saved preference on mount
    const saved = localStorage.getItem('menyphis_currency');
    if (saved && EXCHANGE_RATES[saved]) {
      setCurrency(saved);
    } else {
      const defaultCurrency = get('currency_default', 'USD');
      if (EXCHANGE_RATES[defaultCurrency]) {
        setCurrency(defaultCurrency);
      }
    }
    setMounted(true);
  }, [loaded, get]);

  const changeCurrency = (newCurrency) => {
    if (EXCHANGE_RATES[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('menyphis_currency', newCurrency);
    }
  };

  const formatPrice = (amount) => {
    if (!mounted) return `$${parseFloat(amount).toFixed(2)}`; // SSR fallback to USD

    const rate = EXCHANGE_RATES[currency];
    const converted = amount * rate;

    if (currency === 'PKR') {
      return `Rs ${converted.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
    }
    
    // Default to USD
    return `$${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state when user changes
  useEffect(() => {
    async function loadWishlist() {
      setLoading(true);
      if (user) {
        // Fetch from API
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const data = await res.json();
            setItems(data);
          } else {
            setItems([]);
          }
        } catch (err) {
          console.error('Failed to load wishlist from API', err);
        }
      } else {
        // Fetch from localStorage
        const saved = localStorage.getItem('menyphis-wishlist');
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch (e) {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
      setLoading(false);
    }
    
    loadWishlist();
  }, [user]);

  // Sync to localStorage if not logged in
  useEffect(() => {
    if (!user && !loading) {
      localStorage.setItem('menyphis-wishlist', JSON.stringify(items));
    }
  }, [items, user, loading]);

  const toggleWishlist = async (product) => {
    const isWishlisted = items.some(item => item.id === product.id);
    
    if (user) {
      // API call
      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.action === 'added') {
            setItems([...items, product]);
          } else if (data.action === 'removed') {
            setItems(items.filter(item => item.id !== product.id));
          }
        }
      } catch (err) {
        console.error('Failed to toggle wishlist item', err);
      }
    } else {
      // Local storage logic
      if (isWishlisted) {
        setItems(items.filter(item => item.id !== product.id));
      } else {
        setItems([...items, product]);
      }
    }
  };

  const isWishlisted = (productId) => {
    return items.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}

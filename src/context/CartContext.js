'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        item => item.id === action.payload.id && 
                item.size === action.payload.size && 
                item.color === action.payload.color
      );
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += 1;
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((_, i) => i !== action.payload) };
    case 'UPDATE_QUANTITY': {
      const newItems = [...state.items];
      newItems[action.payload.index].quantity = action.payload.quantity;
      if (newItems[action.payload.index].quantity <= 0) {
        newItems.splice(action.payload.index, 1);
      }
      return { ...state, items: newItems };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };
    case 'LOAD_CART':
      return { ...state, items: action.payload, isLoaded: true };
    case 'SET_LOADED':
      return { ...state, isLoaded: true };
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, isLoaded: false });

  useEffect(() => {
    const saved = localStorage.getItem('menyphis-cart');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) });
      } catch (e) { 
        dispatch({ type: 'SET_LOADED' });
      }
    } else {
      dispatch({ type: 'SET_LOADED' });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('menyphis-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product, size, color) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, size, color } });
  };

  const removeItem = (index) => dispatch({ type: 'REMOVE_ITEM', payload: index });
  const updateQuantity = (index, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const setCartOpen = (open) => dispatch({ type: 'SET_CART_OPEN', payload: open });

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items: state.items, isOpen: state.isOpen, isLoaded: state.isLoaded,
      addItem, removeItem, updateQuantity, clearCart, toggleCart, setCartOpen,
      totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

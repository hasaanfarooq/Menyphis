'use client';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { XIcon, ShoppingBagIcon } from '@/components/Icons';

export default function CartDrawer() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity, totalPrice } = useCart();
  const { formatPrice } = useCurrency();

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Shopping Cart ({items.length})</h2>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)} aria-label="Close cart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="cart-drawer-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <ShoppingBagIcon size={48} color="var(--border-color)" />
              </div>
              <p style={{ fontWeight: 500 }}>Your cart is empty</p>
              <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>
                Add some items to get started
              </p>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id}-${item.size}-${item.color}-${index}`} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-meta">{item.size} / {item.color}</div>
                  <div className="cart-item-bottom">
                    <span className="cart-item-price">{formatPrice(item.price * item.quantity)}</span>
                    <div className="cart-qty-controls">
                      <button className="cart-qty-btn" onClick={() => updateQuantity(index, item.quantity - 1)}>−</button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button className="cart-qty-btn" onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">{formatPrice(totalPrice)}</span>
            </div>
            <button className="cart-checkout-btn" onClick={() => {
              setCartOpen(false);
              window.location.href = '/checkout';
            }}>Checkout →</button>
          </div>
        )}
      </div>
    </>
  );
}

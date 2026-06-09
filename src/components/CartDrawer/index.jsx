import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { removeFromCart } from '../../backend/cart';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isCartOpen, closeCart, cartItems, cartCount, refreshCart, openCheckout } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isCartOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  const handleRemove = async (itemId) => {
    try {
      setLoading(true);
      await removeFromCart(itemId);
      await refreshCart();
    } catch (err) {
      console.error("Failed to remove item", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    openCheckout();
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce((acc, item) => {
    // Convert price string to number, remove '$' or ',' if present
    const priceNum = Number(item.products.price.replace(/[^0-9.-]+/g,"")) || 0;
    return acc + (priceNum * item.quantity);
  }, 0);

  const freeShippingThreshold = 1000;
  const amountAway = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <>
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={closeCart} />
      
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>YOUR CART <span className="cart-badge">{cartCount}</span></h2>
          <button className="cart-close" onClick={closeCart}>&times;</button>
        </div>

        <div className="cart-shipping-bar">
          {amountAway > 0 ? (
            <p>You are <strong>₹{amountAway.toFixed(2)}</strong> away from <strong>Free Shipping</strong></p>
          ) : (
            <p><strong>Free Shipping Unlocked!</strong></p>
          )}
          <div className="progress-bg">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <button className="btn-continue" onClick={() => { closeCart(); navigate('/collection'); }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-img">
                  <img src={item.products.image} alt={item.products.name} />
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-title-row">
                    <h3>{item.products.name}</h3>
                    <button className="btn-remove" onClick={() => handleRemove(item.id)} disabled={loading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="cart-item-variant">
                    {item.size && <span className="cart-variant-badge">{item.size}</span>}
                    {item.color && <span className="cart-variant-badge">{item.color}</span>}
                  </div>

                  <div className="cart-item-price-row">
                    <span className="cart-price">{item.products.price}</span>
                    <div className="cart-qty-display">Qty: {item.quantity}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            <p className="cart-tax-note">Shipping, taxes, and discounts calculated at checkout.</p>
            <button className="btn-checkout" onClick={handleCheckout}>
              CHECKOUT
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

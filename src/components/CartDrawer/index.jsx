import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { removeFromCart } from '../../backend/cart';
import { parsePrice } from '../../utils/offers';
import './CartDrawer.css';

const CartDrawer = () => {
  const { isCartOpen, closeCart, cartItems, cartCount, refreshCart, openCheckout, b1g1Info } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Lock body scroll when cart drawer is open & handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isCartOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
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

  // Calculate raw subtotal
  const rawSubtotal = cartItems.reduce((acc, item) => {
    const priceNum = parsePrice(item.products.price);
    return acc + (priceNum * item.quantity);
  }, 0);

  const b1g1Discount = b1g1Info?.b1g1Discount || 0;
  const finalSubtotal = Math.max(0, rawSubtotal - b1g1Discount);

  const freeShippingThreshold = 999;
  const amountAway = freeShippingThreshold - finalSubtotal;
  const progressPercent = Math.min(100, (finalSubtotal / freeShippingThreshold) * 100);

  return (
    <>
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={closeCart} />
      
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>YOUR CART <span className="cart-badge">{cartCount}</span></h2>
          <button className="cart-close" onClick={closeCart}>&times;</button>
        </div>

        {/* Free Shipping Bar */}
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

        {/* B1G1 Promo Notification Bar */}
        {cartItems.length > 0 && b1g1Info?.missingFreeItem && (
          <div className="b1g1-alert-bar missing">
            <div className="b1g1-alert-content">
              <span className="b1g1-alert-icon">🎁</span>
              <div>
                <strong>B1G1 SPECIAL UNLOCKED!</strong>
                <p>Add any item costing ₹599 or less to get it <strong>100% FREE!</strong></p>
              </div>
            </div>
            <button 
              className="btn-b1g1-claim"
              onClick={() => {
                closeCart();
                navigate('/collection');
              }}
            >
              Browse Products
            </button>
          </div>
        )}

        {cartItems.length > 0 && b1g1Info?.isB1G1Applied && (
          <div className="b1g1-alert-bar active">
            <span className="b1g1-alert-icon">🎉</span>
            <div>
              <strong>BUY ₹799 GET ₹599 FREE APPLIED!</strong>
              <p>You saved <strong>₹{b1g1Discount.toFixed(2)}</strong> on your cart item!</p>
            </div>
          </div>
        )}

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <button className="btn-continue" onClick={() => { closeCart(); navigate('/collection'); }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const isFreeItem = b1g1Info?.freeItemIds?.includes(item.id);
              const originalPriceNum = parsePrice(item.products.price);

              return (
                <div key={item.id} className={`cart-item ${isFreeItem ? 'discounted-item' : ''}`}>
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
                      {isFreeItem && <span className="free-offer-tag">B1G1 FREE</span>}
                    </div>

                    <div className="cart-item-price-row">
                      {isFreeItem ? (
                        <div className="free-price-display">
                          <span className="strikethrough-price">₹{originalPriceNum.toFixed(2)}</span>
                          <span className="free-label">FREE</span>
                        </div>
                      ) : (
                        <span className="cart-price">{item.products.price}</span>
                      )}
                      <div className="cart-qty-display">Qty: {item.quantity}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            {b1g1Discount > 0 && (
              <div className="cart-discount-line">
                <span>B1G1 Free Offer</span>
                <span className="discount-value">-₹{b1g1Discount.toFixed(2)}</span>
              </div>
            )}
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <strong>₹{finalSubtotal.toFixed(2)}</strong>
            </div>
            <p className="cart-tax-note">Shipping, taxes, and final discounts calculated at checkout.</p>
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

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getWishlist } from '../../backend/wishlist';
import './MobileBottomDock.css';

const MobileBottomDock = () => {
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user } = useAuth();
  const { openCart, cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const loadWishlistCount = async () => {
      if (!user) {
        setWishlistCount(0);
        return;
      }
      try {
        const list = await getWishlist(user.id);
        setWishlistCount(list?.length || 0);
      } catch (err) {
        console.error("Failed to load wishlist count in dock:", err);
      }
    };

    loadWishlistCount();

    // Listen to reactive wishlist updates
    window.addEventListener('wishlist-changed', loadWishlistCount);
    return () => {
      window.removeEventListener('wishlist-changed', loadWishlistCount);
    };
  }, [user]);

  // Hide the dock on Admin pages and Checkout page
  if (location.pathname.startsWith('/admin') || location.pathname === '/checkout') {
    return null;
  }

  const handleMenuClick = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-menu'));
  };

  return (
    <div className="mobile-bottom-dock">
      <Link to="/" className={`dock-item ${location.pathname === '/' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Home</span>
      </Link>

      <Link to="/collection" className={`dock-item ${location.pathname === '/collection' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1"/>
          <rect width="7" height="5" x="14" y="3" rx="1"/>
          <rect width="7" height="9" x="14" y="12" rx="1"/>
          <rect width="7" height="5" x="3" y="16" rx="1"/>
        </svg>
        <span>Shop</span>
      </Link>

      <Link to="/wishlist" className={`dock-item ${location.pathname === '/wishlist' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
        {wishlistCount > 0 && <span className="dock-badge">{wishlistCount}</span>}
        <span>Wishlist</span>
      </Link>

      <button onClick={openCart} className="dock-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        {cartCount > 0 && <span className="dock-badge">{cartCount}</span>}
        <span>Cart</span>
      </button>

      <button onClick={handleMenuClick} className="dock-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
        <span>Menu</span>
      </button>
    </div>
  );
};

export default MobileBottomDock;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { fetchProducts } from '../../backend/products';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import './UserProfileDrawer.css';

const UserProfileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { openCart } = useCart();
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    if (isOpen && popularProducts.length === 0) {
      const loadPopular = async () => {
        try {
          const data = await fetchProducts();
          if (data && data.length > 0) {
            setPopularProducts(data.slice(0, 2));
          }
        } catch (err) {
          console.error("Failed to load popular products", err);
        }
      };
      loadPopular();
    }
  }, [isOpen, popularProducts.length]);

  const handleLoginClick = () => {
    onClose();
    navigate('/login');
  };

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      
      <div className={`profile-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <Link to="/" onClick={onClose}>BLUDWEAR</Link>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="drawer-content">
          <div className="drawer-auth-intro">
            <h2>{user ? `WELCOME BACK` : `SIGN IN TO YOUR ACCOUNT`}</h2>
            <p className="drawer-rewards-text">
              {user ? `Logged in as ${user.email}` : `Get access to your rewards, referrals, and more.`}
            </p>
          </div>
          
          <div className="auth-buttons">
            {user ? (
              <>
                {isAdmin && (
                  <button className="drawer-btn primary-btn" onClick={() => { onClose(); navigate('/admin'); }} style={{ marginBottom: '10px' }}>ADMIN PANEL</button>
                )}
                <button className="drawer-btn shop-btn" onClick={() => { signOut(); onClose(); }}>SIGN OUT</button>
              </>
            ) : (
              <>
                <button className="drawer-btn primary-btn" onClick={handleLoginClick}>SIGN IN OR SIGN UP</button>
                <button className="drawer-btn shop-btn">SIGN IN WITH <strong>Shop</strong></button>
              </>
            )}
          </div>
          
          <div className="drawer-links-list">
            <button className="drawer-link" onClick={() => { onClose(); openCart(); }}>Your Cart</button>
            <button className="drawer-link" onClick={() => { onClose(); navigate('/wishlist'); }}>Wishlisted Items</button>
            <button className="drawer-link" onClick={() => { onClose(); navigate('/orders'); }}>Your Orders</button>
            <button className="drawer-link" onClick={() => { onClose(); navigate('/orders'); }}>Track My Order</button>
            <button className="drawer-link" onClick={() => { onClose(); navigate('/contact-us'); }}>Contact Us</button>
          </div>
          
          <div className="drawer-section">
            <h3 className="drawer-section-title">POPULAR TODAY</h3>
            <div className="drawer-popular-grid">
              {popularProducts.map(product => {
                const img = getProductImages(product)[0] || '/placeholder.png';
                return (
                  <div key={product.id} className="drawer-product" onClick={() => { onClose(); navigate(`/products/${createProductSlug(product)}`); }} style={{ cursor: 'pointer' }}>
                    <img src={img} alt={product.name} />
                    <p className="drawer-product-name">{product.name}</p>
                    <p className="drawer-product-price">{formatPrice(product.price)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileDrawer;

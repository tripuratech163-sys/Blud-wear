import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserProfileDrawer.css';
import { products } from '../../data/products';

const UserProfileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Grab 2 products for the "Popular Today" section
  const popularProducts = products.slice(0, 2);

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
              <button className="drawer-btn primary-btn" onClick={() => { signOut(); onClose(); }}>SIGN OUT</button>
            ) : (
              <>
                <button className="drawer-btn primary-btn" onClick={handleLoginClick}>SIGN IN OR SIGN UP</button>
                <button className="drawer-btn shop-btn">SIGN IN WITH <strong>Shop</strong></button>
              </>
            )}
          </div>
          
          <div className="drawer-links-list">
            <a href="#" className="drawer-link">Your Cart</a>
            <a href="#" className="drawer-link">Wishlisted Items</a>
            <a href="#" className="drawer-link">Your Orders</a>
            <a href="#" className="drawer-link">Track My Order</a>
            <a href="#" className="drawer-link">Contact Us</a>
          </div>
          
          <div className="drawer-section">
            <h3 className="drawer-section-title">POPULAR TODAY</h3>
            <div className="drawer-popular-grid">
              {popularProducts.map(product => (
                <div key={product.id} className="drawer-product">
                  <img src={product.image} alt={product.name} />
                  <p className="drawer-product-name">{product.name}</p>
                  <p className="drawer-product-price">{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileDrawer;

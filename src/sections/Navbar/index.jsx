import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserProfileDrawer from './UserProfileDrawer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getWishlist } from '../../backend/wishlist';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { openCart, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);

  const loadWishlistCount = async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }
    try {
      const list = await getWishlist(user.id);
      setWishlistCount(list?.length || 0);
    } catch (err) {
      console.error("Failed to load wishlist count:", err);
    }
  };

  useEffect(() => {
    loadWishlistCount();

    // Listen to reactive wishlist updates
    window.addEventListener('wishlist-changed', loadWishlistCount);
    return () => {
      window.removeEventListener('wishlist-changed', loadWishlistCount);
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <div className="mobile-menu-btn" onClick={() => setIsProfileOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </div>

        <div className="navbar-logo">
          <Link to="/">
            {/* Replace the URL with your Supabase logo URL */}
            <img
              src="https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg"
              alt="BludWear"
              className="logo-img"
              onError={(e) => e.target.style.display = 'none'}
            />
            <span className="logo-text">BLUDWEAR</span>
          </Link>
        </div>

        <div className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/collection?category=men">Men <span className="chevron">&#8964;</span></Link>
          <Link to="/collection?category=women">Women <span className="chevron">&#8964;</span></Link>
          <Link to="/collection">COLLECTION</Link>
          <a href="/#collection">LATEST ARSENAL <span className="fire">🔥</span></a>
        </div>

        <div className="navbar-actions">
          <button className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <button className="icon-btn" onClick={() => setIsProfileOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          <button className="icon-btn badge-btn" onClick={() => navigate('/wishlist')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span className="badge-count">{wishlistCount}</span>
          </button>

          <button className="icon-btn badge-btn" onClick={openCart}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className="badge-count">{cartCount}</span>
          </button>
        </div>
      </div>

      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </nav>
  );
};

export default Navbar;

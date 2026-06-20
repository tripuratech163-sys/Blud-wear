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
    const handleOpenMobileMenu = () => {
      setIsProfileOpen(true);
    };
    window.addEventListener('open-mobile-menu', handleOpenMobileMenu);
    return () => {
      window.removeEventListener('open-mobile-menu', handleOpenMobileMenu);
    };
  }, []);

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
              src="https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/1.jpg_1_gaqvnn.jpg"
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
          <a href="/#collection">LATEST ARSENAL <span className="fire"></span></a>
        </div>

        <div className="navbar-actions">
          {/* Social Links */}
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="icon-btn social-icon hidden-mobile" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.98a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
            </svg>
          </a>
          <a href="https://wa.me/917302572624" target="_blank" rel="noreferrer" className="icon-btn social-icon hidden-mobile" aria-label="WhatsApp">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12c0 1.76.46 3.42 1.25 4.88L2 22l5.24-1.21A9.957 9.957 0 0011.99 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.25c-1.46 0-2.85-.38-4.08-1.05l-.29-.16-3.03.7.8-2.95-.18-.3A8.188 8.188 0 013.76 12c0-4.54 3.7-8.25 8.24-8.25 4.54 0 8.25 3.71 8.25 8.25s-3.71 8.25-8.25 8.25zm4.53-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.3.19-.55.07-1.12-.53-2.16-1.16-2.94-2.02-.63-.69-1.07-1.52-1.3-2.31-.05-.18.06-.28.18-.39.1-.1.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.29 3.79 1.14.49 1.83.65 2.51.78.69.13 1.32.1 1.81-.03.54-.15 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.15-.48-.28z"/>
            </svg>
          </a>
          <a href="mailto:wearblud@gmail.com" className="icon-btn social-icon hidden-mobile" aria-label="Email">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </a>
          
          <div className="nav-separator hidden-mobile" style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }}></div>

          <button className="icon-btn hidden-mobile">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          <button className="icon-btn hidden-mobile" onClick={() => setIsProfileOpen(true)}>
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

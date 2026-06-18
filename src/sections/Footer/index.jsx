import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg"
              alt="BludWear"
              className="footer-logo-img"
              onError={(e) => e.target.style.display = 'none'}
            />
            <span>BLUDWEAR</span>
          </div>
          <p className="footer-tagline">FORGED FOR THE MODERN WARRIOR.</p>
          <div className="footer-contact">
            <a href="mailto:wearblud@gmail.com">
              <span className="contact-icon">@</span>
              wearblud@gamil.com
            </a>
            <a href="https://www.instagram.com/blud.wear?igsh=cDNwcmhxdGtjMjQ1" target="_blank" rel="noreferrer">
              <span className="contact-icon">IG</span>
              Instagram
            </a>
          </div>
        </div>

        <div className="footer-links">
          <div className="link-group">
            <h3>Shop</h3>
            <Link to="/collection">LATEST ARSENAL</Link>
            <Link to="/collection">Outerwear</Link>
            <Link to="/collection">Bottoms</Link>
            <Link to="/collection">Accessories</Link>
          </div>
          <div className="link-group">
            <h3>Support</h3>
            <Link to="/guides">Guides & FAQ</Link>
            <Link to="/sustainability">Shipping & Returns</Link>
            <Link to="/contact-us">Contact Us</Link>
          </div>
          <div className="link-group">
            <h3>Brand</h3>
            <Link to="/about">About Us</Link>
            <Link to="/sustainability">Sustainability</Link>
            <Link to="/guides">Expert Guides</Link>
          </div>
          <div className="link-group">
            <h3>Connect</h3>
            <a href="https://www.instagram.com/bludwear/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="mailto:hello@bludwear.com">Email</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-container">
          <p>&copy; {new Date().getFullYear()} BludWear. All rights reserved.</p>
          <div className="social-links">
            <a href="https://www.instagram.com/bludwear/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="mailto:hello@bludwear.com">Email</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

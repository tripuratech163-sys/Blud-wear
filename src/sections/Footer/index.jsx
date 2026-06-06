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
          <p className="footer-tagline">Forged in Blud and sweat.</p>
          <div className="footer-contact">
            <a href="mailto:wearblud@gamil.com">
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
            <a href="#">New Arrivals</a>
            <a href="#">Outerwear</a>
            <a href="#">Bottoms</a>
            <a href="#">Accessories</a>
          </div>
          <div className="link-group">
            <h3>Support</h3>
            <a href="#">FAQ</a>
            <a href="#">Shipping & Returns</a>
            <a href="mailto:hello@bludwear.com">Contact Us</a>
          </div>
          <div className="link-group">
            <h3>Legal</h3>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
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

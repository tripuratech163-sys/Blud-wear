import { Link } from 'react-router-dom';
import './PromoGridAd.css';

const PromoGridAd = () => {
  return (
    <section className="promo-grid-ad">
      <div className="container">
        <div className="promo-grid-container">
          
          {/* Ad Card 1: Heavyweight Fabric Drop */}
          <div className="promo-ad-card card-heavyweight">
            <div className="promo-card-bg" style={{ backgroundImage: `url('https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/1.jpg_1_gaqvnn.jpg')` }}>
              <div className="promo-card-overlay"></div>
            </div>
            
            <div className="promo-card-content">
              <span className="promo-card-badge">240 GSM HEAVYWEIGHT</span>
              <h3 className="promo-card-title">CRAFTED FOR HEAVY MOVEMENT</h3>
              <p className="promo-card-desc">
                High-density combed cotton with drop-shoulder athletic silhouette. Engineered to hold structure through hundreds of wears.
              </p>
              <Link to="/collection" className="promo-card-btn">
                SHOP HEAVYWEIGHT TEES &rarr;
              </Link>
            </div>
          </div>

          {/* Ad Card 2: New Customer Promo Offer */}
          <div className="promo-ad-card card-coupon">
            <div className="promo-card-bg" style={{ backgroundImage: `url('https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/2.jpg_2_gaqvnn.jpg')` }}>
              <div className="promo-card-overlay"></div>
            </div>
            
            <div className="promo-card-content">
              <span className="promo-card-badge gold">EXCLUSIVE PERK</span>
              <h3 className="promo-card-title">TAKE ₹300 OFF YOUR FIRST ORDER</h3>
              <div className="promo-code-box">
                <span>USE CODE:</span>
                <strong className="code-text">BLUD300</strong>
              </div>
              <p className="promo-card-desc">
                Valid on all orders over ₹1,999. Can be combined with free shipping pan-India!
              </p>
              <Link to="/collection" className="promo-card-btn gold-btn">
                CLAIM YOUR DISCOUNT &rarr;
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PromoGridAd;

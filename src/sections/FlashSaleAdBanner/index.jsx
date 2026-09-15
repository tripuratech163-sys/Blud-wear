import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FlashSaleAdBanner.css';

const FlashSaleAdBanner = () => {
  // Target End Date: 2 days after tomorrow (end of day 3 days from now)
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    // Exact Sale End Date: September 18, 2026 23:59:59 IST
    const targetDate = new Date('2026-09-18T23:59:59+05:30');

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <section className="flash-sale-ad">
      <div className="flash-sale-ad-bg">
        <div className="flash-sale-ad-overlay"></div>
      </div>

      <div className="container flash-sale-ad-container">
        <div className="flash-sale-ad-header">
          <span className="flash-sale-badge">
            <span className="pulse-fire">🔥</span> LIMITED TIME OFFER
          </span>
          <div className="flash-sale-timer-wrap">
            <span className="timer-label">OFFER ENDS IN:</span>
            <div className="flash-sale-timer">
              <div className="timer-box">
                <span className="timer-val">{formatNumber(timeLeft.days)}</span>
                <span className="timer-unit">DAYS</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-box">
                <span className="timer-val">{formatNumber(timeLeft.hours)}</span>
                <span className="timer-unit">HRS</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-box">
                <span className="timer-val">{formatNumber(timeLeft.minutes)}</span>
                <span className="timer-unit">MINS</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-box">
                <span className="timer-val">{formatNumber(timeLeft.seconds)}</span>
                <span className="timer-unit">SECS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flash-sale-ad-body">
          <h2 className="flash-sale-title">
            BUY ANY <span className="highlight-price">₹799+</span> PRODUCT,<br />
            GET A <span className="highlight-free">₹599 ITEM 100% FREE</span>
          </h2>
          <p className="flash-sale-subtitle">
            Upgrade your athletic rotation. Add any garment priced ₹799 or more to your cart along with a ₹599 item — 
            the ₹599 item is automatically discounted to <strong>₹0.00</strong> at checkout!
          </p>

          <div className="flash-sale-actions">
            <Link to="/collection" className="flash-sale-btn primary">
              EQUIP ₹799+ ITEMS &rarr;
            </Link>
            <Link to="/collection" className="flash-sale-btn secondary">
              CLAIM YOUR ₹599 FREE ITEM
            </Link>
          </div>
        </div>

        <div className="flash-sale-ad-footer">
          <div className="flash-feature-pill">✓ Auto-Applied at Checkout</div>
          <div className="flash-feature-pill">✓ Free Pan-India Shipping over ₹999</div>
          <div className="flash-feature-pill">✓ 100% Premium Heavyweight Cotton</div>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleAdBanner;

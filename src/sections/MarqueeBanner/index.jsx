import './MarqueeBanner.css';

const items = [
  "FREE SHIPPING OVER $150",
  "BLUDWEAR — FORGED IN BLOOD & SWEAT",
  "NEW COLLECTION LIVE NOW",
  "PREMIUM LUXURY ATHLEISURE",
  "WORLDWIDE DELIVERY",
  "SHOP THE DROP",
];

const MarqueeBanner = () => {
  return (
    <div className="marquee-section">
      <div className="marquee-track">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-dot">✦</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBanner;

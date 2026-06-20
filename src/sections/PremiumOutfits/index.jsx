import { Link } from 'react-router-dom';
import './PremiumOutfits.css';

const categories = [
  { id: 3, name: "Men COMPRESSION", image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781957967/vgs3low4tzuc2blg3dxw.jpg", link: "/collection" },
  { id: 1, name: "Women COMPRESSION", image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781959627/ChatGPT_Image_Jun_20_2026_06_16_00_PM_spmede.png", link: "/collection" },
  { id: 2, name: "TANK", image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781957460/rm1qv5rnybxml0vmvdno.jpg", link: "/collection" },
];

const PremiumOutfits = () => {
  return (
    <section className="premium-outfits">
      <div className="container">
        <h2 className="premium-title">
          <em>Introducing Premium Outfits Of Life Style</em>
        </h2>

        <div className="outfits-grid">
          {categories.map(cat => {
            const cardContent = (
              <>
                <img src={cat.image} alt={cat.name} className="outfit-image" loading="lazy" decoding="async" />
                {cat.comingSoon && (
                  <div className="outfit-coming-soon">
                    <span>COMING SOON</span>
                  </div>
                )}
                <div className="outfit-overlay">
                  <span className="outfit-name">{cat.name}</span>
                  {!cat.comingSoon && (
                    <span className="outfit-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                      </svg>
                    </span>
                  )}
                </div>
              </>
            );

            return cat.link ? (
              <Link key={cat.id} to={cat.link} className="outfit-card">
                {cardContent}
              </Link>
            ) : (
              <div key={cat.id} className={`outfit-card ${cat.comingSoon ? 'outfit-card--disabled' : ''}`}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PremiumOutfits;

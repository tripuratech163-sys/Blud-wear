import { Link } from 'react-router-dom';
import './PremiumOutfits.css';

const categories = [
  { id: 1, name: "COMPRESSION", image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/Compression%20Black%20Full/DSC_8003.jpg", link: "/collection" },
  { id: 2, name: "JOGGERS", image: "/joggers.png", comingSoon: true },
  { id: 3, name: "T-SHIRT", image: "/tshirt.png", comingSoon: true },
  { id: 4, name: "SHORTS", image: "/shorts.png", comingSoon: true },
  { id: 5, name: "LEGGINGS", image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/Compression%20Pink%20Full/DSC_7764.jpg", comingSoon: true },
  { id: 6, name: "ACCESSORIES", image: "/hero.png", comingSoon: true },
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

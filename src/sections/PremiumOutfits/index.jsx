import { categories } from '../../data/products';
import './PremiumOutfits.css';

const PremiumOutfits = () => {
  return (
    <section className="premium-outfits">
      <div className="container">
        <h2 className="premium-title">
          <em>Introducing Premium Outfits Of Life Style</em>
        </h2>

        <div className="outfits-grid">
          {categories.map(cat => (
            <div key={cat.id} className="outfit-card">
              <img src={cat.image} alt={cat.name} className="outfit-image" />
              <div className="outfit-overlay">
                <span className="outfit-name">{cat.name}</span>
                <span className="outfit-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="13 17 18 12 13 7"></polyline>
                    <polyline points="6 17 11 12 6 7"></polyline>
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumOutfits;

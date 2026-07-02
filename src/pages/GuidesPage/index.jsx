import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import { optimizeImageUrl } from '../../data/products';
import './GuidesPage.css';

const guidesData = [
  {
    slug: "cold-weather-fabric",
    title: "How to Choose the Right Fabric for Cold-Weather Training",
    metaTitle: "Cold-Weather Training Fabrics Guide | BludWear",
    metaDesc: "Discover the best fabric and weights for cold-weather workout gear. Learn about GSM, thermal layering, and moisture-wicking fleece structures.",
    image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781958602/xlrjd7urxgkgn7bnsahm.jpg",
    category: "FABRICS",
    readTime: "5 min read",
    summary: "Heavyweight hoodies vs lightweight thermals. Understanding fabric thickness (GSM) and active moisture transfer are key to staying warm without overheating.",
    content: (
      <article className="guide-article">
        <p className="intro">
          Training in cold conditions requires a delicate balance: you need insulation to protect muscle temperatures, but you also need ventilation to release body heat and sweat. Choosing the wrong fabrics leads to wet, freezing garments that increase fatigue and risk injury.
        </p>

        <h3>1. Fabric GSM: The Thickness Standard</h3>
        <p>
          GSM stands for Grams per Square Meter. It is the metric measuring fabric density:
        </p>
        <ul>
          <li><strong>Lightweight (120-180 GSM)</strong>: Best for active base layers and hot conditions.</li>
          <li><strong>Midweight (180-240 GSM)</strong>: Versatile for training tees and active layering.</li>
          <li><strong>Heavyweight (250-400 GSM)</strong>: Required for thermal protection, structure, and wind resistance during outdoor cold training.</li>
        </ul>
        <p>
          At BludWear, our winter hoodies and jackets use a custom <strong>360 GSM double-knit brushed fleece</strong>. This traps pockets of warm air close to your skin while maintaining an active, non-bulky drape.
        </p>

        <h3>2. The Danger of Cotton in Cold Weather</h3>
        <p>
          Cotton absorbs moisture like a sponge and retains it. When you sweat, cotton layers become wet and heavy. In cold wind, this wet fabric acts as a thermal conductor, drawing heat *away* from your body and causing rapid cooling.
        </p>
        <p>
          Instead, choose synthetic blends (Polyester/Elastane) engineered with <strong>moisture-wicking capillaries</strong>. These fibers pull sweat off your skin and spread it across the surface area of the fabric, allowing rapid evaporation.
        </p>

        <div className="guide-cta-box">
          <h4>Need Premium Cold-Weather Layers?</h4>
          <p>Explore our fleece hoodies and heavyweight performance outerwear designed specifically for extreme conditions.</p>
          <Link to="/collection?category=men" className="guide-cta-btn">Shop Heavyweight Outerwear</Link>
        </div>

        <h3>3. The Three-Layer Rule</h3>
        <p>
          To optimize outdoor training, apply three strategic layers:
        </p>
        <ol>
          <li><strong>Base Layer (Wicking)</strong>: Form-fitting compression tops that immediately pull moisture off the skin.</li>
          <li><strong>Mid Layer (Insulating)</strong>: Heavyweight fleece hoodies that retain heat.</li>
          <li><strong>Outer Layer (Weatherproof)</strong>: Windbreakers or jackets that shield you from sleet and rain.</li>
        </ol>
      </article>
    )
  },
  {
    slug: "compression-science",
    title: "The Science of Compression Gear for High-Intensity Workouts",
    metaTitle: "Science of Athletic Compression Gear | BludWear",
    metaDesc: "Explore how compression leggings and tops improve performance, stabilize muscles, and reduce post-workout soreness through active circulation support.",
    image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781957438/cldpbyqylcaa4zpzebed.jpg",
    category: "SPORTS SCIENCE",
    readTime: "6 min read",
    summary: "How tight is too tight? Learn the circulatory science behind active graduated compression and its verified benefits on athletic performance.",
    content: (
      <article className="guide-article">
        <p className="intro">
          Compression gear is no longer just a visual trend. Exercise physiologists and elite endurance athletes use graduated compression garments to squeeze out marginal gains in oxygen delivery, recovery speed, and joint stability.
        </p>

        <h3>1. Graduated Circulation Support</h3>
        <p>
          During high-intensity training, your heart pumps oxygen-rich blood to your extremities. However, returning deoxygenated blood from your lower legs back up to the heart is a mechanical challenge.
        </p>
        <p>
          <strong>Graduated compression</strong> solves this by applying the tightest pressure at the ankles and slowly easing pressure upwards. This compression squeezes vein walls, speeding up blood velocity and accelerating the removal of lactic acid buildup.
        </p>

        <h3>2. Muscle Oscillation and Micro-Tears</h3>
        <p>
          Every time your foot hits the concrete or you land a box jump, a shockwave vibrates through your calf and thigh muscles. This vibration, known as muscle oscillation, causes micro-tears in the muscle fibers, resulting in delayed onset muscle soreness (DOMS).
        </p>
        <p>
          By locking the muscles firmly in place, compression leggings reduce this oscillation. Less vibration means less microscopic damage, allowing you to train harder, longer, and return to the gym with minimal stiffness.
        </p>

        <div className="guide-cta-box">
          <h4>Looking for the Best Compression?</h4>
          <p>Our compression collections feature flatlock reinforced seams and moisture-wicking active pressure technology.</p>
          <Link to="/collection" className="guide-cta-btn">Shop Compression Collection</Link>
        </div>

        <h3>3. Joint Proprioception</h3>
        <p>
          Proprioception is your body's sensory awareness of joint positioning in space. The constant pressure of compression fabrics stimulates cutaneous receptors in your skin, sending sensory feedback to your brain. This feedback improves your stance, squat form, and running gait, lowering injury rates.
        </p>
      </article>
    )
  }
];

const GuidesPage = () => {
  const { slug } = useParams();

  const activeGuide = slug ? guidesData.find(g => g.slug === slug) : null;



  const title = activeGuide ? activeGuide.metaTitle : "Expert Training Guides & Science | BludWear";
  const desc = activeGuide ? activeGuide.metaDesc : "Browse BludWear's collection of expert training guides. Learn about fabric specifications, compression science, and cold-weather preparation.";
  const canonicalUrl = activeGuide ? `https://www.bludwear.com/guides/${activeGuide.slug}` : "https://www.bludwear.com/guides";

  return (
    <div className="guides-page-wrapper">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <Navbar />

      <main className="guides-main container">
        {activeGuide ? (
          /* Single Article View */
          <div className="single-guide-container">
            <Link to="/guides" className="back-link">← All Expert Guides</Link>

            <header className="guide-header">
              <span className="guide-badge">{activeGuide.category}</span>
              <h1>{activeGuide.title}</h1>
              <div className="guide-meta">
                <span>{activeGuide.readTime}</span>
                <span className="bullet">•</span>
                <span>By BludWear Sports Labs</span>
              </div>
            </header>

            <div className="guide-banner">
              <img src={optimizeImageUrl(activeGuide.image, 1200)} alt={activeGuide.title} />
            </div>

            <div className="guide-content-wrapper">
              {activeGuide.content}
            </div>
          </div>
        ) : (
          /* Articles List View */
          <div className="guides-list-container">
            <header className="guides-list-header text-center">
              <span className="guides-list-tag">LABS</span>
              <h1>EXPERT GUIDES</h1>
              <p>Authority articles and research on training equipment, fabric tech, and sports science.</p>
            </header>

            <div className="guides-grid">
              {guidesData.map((g) => (
                <div key={g.slug} className="guide-card">
                  <div className="guide-card-img">
                    <img src={optimizeImageUrl(g.image, 600)} alt={g.title} />
                  </div>
                  <div className="guide-card-content">
                    <span className="guide-card-category">{g.category}</span>
                    <h3>{g.title}</h3>
                    <p>{g.summary}</p>
                    <div className="guide-card-footer">
                      <span>{g.readTime}</span>
                      <Link to={`/guides/${g.slug}`} className="read-more-btn">Read Article →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GuidesPage;

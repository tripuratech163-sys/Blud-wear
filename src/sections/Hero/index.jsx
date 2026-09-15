import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = ({ 
  desktopSrc = "https://res.cloudinary.com/duobc58vr/image/upload/v1789493555/ChatGPT_Image_Sep_15_2026_11_02_24_PM_yjzygd.png",
  mobileSrc = "https://res.cloudinary.com/duobc58vr/image/upload/v1789494379/ChatGPT_Image_Sep_15_2026_11_16_08_PM_wn2e3y.png"
}) => {
  return (
    <section className="hero">
      <Link to="/collection" className="hero-link" aria-label="Explore Sale Collection">
        <picture className="hero-background">
          {mobileSrc && <source media="(max-width: 768px)" srcSet={mobileSrc} />}
          <img 
            src={desktopSrc} 
            alt="BludWear Sale 16-18 Sep" 
            className="hero-image" 
          />
        </picture>
      </Link>
    </section>
  );
};

export default Hero;

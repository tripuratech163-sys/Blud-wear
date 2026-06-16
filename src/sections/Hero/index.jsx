import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <img src="/hero.png" alt="BludWear Luxury Athlete" className="hero-image" />
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container hero-content">
        <h1 className="hero-title">
          <span className="hero-title-line">Forged in</span>
          <span className="hero-title-line highlight">Blud & Sweat</span>
        </h1>
        <p className="hero-subtitle">
          Uncompromising luxury athleisure for the modern warrior.
        </p>
        <div className="hero-actions">
          <a href="#collection" className="btn btn-primary">ACQUIRE GEAR</a>
          <a href="#about" className="btn btn-outline">THE BLOODLINE</a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

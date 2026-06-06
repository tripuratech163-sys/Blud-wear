import './BrandStory.css';

const BrandStory = () => {
  return (
    <section id="about" className="brand-story">
      <div className="container story-container">
        <div className="story-content">
          <h2 className="story-title">The Bloodline</h2>
          <p className="story-text">
            BludWear is not just apparel; it is armor for the dedicated. We believe that true luxury lies in the relentless pursuit of perfection. Every seam, every fabric choice, and every design is meticulously crafted to empower the modern athlete.
          </p>
          <p className="story-text">
            Our signature blood and black aesthetic represents the passion and the void—the intense drive that pushes you past your limits and the singular focus required to get there.
          </p>
          <a href="#" className="btn btn-outline story-btn">Read Our Manifesto</a>
        </div>
        <div className="story-visual">
          <div className="visual-block black-block"></div>
          <div className="visual-block blood-block"></div>
          <div className="visual-image-wrapper">
             <img src="/hero.png" alt="BludWear Aesthetics" className="story-image" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;

import './NewsletterSection.css';

const NewsletterSection = () => {
  return (
    <section className="newsletter-section">
      <div className="newsletter-bg">
        <img src="/marquee_bg.png" alt="BludWear Gym" className="newsletter-bg-img" />
        <div className="newsletter-overlay"></div>
      </div>
      <div className="container newsletter-content">
        <p className="newsletter-eyebrow">Join The Movement</p>
        <h2 className="newsletter-title">GET EARLY ACCESS<br />TO NEW DROPS</h2>
        <p className="newsletter-subtitle">
          Sign up and be the first to know about exclusive drops,<br/>
          limited-edition releases, and members-only offers.
        </p>
        <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
          <input
            type="email"
            placeholder="Enter your email address"
            className="newsletter-input"
          />
          <button type="submit" className="newsletter-btn">Subscribe</button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;

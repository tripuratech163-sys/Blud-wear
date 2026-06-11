import { useEffect } from 'react';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './AboutUsPage.css';

const AboutUsPage = () => {
  useEffect(() => {
    document.title = "About Us & Manifesto | BludWear — Premium Athleisure";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Learn about BludWear's commitment to high-performance sportswear. Built with premium GSM fabrics and athletic compression for modern warriors.");
    }
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Rohit Deshmukh",
      role: "Marathon Runner & Trainer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      quote: "The durability is incredible. I've worn the Black Full Compression leggings for multiple long-distance runs in cold weather, and they offer unmatched muscle support and warmth. Truly premium.",
      rating: 5,
      verified: true
    },
    {
      id: 2,
      name: "Anjali Sharma",
      role: "Powerlifter & Fitness Coach",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      quote: "Squat-proof is an understatement. The Phantom Leggings are moisture-wicking and support deep hip extension without riding down. The zero-slip waist is a game changer for high-intensity training.",
      rating: 5,
      verified: true
    },
    {
      id: 3,
      name: "Kabir Mehta",
      role: "CrossFit Coach",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      quote: "BludWear represents a new tier of athletic gear. The reinforced flatlock stitching holds up perfectly under heavy friction and high-intensity agility drills. Highly recommended for serious athletes.",
      rating: 5,
      verified: true
    }
  ];

  return (
    <div className="about-page-wrapper">
      <Navbar />
      
      <main className="about-main-content">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-overlay"></div>
          <div className="container about-hero-container">
            <span className="about-tag">THE MANIFESTO</span>
            <h1 className="about-title">FORGED IN BLUD & SWEAT</h1>
            <p className="about-subtitle">We believe true luxury lies in the relentless pursuit of human peak performance.</p>
          </div>
        </section>

        {/* Our Story & E-E-A-T Info */}
        <section className="about-story-section container">
          <div className="story-grid">
            <div className="story-text-block">
              <h2>Our Origin</h2>
              <p>
                Founded in 2026, BludWear was born out of a simple frustration: standard activewear wears down too quickly, fails under maximum physical strain, and lacks design edge. 
              </p>
              <p>
                We set out to build a brand that doesn't compromise. Our signature blood-red and deep-black aesthetic represents the intense fire of passion inside and the cold focus required to block out the noise.
              </p>
            </div>
            <div className="story-image-block">
              <img 
                src="https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg" 
                alt="BludWear activewear close-up" 
                className="about-accent-img"
              />
            </div>
          </div>
        </section>

        {/* Technical Specs & Expertise */}
        <section className="about-expertise">
          <div className="container">
            <h2 className="section-title text-center">TECHNICAL CRAFTSMANSHIP</h2>
            <p className="section-subtitle text-center">Every garment undergoes strict durability and stress testing.</p>
            
            <div className="expertise-grid">
              <div className="expertise-card">
                <div className="card-num">01</div>
                <h3>High-GSM Fabrics</h3>
                <p>We source heavy-density double-knit interlock fabrics (240 GSM to 400 GSM) that offer substantial weight, complete opaque coverage, and natural thermoregulation.</p>
              </div>
              <div className="expertise-card">
                <div className="card-num">02</div>
                <h3>Reinforced Flatlock Stitching</h3>
                <p>Seams are flat-locked using carbon-strength thread loops, eliminating friction, avoiding skin chafing, and preventing split seams under heavy load movements.</p>
              </div>
              <div className="expertise-card">
                <div className="card-num">03</div>
                <h3>Graduated Active Compression</h3>
                <p>Our compression gear applies targeted pressure to major muscle groups, optimizing venous blood flow, reducing muscle vibration, and accelerating recovery times.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials (Social Proof) */}
        <section className="about-testimonials container">
          <h2 className="section-title text-center">TRUSTED BY ATHLETES</h2>
          <p className="section-subtitle text-center">Hear from verified coaches and high-performance competitors.</p>
          
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-header">
                  <img src={t.image} alt={t.name} className="avatar" />
                  <div>
                    <h4 className="name">
                      {t.name} 
                      {t.verified && <span className="verified-badge">✓ Verified Buyer</span>}
                    </h4>
                    <p className="role">{t.role}</p>
                  </div>
                </div>
                <div className="stars">{'★'.repeat(t.rating)}</div>
                <p className="quote">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsPage;

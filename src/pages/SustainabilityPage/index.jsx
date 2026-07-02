import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './SustainabilityPage.css';

const SustainabilityPage = () => {

  return (
    <div className="sustain-page-wrapper">
      <Helmet>
        <title>Sustainability & Sourcing | BludWear — Ethical Performance</title>
        <meta name="description" content="Explore BludWear's sustainability pillars. Learn about our ethical production, recycled fibers, zero-plastic packaging, and carbon offset logistics." />
        <link rel="canonical" href="https://www.bludwear.com/sustainability" />
      </Helmet>
      <Navbar />
      
      <main className="sustain-main-content">
        {/* Hero Section */}
        <section className="sustain-hero">
          <div className="sustain-hero-overlay"></div>
          <div className="container sustain-hero-container">
            <span className="sustain-tag">OUR PLEDGE</span>
            <h1 className="sustain-title">CIRCULAR ETHICS</h1>
            <p className="sustain-subtitle">Performance shouldn't cost the Earth. We construct premium athletic apparel designed for maximum longevity and minimal environmental footprint.</p>
          </div>
        </section>

        {/* Introduction */}
        <section className="sustain-intro container">
          <div className="sustain-intro-block text-center">
            <h2>DESIGNED FOR THE FUTURE</h2>
            <p className="lead-text">
              In 2026, sportswear brands must take accountability. Athleisure is traditionally notorious for microplastics and cheap synthetic run-offs. BludWear is actively redesigning this paradigm through four core pillars.
            </p>
          </div>
        </section>

        {/* Pillars Section */}
        <section className="sustain-pillars">
          <div className="container">
            <div className="pillars-grid">
              
              <div className="pillar-row">
                <div className="pillar-content">
                  <span className="pillar-num">01</span>
                  <h3>Recycled & Certified Fibers</h3>
                  <p>
                    Rather than relying entirely on virgin synthetics, we incorporate REPREVE® recycled polyester made from post-consumer water bottles. This process consumes 45% less energy and emits 30% fewer greenhouse gases.
                  </p>
                  <p>
                    All cotton products use GOTS-certified organic cotton, grown without chemical pesticides or synthetic fertilizers, protecting local soil and farming communities.
                  </p>
                </div>
                <div className="pillar-visual">
                  <div className="pillar-box border-glow">
                    <h4>Material Sourcing</h4>
                    <ul>
                      <li>72% Recycled Polyester (REPREVE)</li>
                      <li>28% Premium Elastane (Lycra Eco)</li>
                      <li>100% GOTS-Certified Organic Cotton</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pillar-row reverse">
                <div className="pillar-content">
                  <span className="pillar-num">02</span>
                  <h3>Ethical Manufacturing</h3>
                  <p>
                    Our manufacturing hubs in Bengaluru and Tirupur are fully certified and strictly audited under WRAP (Worldwide Responsible Accredited Production) standards. 
                  </p>
                  <p>
                    We guarantee a living wage, fair working hours, and medical support for every single craftsman and factory specialist, ensuring that the human sweat in our garments is rewarded ethically.
                  </p>
                </div>
                <div className="pillar-visual">
                  <div className="pillar-box border-glow">
                    <h4>Factory Credentials</h4>
                    <ul>
                      <li>WRAP Golden Certificate Audited</li>
                      <li>Guaranteed Living Wages</li>
                      <li>Safe, Ventilated Workspace Standards</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pillar-row">
                <div className="pillar-content">
                  <span className="pillar-num">03</span>
                  <h3>Zero-Plastic Circular Packaging</h3>
                  <p>
                    We have eliminated all single-use polybags. Every BludWear garment is wrapped in biodegradable parchment paper and shipped in 100% compostable corn-starch mailers.
                  </p>
                  <p>
                    These mailers decompose naturally within 180 days in a home compost pile, leaving behind zero toxic residues or microplastics.
                  </p>
                </div>
                <div className="pillar-visual">
                  <div className="pillar-box border-glow">
                    <h4>Shipping Logistics</h4>
                    <ul>
                      <li>Corn Starch Home-Compostable Mailers</li>
                      <li>Recycled Paper Hangtags & Twine</li>
                      <li>Soy-Based Non-Toxic Inks</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pillar-row reverse">
                <div className="pillar-content">
                  <span className="pillar-num">04</span>
                  <h3>Carbon Neutral Shipping</h3>
                  <p>
                    Logistics accounts for a major share of e-commerce emissions. To combat this, we offset 100% of carbon emissions generated from our fulfillment deliveries.
                  </p>
                  <p>
                    Through partnership initiatives, we calculate shipping weights and invest in verified reforestation projects in Madhya Pradesh and solar power infrastructure.
                  </p>
                </div>
                <div className="pillar-visual">
                  <div className="pillar-box border-glow">
                    <h4>Environmental Impact</h4>
                    <ul>
                      <li>100% Shipping Emissions Offset</li>
                      <li>Verified Reforestation Support</li>
                      <li>Eco-Logistics Partner Fulfillment</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SustainabilityPage;

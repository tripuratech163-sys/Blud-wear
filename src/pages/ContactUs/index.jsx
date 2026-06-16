import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: 'error', message: 'Please fill in all fields.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_queries')
        .insert([formData]);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Thank you for reaching out! We will get back to you shortly.' });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error("Failed to submit contact query:", err);
      setStatus({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-us-page">
      <AnnouncementBar />
      <Navbar />

      <main className="contact-main">
        <div className="container contact-container">
          <div className="contact-header">
            <h1 className="contact-title">Contact Us</h1>
            <p className="contact-subtitle">Have a question or query about our gear? Drop us a line.</p>
          </div>

          <div className="contact-layout-grid">
            <div className="contact-info-block">
              <h3>HEADQUARTERS</h3>
              <p>BLUDWEAR</p>
              <p>24, Mohan Park, Near Panchal Vihar</p>
              <p>East Delhi, Delhi, India, 110092</p>

              <h3>SUPPORT HOURS</h3>
              <p>Monday - Friday: 9 AM - 6 PM IST</p>
              <p>Saturday: 10 AM - 4 PM IST</p>

              <h3>DIRECT INQUIRIES</h3>
              <p>Support: <a href="mailto:wearblud@gmail.com">wearblud@gmail.com</a></p>
            </div>

            <div className="contact-form-block">
              {status.message && (
                <div className={`status-alert ${status.type}`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="input-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    maxLength="100"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    maxLength="150"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="message">Your Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    maxLength="2000"
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Submitting...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;

import { useState } from 'react';
import { seedProducts } from '../../scripts/seedProducts';
import { Link } from 'react-router-dom';
import './SeedPage.css';

const SeedPage = () => {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setStatus('loading');
    setMessage('');
    try {
      const data = await seedProducts();
      if (data) {
        setStatus('success');
        setMessage(`✅ Successfully seeded ${data.length} products into Supabase!`);
      }
    } catch (err) {
      setStatus('error');
      setMessage(`❌ ${err.message}`);
      console.error('Seed error:', err);
    }
  };

  return (
    <div className="seed-page">
      <div className="seed-card">
        <div className="seed-logo">BLUDWEAR</div>
        <h1>Database Seeder</h1>
        <p>Click the button below to upload all 12 products (6 Men + 6 Women) into your Supabase <code>products</code> table.</p>
        <p className="seed-warning">⚠️ Only run this once! Running it multiple times will create duplicate products.</p>

        <button 
          className={`seed-btn ${status}`} 
          onClick={handleSeed}
          disabled={status === 'loading' || status === 'success'}
        >
          {status === 'idle' && 'Seed 12 Products →'}
          {status === 'loading' && 'Uploading to Supabase...'}
          {status === 'success' && 'Seeding Complete ✓'}
          {status === 'error' && 'Try Again'}
        </button>

        {message && (
          <p className={`seed-msg ${status}`}>{message}</p>
        )}

        {status === 'success' && (
          <Link to="/collection" className="seed-nav-link">View Collection →</Link>
        )}
      </div>
    </div>
  );
};

export default SeedPage;

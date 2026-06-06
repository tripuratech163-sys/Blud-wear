import { Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Pages
import CollectionPage from './pages/CollectionPage';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import SeedPage from './pages/SeedPage';

// Sections (Home page)
import AnnouncementBar   from './sections/AnnouncementBar';
import Navbar            from './sections/Navbar';
import Hero              from './sections/Hero';
import MarqueeBanner     from './sections/MarqueeBanner';
import FeaturedProducts  from './sections/FeaturedProducts';
import PremiumOutfits    from './sections/PremiumOutfits';
import BrandStory        from './sections/BrandStory';
import NewsletterSection from './sections/NewsletterSection';
import Footer            from './sections/Footer';

// ─── Home Page Layout ───────────────────────────────────────
const HomePage = () => (
  <div className="app-container">
    <AnnouncementBar />
    <Navbar />
    <main>
      <Hero />
      <MarqueeBanner />
      <FeaturedProducts />
      <PremiumOutfits />
      <BrandStory />
      <NewsletterSection />
    </main>
    <Footer />
  </div>
);

// ─── App Router ─────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/"           element={<HomePage />} />
      <Route path="/collection" element={<CollectionPage />} />
      <Route path="/products/:slug" element={<ProductPage />} />
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/seed"       element={<SeedPage />} />
    </Routes>
  );
}

export default App;

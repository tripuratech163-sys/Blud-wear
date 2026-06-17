import { Routes, Route } from 'react-router-dom';
import './styles/App.css';

// Pages
import CollectionPage from './pages/CollectionPage';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import SeedPage from './pages/SeedPage';
import ContactUs from './pages/ContactUs';
import WishlistPage from './pages/WishlistPage';
import UserOrdersPage from './pages/UserOrdersPage';
import AboutUsPage from './pages/AboutUsPage';
import SustainabilityPage from './pages/SustainabilityPage';
import GuidesPage from './pages/GuidesPage';

// Sections (Home page)
import AnnouncementBar from './sections/AnnouncementBar';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import MarqueeBanner from './sections/MarqueeBanner';
import FeaturedProducts from './sections/FeaturedProducts';
import PremiumOutfits from './sections/PremiumOutfits';
import BrandStory from './sections/BrandStory';
import NewsletterSection from './sections/NewsletterSection';
import Footer from './sections/Footer';

// Admin Pages & Layout
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProductsList from './pages/Admin/ProductsList';
import AdminProductForm from './pages/Admin/ProductForm';
import AdminOrdersList from './pages/Admin/OrdersList';
import AdminQueriesList from './pages/Admin/QueriesList';
import AdminVideosList from './pages/Admin/VideosList';

// Global Components
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import MobileBottomDock from './components/MobileBottomDock';
import { useCart } from './context/CartContext';
import VideoGallery from './sections/VideoGallery';

// ─── Home Page Layout ───────────────────────────────────────
const HomePage = () => (
  <div className="app-container">
    <AnnouncementBar />
    <Navbar />
    <main>
      <Hero />
      <MarqueeBanner />
      <FeaturedProducts />
      <VideoGallery />
      <PremiumOutfits />
      <BrandStory />
      <NewsletterSection />
    </main>
    <Footer />
  </div>
);

// ─── App Router ─────────────────────────────────────────────
function App() {
  const { isCheckoutOpen, closeCheckout } = useCart();

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success" element={<OrderSuccessPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/orders" element={<UserOrdersPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/sustainability" element={<SustainabilityPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsList />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/edit/:id" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrdersList />} />
          <Route path="queries" element={<AdminQueriesList />} />
          <Route path="videos" element={<AdminVideosList />} />
        </Route>
      </Routes>
      <CartDrawer />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={closeCheckout} />
      <MobileBottomDock />
    </>
  );
}

export default App;

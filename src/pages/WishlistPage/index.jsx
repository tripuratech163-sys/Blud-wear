import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getWishlist, toggleWishlist } from '../../backend/wishlist';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './WishlistPage.css';

const WishlistPage = () => {
  const { user } = useAuth();
  const { refreshCart, openCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getWishlist(user.id);
      // Data contains { id, products: { id, name, price, image, ... } }
      // Filter out any entries where the product details are null (e.g. if deleted)
      const validItems = (data || []).filter(item => item.products);
      setWishlistItems(validItems);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const handleRemove = async (productId) => {
    if (!user) return;
    try {
      await toggleWishlist(user.id, productId);
      // Update local state
      setWishlistItems(wishlistItems.filter(item => item.products.id !== productId));
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    }
  };

  return (
    <div className="wishlist-page">
      <Helmet>
        <title>My Wishlist | BludWear</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AnnouncementBar />
      <Navbar />

      <main className="wishlist-main">
        <div className="container wishlist-container">
          <div className="wishlist-header">
            <h1 className="wishlist-title">My Bludlist</h1>
            <p className="wishlist-subtitle">Save your favorite athletic gear here for quick access.</p>
          </div>

          {!user ? (
            <div className="wishlist-empty-state">
              <div className="empty-icon">🔒</div>
              <h2>Sign In Required</h2>
              <p>Please sign in to view and manage your wishlisted items.</p>
              <Link to="/login" className="wishlist-btn-primary">Sign In</Link>
            </div>
          ) : loading ? (
            <div className="wishlist-loading">Loading your Bludlist...</div>
          ) : wishlistItems.length === 0 ? (
            <div className="wishlist-empty-state">
              <div className="empty-icon">🖤</div>
              <h2>Your Bludlist is Empty</h2>
              <p>Explore the legacy collection and tap the heart icon to save products.</p>
              <Link to="/collection" className="wishlist-btn-primary">Explore Collection</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlistItems.map((item) => {
                const product = item.products;
                const image = getProductImages(product)[0] || '/placeholder.png';
                const slug = createProductSlug(product);

                return (
                  <div key={item.id} className="wishlist-card">
                    <div className="wishlist-img-wrapper">
                      <img src={image} alt={product.name} />
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(product.id)}
                        title="Remove from Wishlist"
                        aria-label="Remove from Wishlist"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="wishlist-details">
                      <h3 className="wishlist-name">{product.name}</h3>
                      <div className="wishlist-price" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        {product.original_price && (
                          <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.9rem', fontWeight: '400' }}>
                            {formatPrice(product.original_price)}
                          </span>
                        )}
                        <span style={{ color: 'var(--color-blood-light)', fontWeight: '600' }}>
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      <Link to={`/products/${slug}`} className="view-product-btn">
                        View Product Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default WishlistPage;

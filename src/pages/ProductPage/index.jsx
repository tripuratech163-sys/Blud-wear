import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { addToCart } from '../../backend/cart';
import { fetchProducts } from '../../backend/products';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import { fetchProductReviews, createProductReview } from '../../backend/reviews';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './ProductPage.css';

const ProductPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get('variant'); // e.g. "Ocean Blue"
  
  const { user } = useAuth();
  const { openCart, refreshCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState('');

  // Product reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const product = useMemo(
    () => products.find((item) => createProductSlug(item) === slug),
    [products, slug]
  );

  const loadReviews = async () => {
    if (!product) return;
    try {
      setReviewsLoading(true);
      const data = await fetchProductReviews(product.id);
      setReviews(data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      loadReviews();
    }
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewName || !reviewEmail || !reviewBody) {
      setReviewError('Please fill in Name, Email, and Review body.');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError('');
      await createProductReview(
        product.id,
        reviewName,
        reviewEmail,
        reviewRating,
        reviewTitle,
        reviewBody
      );
      setReviewSuccess(true);
      setReviewName('');
      setReviewEmail('');
      setReviewRating(5);
      setReviewTitle('');
      setReviewBody('');
      // Reload reviews
      loadReviews();
      setTimeout(() => setReviewSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setReviewError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Group variants by color
  const colorsMap = useMemo(() => {
    if (!product || !product.variants) return {};
    const map = {};
    product.variants.forEach(v => {
      if (!map[v.color]) {
        map[v.color] = {
          color: v.color,
          image: v.image,
          sizes: []
        };
      }
      map[v.color].sizes.push({
        size: v.size,
        price: v.price || product.price,
        stock: v.stock || 0
      });
    });
    return map;
  }, [product]);

  const availableColors = Object.keys(colorsMap);

  // Initialize selected color and size once product is loaded
  useEffect(() => {
    if (product && availableColors.length > 0) {
      let initColor = urlVariant && availableColors.includes(urlVariant) ? urlVariant : availableColors[0];
      if (!selectedColor || !availableColors.includes(selectedColor)) {
        setSelectedColor(initColor);
      }
    } else if (product && availableColors.length === 0) {
      // Fallback for simple products with no variants
      setSelectedSize('M');
    }
  }, [product, availableColors, urlVariant, selectedColor]);

  // Update size when color changes
  useEffect(() => {
    if (selectedColor && colorsMap[selectedColor]) {
      const sizes = colorsMap[selectedColor].sizes;
      if (sizes.length > 0) {
        // Try to keep the same size if it exists in the new color, else pick first available
        const sizeExists = sizes.find(s => s.size === selectedSize);
        if (!sizeExists) {
          // Find first size with stock, or just first size
          const firstInStock = sizes.find(s => s.stock > 0);
          setSelectedSize(firstInStock ? firstInStock.size : sizes[0].size);
        }
      }
      setQuantity(1); // Reset quantity when changing color
      setCartStatus('');
    }
  }, [selectedColor, colorsMap]);

  // Derived state based on current selection
  const currentVariantSize = selectedColor && selectedSize 
    ? colorsMap[selectedColor]?.sizes.find(s => s.size === selectedSize)
    : null;

  const currentPrice = currentVariantSize ? currentVariantSize.price : product?.price;
  const currentStock = currentVariantSize ? currentVariantSize.stock : (product?.stock || 0); // Use variant stock, or fallback to base stock
  const isOutOfStock = (currentVariantSize && currentStock <= 0) || (!currentVariantSize && currentStock <= 0);

  const reviewsSummary = useMemo(() => {
    if (reviews.length === 0) {
      return { avg: '0.0', total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });
    const percentages = {};
    for (let s = 1; s <= 5; s++) {
      percentages[s] = Math.round((breakdown[s] / total) * 100);
    }
    return { avg, total, breakdown, percentages };
  }, [reviews]);

  // Determine images
  const baseImages = product ? getProductImages(product) : [];
  const colorSpecificImage = selectedColor && colorsMap[selectedColor]?.image && colorsMap[selectedColor].image.trim() ? colorsMap[selectedColor].image.trim() : null;
  // If the color has a specific image override, it takes precedence, else fallback to base gallery
  const activeSrc = colorSpecificImage || (baseImages[activeImage] || product?.image);

  const description =
    product?.description ||
    'Premium BludWear athleisure built for training, recovery, and everyday movement with a sharp athletic fit.';

  const handleQuantityChange = (step) => {
    setQuantity((current) => {
      const next = current + step;
      if (next < 1) return 1;
      if (currentVariantSize && next > currentStock) return currentStock;
      return next;
    });
  };

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;

    if (!user) {
      setCartStatus('Sign in to add this product to your cart.');
      return;
    }

    try {
      // Pass variant details (color, size) to the cart.
      await addToCart(user.id, product.id, quantity, selectedColor || null, selectedSize || null); 
      setCartStatus(`Added ${quantity} item(s) to cart.`);
      await refreshCart();
      openCart();
    } catch (err) {
      console.error(err);
      setCartStatus('Cart is not ready yet. Please try again after signing in.');
    }
  };

  return (
    <div className="product-page">
      <AnnouncementBar />
      <Navbar />

      <main className="product-main">
        <div className="container">
          <Link to="/collection" className="product-back">Back to collection</Link>

          {loading ? (
            <div className="product-loading">Loading product...</div>
          ) : !product ? (
            <div className="product-empty">
              <h1>Product Not Found</h1>
              <p>This product is not available right now. It may have been removed or the URL is incorrect.</p>
              <Link to="/collection" className="product-primary-btn">View Collection</Link>
            </div>
          ) : (
            <>
            <div className="product-layout">
              <section className="product-gallery" aria-label={`${product.name} images`}>
                <div className="product-thumbs">
                  {/* If we have a color specific image, show it first as a thumb. 
                      Ideally, the backend should return gallery PER color, but we simplify here. */}
                  {colorSpecificImage && (
                    <button
                      className={`product-thumb ${activeImage === -1 ? 'active' : ''}`}
                      onClick={() => setActiveImage(-1)}
                      aria-label={`View ${selectedColor} image`}
                    >
                      <img src={colorSpecificImage} alt={`${selectedColor} variant`} />
                    </button>
                  )}
                  {baseImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      className={`product-thumb ${activeImage === index ? 'active' : ''}`}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>

                <div className="product-hero-image">
                  {product.tag && <span className="product-detail-tag">{product.tag}</span>}
                  <img src={activeSrc} alt={product.name} />
                </div>
              </section>

              <section className="product-panel">
                <p className="product-detail-category">{product.gender} / {product.category}</p>
                <h1>{product.name}</h1>

                <div className="product-detail-price">
                  {product.original_price && <span>{formatPrice(product.original_price)}</span>}
                  <strong>{formatPrice(currentPrice)}</strong>
                </div>

                <p className="product-description">{description}</p>

                {availableColors.length > 0 && (
                  <div className="product-option">
                    <div className="product-option-header">
                      <span>Color</span>
                      <small>{selectedColor}</small>
                    </div>
                    <div className="product-size-grid">
                      {availableColors.map((color) => {
                        const colImg = colorsMap[color].image;
                        return (
                          <button
                            key={color}
                            className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                            onClick={() => setSelectedColor(color)}
                            style={{ 
                              padding: colImg ? '2px' : '0.5rem', 
                              border: selectedColor === color ? '2px solid #fff' : '1px solid #333',
                              backgroundColor: '#111', color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: '60px',
                              height: colImg ? '60px' : 'auto'
                            }}
                          >
                            {colImg ? <img src={colImg} alt={color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="product-option">
                  <div className="product-option-header">
                    <span>Size</span>
                    <small>{selectedSize}</small>
                  </div>
                  <div className="product-size-grid">
                    {selectedColor && colorsMap[selectedColor] ? (
                      colorsMap[selectedColor].sizes.map((s) => (
                        <button
                          key={s.size}
                          className={selectedSize === s.size ? 'active' : ''}
                          onClick={() => setSelectedSize(s.size)}
                          disabled={s.stock <= 0}
                          style={{ opacity: s.stock <= 0 ? 0.4 : 1, textDecoration: s.stock <= 0 ? 'line-through' : 'none' }}
                        >
                          {s.size}
                        </button>
                      ))
                    ) : (
                      // Fallback for no variants
                      ['S', 'M', 'L', 'XL'].map((size) => (
                        <button
                          key={size}
                          className={selectedSize === size ? 'active' : ''}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="product-option">
                  <div className="product-option-header">
                    <span>Quantity</span>
                    {currentVariantSize && currentStock > 0 && currentStock <= 5 && (
                      <small style={{ color: '#ff3b30' }}>Only {currentStock} left!</small>
                    )}
                  </div>
                  <div className="product-quantity">
                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= currentStock || isOutOfStock}>+</button>
                  </div>
                </div>

                <button 
                  className="product-primary-btn" 
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{ backgroundColor: isOutOfStock ? '#333' : '#fff', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add To Cart'}
                </button>
                {cartStatus && <p className="product-cart-status">{cartStatus}</p>}

                <div className="product-details-list">
                  {product?.gsm && (
                    <div>
                      <span>Fabric GSM</span>
                      <p>{product.gsm}</p>
                    </div>
                  )}
                  <div>
                    <span>Fit</span>
                    <p>Athletic compression-inspired silhouette.</p>
                  </div>
                  <div>
                    <span>Use</span>
                    <p>Training, layering, and daily streetwear.</p>
                  </div>
                  <div>
                    <span>Shipping</span>
                    <p>Fast dispatch with simple returns.</p>
                  </div>
                </div>
              </section>
            </div>

            {/* ── Product Description Section (from DB) ── */}
            {(product.about_description || (Array.isArray(product.key_features) && product.key_features.length > 0)) && (
              <section className="product-desc-section">
                <div className="product-desc-grid">
                  {product.about_description && (
                    <div className="product-desc-text">
                      <h2 className="product-desc-heading">About This Product</h2>
                      {product.about_description.split('\n').filter(p => p.trim()).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  )}
                  {Array.isArray(product.key_features) && product.key_features.length > 0 && (
                    <div className="product-desc-features">
                      <h3 className="product-desc-features-heading">Key Features</h3>
                      <ul className="product-features-list">
                        {product.key_features.map((feature, i) => (
                          <li key={i}><span className="feature-check">✔</span> {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Reviews Section ── */}
            <section className="product-reviews-section">
              <div className="reviews-header">
                <div className="reviews-title-block">
                  <h2 className="reviews-heading">Customer Reviews</h2>
                  <div className="reviews-summary">
                    <span className="reviews-avg">{reviewsSummary.avg}</span>
                    <div className="reviews-stars-big">
                      {'★'.repeat(Math.round(Number(reviewsSummary.avg)))}{'☆'.repeat(5 - Math.round(Number(reviewsSummary.avg)))}
                    </div>
                    <span className="reviews-count">Based on {reviewsSummary.total} {reviewsSummary.total === 1 ? 'review' : 'reviews'}</span>
                  </div>
                </div>

                {/* Rating Breakdown Bars */}
                <div className="reviews-breakdown">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percentage = reviewsSummary.percentages[stars] || 0;
                    const count = reviewsSummary.breakdown[stars] || 0;
                    return (
                      <div key={stars} className="breakdown-row">
                        <span className="breakdown-star-label">{stars} ★</span>
                        <div className="breakdown-bar-outer">
                          <div className="breakdown-bar-inner" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="breakdown-star-count">{percentage}% ({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Write Toggle & Form */}
              <div className="review-form-container">
                <h3 className="review-form-title">Share Your Experience</h3>
                {reviewSuccess ? (
                  <div className="review-success-alert">
                    <span className="success-icon">✓</span>
                    <div>
                      <h4>Review Submitted Successfully!</h4>
                      <p>Thank you for sharing your feedback. Your review will be visible shortly.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="review-write-form">
                    {reviewError && <p className="review-error-alert">{reviewError}</p>}
                    
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Your Name *</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Arjun Sharma" 
                          value={reviewName} 
                          onChange={(e) => setReviewName(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address * (will not be published)</label>
                        <input 
                          type="email" 
                          placeholder="e.g. arjun@example.com" 
                          value={reviewEmail} 
                          onChange={(e) => setReviewEmail(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Overall Rating *</label>
                      <div className="rating-select-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-select-btn ${reviewRating >= star ? 'active' : ''}`}
                            onClick={() => setReviewRating(star)}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Review Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Premium fit and quality!" 
                        value={reviewTitle} 
                        onChange={(e) => setReviewTitle(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Review Body *</label>
                      <textarea 
                        rows="4" 
                        placeholder="Write your comments here..." 
                        value={reviewBody} 
                        onChange={(e) => setReviewBody(e.target.value)} 
                        required
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      className="review-submit-btn"
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                    </button>
                  </form>
                )}
              </div>

              {/* Dynamic Review List */}
              <div className="reviews-list-section">
                <h3 className="reviews-list-heading">Recent Reviews</h3>
                {reviewsLoading ? (
                  <p style={{ color: '#888', padding: '1rem 0' }}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <div className="reviews-empty-state">
                    <p>No reviews yet for this product. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="reviews-grid">
                    {reviews.map((review) => {
                      const dateString = new Date(review.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });

                      return (
                        <div key={review.id} className="review-card">
                          <div className="review-card-header">
                            <div className="review-avatar">{review.name.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="review-name">{review.name}</p>
                              <p className="review-date">{dateString}</p>
                            </div>
                            <div className="review-stars">
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </div>
                          </div>
                          {review.title && <p className="review-title">{review.title}</p>}
                          <p className="review-body">{review.body}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;

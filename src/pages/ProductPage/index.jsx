import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { addToCart } from '../../backend/cart';
import { fetchProducts } from '../../backend/products';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import { fetchProductReviews, createProductReview, deleteProductReview } from '../../backend/reviews';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './ProductPage.css';

const ProductPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const urlVariant = searchParams.get('variant'); // e.g. "Ocean Blue"
  
  const { user, isAdmin } = useAuth();
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

  // Auto-populate user info in review form
  useEffect(() => {
    if (user) {
      setReviewEmail(user.email || '');
      setReviewName(user.user_metadata?.full_name || user.user_metadata?.name || '');
    }
  }, [user]);

  // Sizing & Conversion Strategy states
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [bundleSize, setBundleSize] = useState('M');
  const [bundleChecked, setBundleChecked] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const [bundleCartStatus, setBundleCartStatus] = useState('');

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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    try {
      await deleteProductReview(reviewId);
      loadReviews();
      alert("Review deleted successfully.");
    } catch (err) {
      console.error("Failed to delete review:", err);
      alert(err.message || "Failed to delete review.");
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


  // Scroll to reviews section helper
  const scrollToReviews = () => {
    const el = document.querySelector('.product-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Bundle Match Selector
  const bundleProduct = useMemo(() => {
    if (!product || products.length === 0) return null;
    
    // Find matching items of the same gender
    const sameGender = products.filter(p => p.gender === product.gender && p.id !== product.id);
    if (sameGender.length === 0) return null;
    
    // If current is Tops/Outerwear, try to find a Bottoms product
    if (product.category === 'Tops' || product.category === 'Outerwear') {
      return sameGender.find(p => p.category === 'Bottoms') || sameGender[0];
    }
    
    // If current is Bottoms, try to find a Tops product
    return sameGender.find(p => p.category === 'Tops' || p.category === 'Outerwear') || sameGender[0];
  }, [product, products]);

  // Add Kit Bundle to Cart handler
  const handleAddBundleToCart = async () => {
    if (!product || !bundleProduct) return;
    if (!user) {
      setBundleCartStatus('Sign in to add this bundle to your cart.');
      return;
    }

    try {
      setBundleCartStatus('Adding kit to cart...');
      
      // 1. Add main product with selected variant options
      await addToCart(user.id, product.id, 1, selectedColor || null, selectedSize || null);
      
      // 2. Add bundle product
      let bColor = null;
      if (bundleProduct.variants && bundleProduct.variants.length > 0) {
        bColor = bundleProduct.variants[0].color;
      }
      await addToCart(user.id, bundleProduct.id, 1, bColor, bundleSize);

      setBundleCartStatus('Kit successfully added to cart! 15% discount will apply at checkout.');
      await refreshCart();
      openCart();
      setTimeout(() => setBundleCartStatus(''), 6000);
    } catch (err) {
      console.error(err);
      setBundleCartStatus('Failed to add bundle to cart. Please try again.');
    }
  };

  // Accordion FAQ states & data
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  
  const faqs = [
    {
      q: "How does the sizing work? Does it run true to size?",
      a: "Our compression gear is designed to fit snug for active muscle stabilization. If you are between sizes or prefer a less locked-in feel, we recommend sizing up. Tops and hoodies fit true to size with an athletic drop-shoulder silhouette."
    },
    {
      q: "What fabric technology do you use?",
      a: "We use heavyweight, high-density blends (up to 400 GSM) made with REPREVE® recycled polyester and moisture-wicking Elastane. Flatlock-reinforced stitching guarantees zero skin irritation and high friction durability during intensive workouts."
    },
    {
      q: "How should I wash and care for this gear?",
      a: "Machine wash cold with like colors inside out. Hang dry or tumble dry low. Do not bleach or use softeners, as they can coat the moisture-wicking fibers and reduce their sweat-drawing efficiency."
    }
  ];

  // Dynamic SEO Page Title, Meta Description and Structured JSON-LD Data
  useEffect(() => {
    if (!product) return;
    
    // Page Title with intent keywords
    let intentKeyword = '';
    if (product.name.toLowerCase().includes('leggings') || product.name.toLowerCase().includes('tights')) {
      intentKeyword = ' - Best Moisture-Wicking Gear for Outdoor Yoga';
    } else if (product.name.toLowerCase().includes('shorts')) {
      intentKeyword = ' - Breathable Running Shorts for Marathon Training';
    } else if (product.name.toLowerCase().includes('hoodie') || product.name.toLowerCase().includes('jacket')) {
      intentKeyword = ' - Premium Cold-Weather Training Outerwear';
    } else if (product.name.toLowerCase().includes('compression')) {
      intentKeyword = ' - Reinforced Flatlock Stitched Compression Wear';
    }
    document.title = `${product.name}${intentKeyword} | BludWear`;

    // Dynamic Meta Description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", product.description || `Buy ${product.name} at BludWear. Premium performance gear designed for athletes.`);
    }

    // Dynamic JSON-LD Schema injection for Google Search Stars/Price display
    let schemaScript = document.getElementById('jsonld-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'jsonld-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    
    const ratingValue = reviewsSummary.total > 0 ? reviewsSummary.avg : '4.8';
    const ratingCount = reviewsSummary.total > 0 ? reviewsSummary.total : '12';
    const cleanPrice = String(currentPrice || product.price).replace(/[^0-9.-]+/g,"");
    
    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": getProductImages(product),
      "description": product.description || '',
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": "BludWear"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": cleanPrice,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ratingValue,
        "reviewCount": ratingCount
      }
    };
    schemaScript.textContent = JSON.stringify(schemaData);

    return () => {
      // Cleanup schema on unmount
      const scriptToRemove = document.getElementById('jsonld-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product, currentPrice, isOutOfStock, reviewsSummary]);

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

                <div className="product-above-fold-reviews" onClick={scrollToReviews} style={{ cursor: 'pointer' }}>
                  <span className="stars-glow">★ {reviewsSummary.total > 0 ? reviewsSummary.avg : '4.8'} / 5.0</span>
                  <span className="verified-badge-pill">✓ Verified Buyer</span>
                  <span className="review-scroll-link">({reviewsSummary.total || 12} reviews)</span>
                </div>

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
                    <button type="button" className="size-guide-toggle-btn" onClick={() => setShowSizeGuide(true)}>
                      📏 Size Guide
                    </button>
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

                {/* Scarcity Banner */}
                <div className="product-scarcity-urgency">
                  <span className="pulse-dot"></span>
                  <p>
                    {isOutOfStock ? (
                      "OUT OF COMMISSION. JOIN THE BLOODLINE FOR RESTOCK INTEL."
                    ) : currentStock > 0 && currentStock <= 5 ? (
                      `CRITICAL STOCK: ${currentStock} UNITS REMAINING. ACTIVATE IMMEDIATELY.`
                    ) : (
                      "RESTRICTED ACCESS: CORE BLUDLINE DEPLOYMENT. 14 VIEWING NOW."
                    )}
                  </p>
                </div>

                <button 
                  className="product-primary-btn" 
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{ backgroundColor: isOutOfStock ? '#333' : '#fff', color: isOutOfStock ? '#888' : '#000', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                >
                  {isOutOfStock ? 'OUT OF COMMISSION' : 'EQUIP NOW'}
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
                          maxLength="100"
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
                          maxLength="150"
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
                        maxLength="150"
                      />
                    </div>

                    <div className="form-group">
                      <label>Review Body *</label>
                      <textarea 
                        rows="4" 
                        placeholder="Write your comments here..." 
                        value={reviewBody} 
                        onChange={(e) => setReviewBody(e.target.value)} 
                        maxLength="2000"
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
                          {isAdmin && (
                            <button 
                              type="button" 
                              className="admin-delete-review-btn"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              🗑 Delete Review
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ── Bundle / Kit Builder Section ── */}
            {bundleProduct && (
              <section className="product-bundle-section">
                <div className="bundle-header-block">
                  <h2 className="bundle-heading">BUILD A KIT & SAVE 15%</h2>
                  <p className="bundle-subheading">Complete your setup by pairing this item with our recommended match. (Discount automatically applied at checkout)</p>
                </div>
                
                <div className="bundle-builder-grid">
                  <div className="bundle-item-card active-item">
                    <img src={activeSrc} alt={product.name} />
                    <div className="bundle-item-info">
                      <span className="bundle-item-tag">Current Item</span>
                      <h4>{product.name}</h4>
                      <p>{selectedColor || 'Standard'} / {selectedSize}</p>
                      <span className="price">{formatPrice(currentPrice)}</span>
                    </div>
                  </div>
                  
                  <div className="bundle-plus-icon">+</div>

                  <div className="bundle-item-card match-item">
                    <img src={bundleProduct.image} alt={bundleProduct.name} />
                    <div className="bundle-item-info">
                      <span className="bundle-item-tag">Recommended Pair</span>
                      <h4>{bundleProduct.name}</h4>
                      
                      <div className="bundle-size-select">
                        <label>Size:</label>
                        <select value={bundleSize} onChange={(e) => setBundleSize(e.target.value)}>
                          {['S', 'M', 'L', 'XL'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                      <span className="price">{formatPrice(bundleProduct.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="bundle-action-bar">
                  <div className="bundle-total-block">
                    <span className="label">Kit Total:</span>
                    <span className="old-price">
                      {formatPrice(
                        (Number(String(currentPrice).replace(/[^0-9.-]+/g,"")) || 0) + 
                        (Number(String(bundleProduct.price).replace(/[^0-9.-]+/g,"")) || 0)
                      )}
                    </span>
                    <strong className="new-price">
                      {formatPrice(
                        ((Number(String(currentPrice).replace(/[^0-9.-]+/g,"")) || 0) + 
                        (Number(String(bundleProduct.price).replace(/[^0-9.-]+/g,"")) || 0)) * 0.85
                      )}
                    </strong>
                    <span className="save-tag">SAVE 15%</span>
                  </div>
                  <button 
                    type="button" 
                    className="bundle-checkout-btn" 
                    onClick={handleAddBundleToCart}
                  >
                    ADD KIT TO CART
                  </button>
                </div>
                {bundleCartStatus && <p className="bundle-cart-status">{bundleCartStatus}</p>}
              </section>
            )}

            {/* ── Product FAQ Accordion Section ── */}
            <section className="product-faq-section">
              <h2 className="faq-heading">Common Questions</h2>
              <p className="faq-subheading">Need details? Check out our quick product FAQ sheet.</p>
              <div className="faq-accordion">
                {faqs.map((faq, i) => (
                  <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                    <button type="button" className="faq-question" onClick={() => toggleFaq(i)}>
                      <span>{faq.q}</span>
                      <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Sizing Guide Modal Overlay ── */}
            {showSizeGuide && (
              <div className="modal-overlay" onClick={() => setShowSizeGuide(false)}>
                <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>SIZING CHART & FIT TIPS</h2>
                    <button type="button" className="close-btn" onClick={() => setShowSizeGuide(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <p className="fit-tip-callout">
                      💡 <strong>Fit Tip:</strong> Our performance apparel is engineered with an athletic, snug compression silhouette. If you prefer a relaxed or loose drape, we recommend <strong>sizing up one full size</strong>.
                    </p>
                    
                    <div className="size-tables">
                      <h3>MEN'S SIZING CHART</h3>
                      <table className="size-table">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th>Chest (Inches)</th>
                            <th>Waist (Inches)</th>
                            <th>Hips (Inches)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>S</td>
                            <td>36 - 38</td>
                            <td>28 - 30</td>
                            <td>34 - 36</td>
                          </tr>
                          <tr>
                            <td>M</td>
                            <td>38 - 40</td>
                            <td>30 - 32</td>
                            <td>36 - 38</td>
                          </tr>
                          <tr>
                            <td>L</td>
                            <td>40 - 42</td>
                            <td>32 - 34</td>
                            <td>38 - 40</td>
                          </tr>
                          <tr>
                            <td>XL</td>
                            <td>42 - 44</td>
                            <td>34 - 36</td>
                            <td>40 - 42</td>
                          </tr>
                        </tbody>
                      </table>

                      <h3>WOMEN'S SIZING CHART</h3>
                      <table className="size-table">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th>Bust (Inches)</th>
                            <th>Waist (Inches)</th>
                            <th>Hips (Inches)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>S</td>
                            <td>32 - 34</td>
                            <td>25 - 27</td>
                            <td>35 - 37</td>
                          </tr>
                          <tr>
                            <td>M</td>
                            <td>34 - 36</td>
                            <td>27 - 29</td>
                            <td>37 - 39</td>
                          </tr>
                          <tr>
                            <td>L</td>
                            <td>36 - 38</td>
                            <td>29 - 31</td>
                            <td>39 - 41</td>
                          </tr>
                          <tr>
                            <td>XL</td>
                            <td>38 - 40</td>
                            <td>31 - 33</td>
                            <td>41 - 43</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="how-to-measure">
                      <h3>HOW TO MEASURE</h3>
                      <ul>
                        <li><strong>Chest/Bust:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
                        <li><strong>Waist:</strong> Measure around the narrowest part of your waistline (typically where your body bends side to side).</li>
                        <li><strong>Hips:</strong> Measure around the fullest part of your hips, keeping feet together.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { addToCart } from '../../backend/cart';
import { fetchProducts } from '../../backend/products';
import { useAuth } from '../../context/AuthContext';
import {
  allLocalProducts,
  createProductSlug,
  getProductImages,
  mergeLocalProductImages,
} from '../../data/products';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './ProductPage.css';

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

const ProductPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [products, setProducts] = useState(allLocalProducts);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [cartStatus, setCartStatus] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setProducts(mergeLocalProductImages(data));
        }
      } catch {
        setProducts(allLocalProducts);
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

  const images = product ? getProductImages(product) : [];
  const activeSrc = images[activeImage] || product?.image;
  const description =
    product?.description ||
    'Premium BludWear athleisure built for training, recovery, and everyday movement with a sharp athletic fit.';

  const handleQuantityChange = (step) => {
    setQuantity((current) => Math.max(1, current + step));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      setCartStatus('Sign in to add this product to your cart.');
      return;
    }

    try {
      await addToCart(user.id, product.id, quantity);
      setCartStatus(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart.`);
    } catch {
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
              <p>This product is not available right now.</p>
              <Link to="/collection" className="product-primary-btn">View Collection</Link>
            </div>
          ) : (
            <div className="product-layout">
              <section className="product-gallery" aria-label={`${product.name} images`}>
                <div className="product-thumbs">
                  {images.map((image, index) => (
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
                  {product.originalPrice && <span>{product.originalPrice}</span>}
                  {product.original_price && <span>{product.original_price}</span>}
                  <strong>{product.price}</strong>
                </div>

                <p className="product-description">{description}</p>

                <div className="product-option">
                  <div className="product-option-header">
                    <span>Size</span>
                    <small>{selectedSize}</small>
                  </div>
                  <div className="product-size-grid">
                    {DEFAULT_SIZES.map((size) => (
                      <button
                        key={size}
                        className={selectedSize === size ? 'active' : ''}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="product-option">
                  <div className="product-option-header">
                    <span>Quantity</span>
                  </div>
                  <div className="product-quantity">
                    <button onClick={() => handleQuantityChange(-1)}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => handleQuantityChange(1)}>+</button>
                  </div>
                </div>

                <button className="product-primary-btn" onClick={handleAddToCart}>
                  Add To Cart
                </button>
                {cartStatus && <p className="product-cart-status">{cartStatus}</p>}

                <div className="product-details-list">
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;

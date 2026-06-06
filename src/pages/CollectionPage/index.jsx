import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  mensProducts,
  womensProducts,
  createProductSlug,
  mergeLocalProductImages,
} from '../../data/products';
import { fetchProducts } from '../../backend/products';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './CollectionPage.css';

const ProductCard = ({ product }) => (
  <Link to={`/products/${createProductSlug(product)}`} className="col-product-card">
    <div className="col-image-container">
      {product.tag && <span className="col-product-tag">{product.tag}</span>}
      <img src={product.image} alt={product.name} className="col-product-image" />
      <div className="col-product-overlay">
        <span className="col-add-to-cart">View Product</span>
      </div>
    </div>
    <div className="col-product-info">
      <span className="col-product-category">{product.category}</span>
      <h3 className="col-product-name">{product.name}</h3>
      <p className="col-product-price">{product.price}</p>
    </div>
  </Link>
);

const LOCAL_FALLBACK = {
  men: mensProducts,
  women: womensProducts,
};

const CollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeTab, setActiveTab] = useState(categoryParam || 'all');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen for URL query param changes
  useEffect(() => {
    if (categoryParam === 'men' || categoryParam === 'women') {
      setActiveTab(categoryParam);
    } else {
      setActiveTab('all');
    }
  }, [categoryParam]);

  // Fetch products (from Supabase if configured, else local fallback)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setAllProducts(mergeLocalProductImages(data));
        } else {
          // Supabase returned empty — use local data
          setAllProducts([...mensProducts, ...womensProducts]);
        }
      } catch {
        // Supabase not configured yet — use local data
        setAllProducts([...mensProducts, ...womensProducts]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // Remove the category lock if they interact with tabs manually
    if (categoryParam) {
      setSearchParams({});
    }
  };

  const currentProducts = allProducts.length > 0 
    ? allProducts 
    : [...LOCAL_FALLBACK.men, ...LOCAL_FALLBACK.women];

  const tabProducts = activeTab === 'all' 
    ? currentProducts 
    : currentProducts.filter(p => p.gender === activeTab);

  const tabLabel = activeTab === 'men' 
    ? "Men's Collection" 
    : activeTab === 'women' 
      ? "Women's Collection" 
      : "All Products";

  return (
    <div className="col-page">
      <AnnouncementBar />
      <Navbar />

      <main className="col-main">
        {/* Page Header */}
        <div className="col-header">
          <div className="col-header-bg">
            <img src="/marquee_bg.png" alt="Collection Background" />
            <div className="col-header-overlay"></div>
          </div>
          <div className="col-header-content">
            <h1 className="col-title">
              <span className="col-title-outline">THE</span> COLLECTION
            </h1>
            <p className="col-subtitle">Engineered for performance. Built for style.</p>
          </div>
        </div>

        {/* Gender Tabs - Hidden if a specific category is locked from the navbar */}
        <div className="container">
          {!categoryParam && (
            <div className="col-tabs">
              <button
                className={`col-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabClick('all')}
              >
                All
              </button>
              <button
                className={`col-tab ${activeTab === 'men' ? 'active' : ''}`}
                onClick={() => handleTabClick('men')}
              >
                Men
              </button>
              <button
                className={`col-tab ${activeTab === 'women' ? 'active' : ''}`}
                onClick={() => handleTabClick('women')}
              >
                Women
              </button>
            </div>
          )}

          {/* Tab Label + Count */}
          <div className="col-results-bar">
            <span className="col-results-label">{tabLabel}</span>
            <span className="col-results-count">
              {loading ? 'Loading...' : `${tabProducts.length} Products`}
            </span>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="col-loading">
              <div className="col-spinner"></div>
              <p>Loading collection...</p>
            </div>
          ) : (
            <div className="col-grid">
              {tabProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CollectionPage;

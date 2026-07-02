import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { fetchProducts } from '../../backend/products';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './CollectionPage.css';

const ProductCard = ({ product, colorVariant }) => {
  const baseImage = getProductImages(product)[0] || '/placeholder.png';
  
  // Determine if we should show a variant-specific card
  const title = colorVariant ? `${product.name} - ${colorVariant.color}` : product.name;
  const image = colorVariant && colorVariant.image && colorVariant.image.trim() ? colorVariant.image.trim() : baseImage;
  const price = colorVariant && colorVariant.price ? colorVariant.price : product.price;
  
  const linkUrl = colorVariant 
    ? `/products/${createProductSlug(product)}?variant=${encodeURIComponent(colorVariant.color)}`
    : `/products/${createProductSlug(product)}`;

  return (
    <Link to={linkUrl} className="col-product-card">
      <div className="col-image-container">
        {product.tag && <span className="col-product-tag">{product.tag}</span>}
        <img src={image} alt={title} className="col-product-image" loading="lazy" decoding="async" />
        <div className="col-product-overlay">
          <span className="col-add-to-cart">View Product</span>
        </div>
      </div>
      <div className="col-product-info">
        <span className="col-product-category">{product.category}</span>
        <h3 className="col-product-name">{title}</h3>
        <div className="col-product-price-row">
          {product.original_price && (
            <span className="col-product-original-price">{formatPrice(product.original_price)}</span>
          )}
          <span className="col-product-price">{formatPrice(price)}</span>
        </div>
      </div>
    </Link>
  );
};

const CollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = categoryParam === 'men' || categoryParam === 'women' ? categoryParam : 'all';

  // Fetch products exclusively from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleTabClick = (tab) => {
    if (tab === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: tab });
    }
  };

  const tabProducts = activeTab === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.gender === activeTab);

  // Flatten products by color variants so each color shows up as its own card
  const flattenedProducts = useMemo(() => {
    const list = [];
    tabProducts.forEach(product => {
      if (!product.variants || product.variants.length === 0) {
        // No variants, just push the standard product
        list.push({ product, colorVariant: null, key: product.id });
      } else {
        // Group by unique color
        const colorMap = {};
        product.variants.forEach(v => {
          if (!colorMap[v.color]) {
            colorMap[v.color] = {
              color: v.color,
              image: v.image,
              price: v.price
            };
          } else {
            // Keep the first variant's image/price for this color if already seen
            if (!colorMap[v.color].image && v.image) colorMap[v.color].image = v.image;
            if (!colorMap[v.color].price && v.price) colorMap[v.color].price = v.price;
          }
        });
        
        Object.values(colorMap).forEach(colorData => {
          list.push({
            product,
            colorVariant: colorData,
            key: `${product.id}-${colorData.color}`
          });
        });
      }
    });
    return list;
  }, [tabProducts]);

  const tabLabel = activeTab === 'men' 
    ? "Men's Collection" 
    : activeTab === 'women' 
      ? "Women's Collection" 
      : "All Products";

  // Dynamic SEO Title, Meta Description and ItemList JSON-LD Schema
  useEffect(() => {
    // Dynamic JSON-LD ItemList Schema
    if (flattenedProducts.length === 0) return;

    let schemaScript = document.getElementById('jsonld-collection-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'jsonld-collection-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    const itemListElement = flattenedProducts.map((item, index) => {
      const baseImage = getProductImages(item.product)[0] || '/placeholder.png';
      const title = item.colorVariant ? `${item.product.name} - ${item.colorVariant.color}` : item.product.name;
      const image = item.colorVariant && item.colorVariant.image && item.colorVariant.image.trim() ? item.colorVariant.image.trim() : baseImage;
      const price = item.colorVariant && item.colorVariant.price ? item.colorVariant.price : item.product.price;
      const url = `${window.location.origin}/products/${createProductSlug(item.product)}${item.colorVariant ? `?variant=${encodeURIComponent(item.colorVariant.color)}` : ''}`;
      const cleanPrice = String(price).replace(/[^0-9.-]+/g,"");

      return {
        "@type": "ListItem",
        "position": index + 1,
        "name": title,
        "url": url,
        "image": image,
        "offers": {
          "@type": "Offer",
          "price": cleanPrice,
          "priceCurrency": "INR",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock"
        }
      };
    });

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": tabLabel,
      "numberOfItems": flattenedProducts.length,
      "itemListElement": itemListElement
    };

    schemaScript.textContent = JSON.stringify(schemaData);

    return () => {
      // Cleanup schema on unmount
      const scriptToRemove = document.getElementById('jsonld-collection-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [flattenedProducts, tabLabel]);

  return (
    <div className="col-page">
      <Helmet>
        <title>{`${tabLabel} | BludWear Athleisure`}</title>
        <meta name="description" content={`Explore the BludWear ${tabLabel}. Premium luxury athleisure engineered for performance and styled with industrial aesthetics.`} />
        <link rel="canonical" href={`https://www.bludwear.com/collection${categoryParam ? `?category=${categoryParam}` : ''}`} />
      </Helmet>
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
              {loading ? 'Loading...' : `${flattenedProducts.length} Items`}
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
              {flattenedProducts.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', width: '100%', color: '#888' }}>
                  No products found. Please add products via the Admin Panel.
                </div>
              ) : (
                flattenedProducts.map(item => (
                  <ProductCard key={item.key} product={item.product} colorVariant={item.colorVariant} />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CollectionPage;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../backend/products';
import { createProductSlug, getProductImages, formatPrice } from '../../utils/helpers';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          // Filter products by gender
          const men = data.filter(p => p.gender?.toLowerCase() === 'men');
          const women = data.filter(p => p.gender?.toLowerCase() === 'women');
          
          // Interleave them: 1 men, 1 women, 1 men, 1 women...
          const alternating = [];
          const maxLen = Math.max(men.length, women.length);
          for (let i = 0; i < maxLen; i++) {
            if (men[i]) alternating.push(men[i]);
            if (women[i]) alternating.push(women[i]);
          }
          
          // Show first 4 as "Forged Innovations"
          setProducts(alternating.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading) {
    return (
      <section id="collection" className="featured-products">
        <div className="container" style={{ textAlign: 'center', padding: '4rem 0', color: '#fff' }}>
          Loading products...
        </div>
      </section>
    );
  }

  return (
    <section id="collection" className="featured-products">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">FORGED INNOVATIONS</h2>
          <Link to="/collection" className="view-all">View All &rarr;</Link>
        </div>

        <div className="product-grid">
          {products.map(product => {
            const productImage = getProductImages(product)[0] || '/placeholder.png';

            return (
              <Link
                key={product.id}
                to={`/products/${createProductSlug(product)}`}
                className="product-card"
              >
                <div className="product-image-container">
                  {product.tag && (
                    <span className="product-tag">{product.tag}</span>
                  )}
                  <img src={productImage} alt={product.name} className="product-image" loading="lazy" decoding="async" />
                  <div className="product-overlay">
                    <span className="add-to-cart">ACQUIRE GEAR</span>
                  </div>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">
                    {product.original_price && (
                      <span className="product-original-price">{formatPrice(product.original_price)}</span>
                    )}
                    <span className="product-current-price">{formatPrice(product.price)}</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;

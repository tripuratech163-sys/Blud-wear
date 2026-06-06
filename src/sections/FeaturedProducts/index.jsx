import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  products as localProducts,
  createProductSlug,
  mergeLocalProductImages,
} from '../../data/products';
import { fetchProducts } from '../../backend/products';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
  const [products, setProducts] = useState(localProducts); // Start with local data immediately

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
          setProducts(mergeLocalProductImages(data).slice(0, 4)); // Show first 4 as "New Arrivals"
        }
      } catch {
        // Supabase not configured — keep showing local data
      }
    };
    loadProducts();
  }, []);

  return (
    <section id="collection" className="featured-products">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/collection" className="view-all">View All &rarr;</Link>
        </div>

        <div className="product-grid">
          {products.map(product => (
            <Link
              key={product.id}
              to={`/products/${createProductSlug(product)}`}
              className="product-card"
            >
              <div className="product-image-container">
                {product.tag && (
                  <span className="product-tag">{product.tag}</span>
                )}
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-overlay">
                  <span className="add-to-cart">View Product</span>
                </div>
              </div>
              <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">
                  {product.original_price && (
                    <span className="product-original-price">{product.original_price}</span>
                  )}
                  {product.originalPrice && (
                    <span className="product-original-price">{product.originalPrice}</span>
                  )}
                  {product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;

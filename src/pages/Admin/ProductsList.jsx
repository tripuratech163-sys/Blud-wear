import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminFetchProductsList, adminDeleteProduct, adminToggleFeaturedProduct } from '../../backend/admin';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await adminFetchProductsList();
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await adminDeleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product", err);
      alert("Failed to delete product");
    }
  };

  const handleToggleFeatured = async (id, currentStatus) => {
    try {
      const updated = await adminToggleFeaturedProduct(id, !currentStatus);
      setProducts(products.map(p => p.id === id ? { ...p, is_featured: updated.is_featured } : p));
    } catch (err) {
      console.error("Failed to toggle featured status", err);
      alert("Failed to toggle featured status");
    }
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>All Products</h2>
        <Link to="/admin/products/new" className="admin-btn-primary" style={{ textDecoration: 'none' }}>
          + Add Product
        </Link>
      </div>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Gender</th>
              <th>GSM</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
              </tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image || (product.images && product.images[0]) || '/placeholder.png'} 
                      alt={product.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td style={{ fontWeight: '500' }}>{product.name}</td>
                  <td>{product.price}</td>
                  <td>{product.category}</td>
                  <td style={{ textTransform: 'capitalize' }}>{product.gender}</td>
                  <td>{product.gsm || 'N/A'}</td>
                  <td>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!product.is_featured}
                        onChange={() => handleToggleFeatured(product.id, product.is_featured)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ff3333' }}
                      />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="admin-btn-secondary"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="admin-btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsList;

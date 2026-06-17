import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminCreateProduct, adminUpdateProduct, adminFetchProductById } from '../../backend/admin';

const ProductForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    original_price: '',
    image: '',
    images: [],
    description: '',
    about_description: '',
    key_features: [],
    category: '',
    gender: 'men',
    tag: '',
    gsm: '',
    stock: 0,
    variants: []
  });

  // Key features as newline-separated text in the textarea
  const [featuresInput, setFeaturesInput] = useState('');
  
  const [imagesInput, setImagesInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await adminFetchProductById(id);
        if (product) {
          const features = Array.isArray(product.key_features) ? product.key_features : [];
          setFormData({
            name: product.name || '',
            price: product.price || '',
            original_price: product.original_price || '',
            image: product.image || '',
            images: product.images || [],
            description: product.description || '',
            about_description: product.about_description || '',
            key_features: features,
            category: product.category || '',
            gender: product.gender || 'men',
            tag: product.tag || '',
            gsm: product.gsm || '',
            stock: product.stock || 0,
            variants: product.variants || []
          });
          setImagesInput((product.images || []).join('\n'));
          setFeaturesInput(features.join('\n'));
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      loadProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { color: '', size: '', price: prev.price || '', stock: 0, image: '' }]
    }));
  };

  const removeVariant = (index) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Parse images input
      const imagesArray = imagesInput.split('\n').map(img => img.trim()).filter(img => img);
      // Parse key features input
      const featuresArray = featuresInput.split('\n').map(f => f.trim()).filter(f => f);
      
      const payload = {
        ...formData,
        images: imagesArray,
        image: formData.image || (imagesArray.length > 0 ? imagesArray[0] : ''),
        key_features: featuresArray
      };

      if (isEditing) {
        await adminUpdateProduct(id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      console.error("Failed to save product", err);
      alert("Error saving product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing && !formData.name) return <div>Loading...</div>;

  return (
    <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Product Name *</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Category *</label>
            <input 
              type="text" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g. Outerwear, Bottoms" style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Base Price *</label>
            <input 
              type="text" name="price" value={formData.price} onChange={handleChange} required placeholder="e.g. 180" style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Base Stock Quantity</label>
            <input 
              type="number" name="stock" value={formData.stock || 0} onChange={handleChange} style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Original Price (Optional)</label>
            <input 
              type="text" name="original_price" value={formData.original_price} onChange={handleChange} placeholder="e.g. 200" style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Tag (Optional)</label>
            <input type="text" name="tag" value={formData.tag} onChange={handleChange} placeholder="e.g. NEW, BESTSELLER" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>GSM (Optional)</label>
            <input type="text" name="gsm" value={formData.gsm} onChange={handleChange} placeholder="e.g. 240 GSM" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Short Description (shown next to price)</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief one-liner shown on the product panel" />
        </div>

        {/* ── About This Product Section ── */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>About This Product</h3>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Extended Description</label>
            <textarea
              name="about_description"
              value={formData.about_description}
              onChange={handleChange}
              rows="5"
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Full product description shown in the 'About This Product' section on the product page."
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Key Features (one per line)</label>
            <textarea
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              rows="7"
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder={`Premium 90% Polyester, 10% Spandex fabric blend\nCompression fit for muscle support\nMoisture-wicking and quick-dry technology`}
            />
            <small style={{ color: '#555', fontSize: '0.78rem' }}>Each line becomes one ✔ feature bullet on the product page.</small>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Main Image URL *</label>
          <input type="text" name="image" value={formData.image} onChange={handleChange} required placeholder="https://..." style={inputStyle} />
          {formData.image && (
            <img src={formData.image} alt="Preview" style={{ marginTop: '1rem', height: '100px', borderRadius: '4px' }} />
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#888' }}>Gallery Image URLs (One per line)</label>
          <textarea 
            value={imagesInput} 
            onChange={(e) => setImagesInput(e.target.value)} 
            rows="4"
            placeholder="https://...image1.jpg&#10;https://...image2.jpg"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* VARIANTS SECTION */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Product Variants (Colors & Sizes)</h3>
            <button type="button" onClick={addVariant} className="admin-btn-secondary" style={{ fontSize: '0.8rem' }}>+ Add Variant</button>
          </div>
          
          {formData.variants.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>No variants added. The base product details will be used.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formData.variants.map((variant, index) => (
              <div key={index} style={{ padding: '1rem', backgroundColor: '#000', border: '1px solid #333', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <strong>Variant {index + 1}</strong>
                  <button type="button" onClick={() => removeVariant(index)} style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer' }}>Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Color</label>
                    <input type="text" value={variant.color} onChange={(e) => handleVariantChange(index, 'color', e.target.value)} placeholder="e.g. Ocean Blue" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Size</label>
                    <input type="text" value={variant.size} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} placeholder="e.g. S, M, L" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Stock Quantity</label>
                    <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Price Override</label>
                    <input type="text" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} placeholder="Price" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Specific Image URL (Optional)</label>
                  <input type="text" value={variant.image} onChange={(e) => handleVariantChange(index, 'image', e.target.value)} placeholder="Image URL for this color" style={inputStyle} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="admin-btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#0f0f0f',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#fff',
  fontFamily: 'inherit'
};

export default ProductForm;

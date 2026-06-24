import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const CouponsList = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      setError("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const codeUpper = code.trim().toUpperCase();
      if (!codeUpper) throw new Error("Coupon code is required");
      if (!discountValue || isNaN(discountValue) || Number(discountValue) <= 0) {
        throw new Error("Valid discount value is required");
      }

      const { data, error: insertError } = await supabase
        .from('coupons')
        .insert([{
          code: codeUpper,
          discount_type: discountType,
          discount_value: Number(discountValue),
          used: false
        }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation in postgres
          throw new Error("A coupon with this code already exists.");
        }
        throw insertError;
      }

      setCoupons([data, ...coupons]);
      // Reset form
      setCode('');
      setDiscountValue('');
    } catch (err) {
      console.error("Create coupon error:", err);
      setError(err.message || "Failed to create coupon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      
      setCoupons(coupons.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete coupon error:", err);
      alert("Failed to delete coupon.");
    }
  };

  return (
    <div className="admin-products-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manage Coupons</h2>
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="admin-card" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#111', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Create New Coupon</h3>
        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>Coupon Code</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="e.g. SUMMER20" 
              style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              required 
            />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>Discount Type</label>
            <select 
              value={discountType} 
              onChange={(e) => setDiscountType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>Discount Value</label>
            <input 
              type="number" 
              value={discountValue} 
              onChange={(e) => setDiscountValue(e.target.value)} 
              placeholder="e.g. 20" 
              style={{ width: '100%', padding: '0.75rem', background: '#222', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ padding: '0.75rem 1.5rem', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', height: '42px' }}
          >
            {isSubmitting ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      </div>

      {loading ? (
        <p>Loading coupons...</p>
      ) : (
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Code</th>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Value</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Created At</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                    No coupons found. Create one above!
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>{coupon.code}</td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{coupon.discount_type}</td>
                    <td style={{ padding: '1rem' }}>
                      {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {coupon.used ? (
                        <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255, 59, 48, 0.2)', color: '#ff3b30', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Used</span>
                      ) : (
                        <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Available</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: '#888', fontSize: '0.9rem' }}>
                      {new Date(coupon.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        style={{ background: 'transparent', border: '1px solid #ff3b30', color: '#ff3b30', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponsList;

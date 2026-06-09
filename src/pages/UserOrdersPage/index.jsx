import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserOrders, cancelUserOrder, requestOrderReturn } from '../../backend/orders';
import { formatPrice, createProductSlug, getProductImages } from '../../utils/helpers';
import AnnouncementBar from '../../sections/AnnouncementBar';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './UserOrdersPage.css';

const UserOrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Return modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [returnReason, setReturnReason] = useState('Size Mismatch');
  const [returnDetails, setReturnDetails] = useState('');

  useEffect(() => {
    // If auth loading is done and there is no user, redirect or let empty-state handle it
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getUserOrders(user.id);
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrders();
    }
  }, [user, authLoading]);

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getStatusClass = (order) => {
    const status = order.shiprocket_awb ? order.shiprocket_status : order.status;
    const s = String(status || 'pending').toLowerCase();
    if (s === 'delivered') return 'status-delivered';
    if (s === 'shipped' || s === 'in_transit' || s === 'processing') return 'status-shipped';
    if (s === 'cancelled' || s === 'refunded') return 'status-cancelled';
    return 'status-pending';
  };

  const parseAddress = (addr) => {
    if (!addr) return null;
    try {
      const parsed = JSON.parse(addr);
      if (typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      // Return as single string
    }
    return { address_line_1: addr };
  };

  // Shiprocket tracking steps resolver
  const getTrackingStep = (shiprocketStatus, status) => {
    const s = String(shiprocketStatus || status || 'pending').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'out_for_delivery') return 3;
    if (s === 'shipped' || s === 'in_transit' || s === 'awb assigned') return 2;
    if (s === 'ready_to_ship' || s === 'packed' || s === 'processing') return 1;
    return 0; // Ordered
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order? This will restock the items and process a refund if paid online.")) return;
    
    try {
      const isPaid = order.payment_status === 'paid';
      const orderItems = order.order_items || [];
      await cancelUserOrder(order.id, orderItems, isPaid);
      
      // Update orders in local state
      setOrders(prev => prev.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'Cancelled',
            payment_status: isPaid ? 'Refund Pending' : 'N/A'
          };
        }
        return o;
      }));
      alert("Order cancelled successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order. Please try again later or contact support.");
    }
  };

  const handleInitiateReturn = (order) => {
    setSelectedOrderForReturn(order);
    setReturnReason('Size Mismatch');
    setReturnDetails('');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForReturn) return;

    try {
      await requestOrderReturn(selectedOrderForReturn.id, returnReason, returnDetails);
      
      // Update orders local state
      setOrders(prev => prev.map(o => {
        if (o.id === selectedOrderForReturn.id) {
          return {
            ...o,
            status: 'Return Requested',
            return_reason: returnReason,
            return_details: returnDetails
          };
        }
        return o;
      }));

      setShowReturnModal(false);
      setSelectedOrderForReturn(null);
      alert("Return request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit return request. Please try again later or contact support.");
    }
  };

  return (
    <div className="orders-page">
      <AnnouncementBar />
      <Navbar />

      <main className="orders-main">
        <div className="container orders-container">
          <div className="orders-header">
            <h1 className="orders-title">Your Orders</h1>
            <p className="orders-subtitle">Track your shipments, check order history, and view receipts.</p>
          </div>

          {!user && !authLoading ? (
            <div className="orders-empty-state">
              <div className="orders-empty-icon">🔒</div>
              <h2>Sign In Required</h2>
              <p>Please log in to your account to view your past purchases and track deliveries.</p>
              <Link to="/login?redirect=/orders" className="orders-btn-primary">SIGN IN</Link>
            </div>
          ) : loading ? (
            <div className="orders-loading">
              <div className="orders-spinner"></div>
              <p>Fetching your order history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="orders-empty-state">
              <div className="orders-empty-icon">📦</div>
              <h2>No Orders Found</h2>
              <p>It looks like you haven't placed any orders yet. Check out our latest arrivals.</p>
              <Link to="/collection" className="orders-btn-primary">EXPLORE NEW ARRIVALS</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const isExpanded = expandedOrders[order.id];
                const itemsCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                const addressObj = parseAddress(order.shipping_address);
                const trackingStep = getTrackingStep(order.shiprocket_awb ? order.shiprocket_status : null, order.status);
                const statusDisplay = order.shiprocket_awb ? order.shiprocket_status : order.status;

                return (
                  <div key={order.id} className={`order-card-wrapper ${isExpanded ? 'expanded' : ''}`}>
                    {/* Card Header Section */}
                    <div className="order-card-header" onClick={() => toggleExpand(order.id)}>
                      <div className="header-meta-group">
                        <div className="meta-item">
                          <span>ORDER PLACED</span>
                          <p>{formattedDate}</p>
                        </div>
                        <div className="meta-item">
                          <span>TOTAL VALUE</span>
                          <p className="total-highlight">{formatPrice(order.total_amount)}</p>
                        </div>
                        <div className="meta-item hide-mobile">
                          <span>ORDER ID</span>
                          <p className="id-code" title={order.id}>{order.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                      
                      <div className="header-status-group">
                        <span className={`status-badge ${getStatusClass(order)}`}>
                          {statusDisplay}
                        </span>
                        <button className="expand-chevron-btn" aria-label="Toggle Details">
                          {isExpanded ? '▲ Hide Details' : '▼ View Details'}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Details Section */}
                    {isExpanded && (
                      <div className="order-card-details">
                        {/* 1. Tracking Timeline if Shiprocket tracking is active */}
                        {order.shiprocket_awb && (
                          <div className="tracking-timeline-section">
                            <h3 className="details-subheading">Delivery Progress</h3>
                            <div className="tracking-meta">
                              <span>AWB Number: <strong>{order.shiprocket_awb}</strong></span>
                              <span>Courier Status: <strong>{order.shiprocket_status}</strong></span>
                            </div>
                            
                            <div className="timeline-progress-bar">
                              <div className="timeline-line">
                                <div 
                                  className="timeline-line-fill" 
                                  style={{ width: `${(trackingStep / 4) * 100}%` }}
                                ></div>
                              </div>
                              <div className="timeline-steps">
                                <div className={`timeline-step ${trackingStep >= 0 ? 'completed' : ''}`}>
                                  <div className="step-dot"></div>
                                  <span className="step-label">Ordered</span>
                                </div>
                                <div className={`timeline-step ${trackingStep >= 1 ? 'completed' : ''}`}>
                                  <div className="step-dot"></div>
                                  <span className="step-label">Packed</span>
                                </div>
                                <div className={`timeline-step ${trackingStep >= 2 ? 'completed' : ''}`}>
                                  <div className="step-dot"></div>
                                  <span className="step-label">Shipped</span>
                                </div>
                                <div className={`timeline-step ${trackingStep >= 3 ? 'completed' : ''}`}>
                                  <div className="step-dot"></div>
                                  <span className="step-label">Out for Delivery</span>
                                </div>
                                <div className={`timeline-step ${trackingStep >= 4 ? 'completed' : ''}`}>
                                  <div className="step-dot"></div>
                                  <span className="step-label">Delivered</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Order Items Grid */}
                        <div className="details-columns">
                          <div className="details-col-items">
                            <h3 className="details-subheading">Ordered Items ({itemsCount})</h3>
                            <div className="receipt-items-list">
                              {order.order_items?.map((item) => {
                                const product = item.products;
                                if (!product) return null;

                                const img = getProductImages(product)[0] || '/placeholder.png';
                                const slug = createProductSlug(product);

                                return (
                                  <div key={item.id} className="receipt-item-row">
                                    <img src={img} alt={product.name} className="receipt-item-img" />
                                    <div className="receipt-item-info">
                                      <Link to={`/products/${slug}`} className="receipt-item-name">
                                        {product.name}
                                      </Link>
                                      <div className="receipt-item-specs">
                                        {item.size && <span>Size: <strong>{item.size}</strong></span>}
                                        {item.color && <span>Color: <strong>{item.color}</strong></span>}
                                      </div>
                                      <p className="receipt-item-price">
                                        {item.quantity} x {formatPrice(item.price_at_time)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Delivery Address / Details */}
                          <div className="details-col-delivery">
                            <h3 className="details-subheading">Shipping Address</h3>
                            {addressObj ? (
                              <div className="address-display-box">
                                <p className="address-name">{order.shipping_name || `${addressObj.first_name || ''} ${addressObj.last_name || ''}`.trim() || 'Customer'}</p>
                                <p className="address-street">{addressObj.address_line_1}</p>
                                {addressObj.address_line_2 && <p className="address-street">{addressObj.address_line_2}</p>}
                                {(addressObj.city || order.shipping_city || addressObj.state || order.shipping_state || addressObj.pincode || order.shipping_pincode) && (
                                  <p className="address-city">
                                    {[addressObj.city || order.shipping_city, addressObj.state || order.shipping_state].filter(Boolean).join(', ')}
                                    {(addressObj.pincode || order.shipping_pincode) ? ` - ${addressObj.pincode || order.shipping_pincode}` : ''}
                                  </p>
                                )}
                                {(order.shipping_phone || addressObj.phone) && (
                                  <p className="address-phone">Phone: <strong>{order.shipping_phone || addressObj.phone}</strong></p>
                                )}
                              </div>
                            ) : (
                              <p className="no-address-alert">No shipping address recorded for this order.</p>
                            )}

                            <div className="order-summary-box">
                              <h3 className="details-subheading">Summary</h3>
                              <div className="summary-row">
                                <span>Status</span>
                                <span className={`summary-status ${getStatusClass(order)}`}>
                                  {statusDisplay?.toUpperCase()}
                                </span>
                              </div>
                              <div className="summary-row total-row">
                                <span>Final Paid</span>
                                <span>{formatPrice(order.total_amount)}</span>
                              </div>

                              {/* Order actions (Cancel/Return) */}
                              <div className="order-actions-row" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {['pending', 'confirmed', 'processing'].includes(order.status?.toLowerCase()) && (
                                  <button 
                                    className="btn-cancel-order" 
                                    onClick={() => handleCancelOrder(order)}
                                    style={{
                                      width: '100%',
                                      padding: '0.65rem',
                                      backgroundColor: 'transparent',
                                      color: '#ff3b30',
                                      border: '1px solid #ff3b30',
                                      borderRadius: '4px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s/ease',
                                      textTransform: 'uppercase',
                                      fontSize: '0.75rem',
                                      letterSpacing: '1px'
                                    }}
                                  >
                                    Cancel Order
                                  </button>
                                )}
                                
                                {order.status?.toLowerCase() === 'delivered' && (
                                  <button 
                                    className="btn-return-order" 
                                    onClick={() => handleInitiateReturn(order)}
                                    style={{
                                      width: '100%',
                                      padding: '0.65rem',
                                      backgroundColor: '#fff',
                                      color: '#000',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s/ease',
                                      textTransform: 'uppercase',
                                      fontSize: '0.75rem',
                                      letterSpacing: '1px'
                                    }}
                                  >
                                    Request Return
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showReturnModal && selectedOrderForReturn && (
        <div className="return-modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="return-modal-content" style={{
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Request Return
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Please select a reason and provide additional details for returning order <strong style={{ color: '#fff' }}>{selectedOrderForReturn.id.slice(0, 8)}...</strong>
            </p>
            
            <form onSubmit={handleReturnSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                  Reason for Return
                </label>
                <select 
                  value={returnReason} 
                  onChange={(e) => setReturnReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#000',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="Size Mismatch">Size Mismatch (Too Small/Large)</option>
                  <option value="Defective Product">Defective / Damaged Product</option>
                  <option value="Incorrect Item">Incorrect Item Sent</option>
                  <option value="Quality Issue">Quality Not as Expected</option>
                  <option value="Mind Changed">Changed My Mind</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                  Additional Details / Comments
                </label>
                <textarea 
                  value={returnDetails}
                  onChange={(e) => setReturnDetails(e.target.value)}
                  placeholder="Tell us more about the issue (e.g. need size L instead of M)"
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#000',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowReturnModal(false); setSelectedOrderForReturn(null); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #333',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-blood-main)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserOrdersPage;

import { useState, useEffect } from 'react';
import { adminFetchOrders, adminUpdateOrderStatus, adminBookShiprocket } from '../../backend/admin';
import { formatPrice } from '../../utils/helpers';
import { supabase } from '../../lib/supabase';
import { restockOrderItems } from '../../backend/orders';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Shiprocket booking state per order
  const [bookingState, setBookingState] = useState({
    orderId: null,
    weight: 0.5,
    length: 10,
    width: 10,
    height: 10,
    loading: false,
    error: '',
    success: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminFetchOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update order status");
    }
  };

  const handleBookShipment = async (order) => {
    setBookingState(prev => ({ ...prev, orderId: order.id, loading: true, error: '', success: '' }));
    try {
      const result = await adminBookShiprocket(
        order.id,
        bookingState.weight,
        bookingState.length,
        bookingState.width,
        bookingState.height
      );
      
      setBookingState(prev => ({ 
        ...prev, 
        loading: false, 
        success: `Successfully booked! Shiprocket Order ID: ${result.shiprocket_order_id}` 
      }));

      // Update order in state
      setOrders(orders.map(o => o.id === order.id ? { 
        ...o, 
        shiprocket_order_id: result.shiprocket_order_id,
        shiprocket_shipment_id: result.shiprocket_shipment_id,
        shiprocket_status: result.shiprocket_status || 'Pickup Scheduled',
        shiprocket_awb: result.shiprocket_awb
      } : o));
    } catch (err) {
      console.error(err);
      setBookingState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to book shipment.' }));
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    setBookingState({
      orderId: null,
      weight: 0.5,
      length: 10,
      width: 10,
      height: 10,
      loading: false,
      error: '',
      success: ''
    });
  };

  const handleApproveReturn = async (order) => {
    if (!window.confirm(`Are you sure you want to approve the return request for order ${order.id.slice(0, 8)}...? This will set the status to Return Approved.`)) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'Return Approved'
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === order.id ? { 
        ...o, 
        status: 'Return Approved'
      } : o));
      alert("Return approved! Status set to 'Return Approved'. Awaiting warehouse receipt.");
    } catch (err) {
      console.error(err);
      alert("Failed to approve return: " + err.message);
    }
  };

  const handleConfirmReceipt = async (order) => {
    if (!window.confirm(`Confirm receipt of returned items at the warehouse for order ${order.id.slice(0, 8)}...? This will restock the inventory and set the payment status to Refund Pending.`)) return;

    try {
      
      const isPaid = order.payment_status?.toLowerCase() === 'paid';
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'Returned',
          payment_status: isPaid ? 'Refund Pending' : 'N/A'
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      await restockOrderItems(order.order_items || []);

      setOrders(prev => prev.map(o => o.id === order.id ? { 
        ...o, 
        status: 'Returned',
        payment_status: isPaid ? 'Refund Pending' : 'N/A'
      } : o));
      alert("Items received at warehouse. Inventory successfully restocked!");
    } catch (err) {
      console.error(err);
      alert("Failed to confirm warehouse receipt: " + err.message);
    }
  };

  const handleRejectReturn = async (order) => {
    if (!window.confirm(`Are you sure you want to reject the return request for order ${order.id.slice(0, 8)}...?`)) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'Delivered',
          return_reason: null,
          return_details: null
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === order.id ? { 
        ...o, 
        status: 'Delivered',
        return_reason: null,
        return_details: null
      } : o));
      alert("Return request rejected.");
    } catch (err) {
      console.error(err);
      alert("Failed to reject return: " + err.message);
    }
  };

  const handleProcessRefund = async (order) => {
    if (!window.confirm(`Process refund of ${formatPrice(order.total_amount)} for order ${order.id.slice(0, 8)}...? This will mark the payment as Refunded.`)) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: 'Refunded' })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;

      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, payment_status: 'Refunded' } : o));
      alert(`Refund of ${formatPrice(order.total_amount)} processed successfully via Razorpay!`);
    } catch (err) {
      console.error(err);
      alert("Failed to process refund: " + err.message);
    }
  };

  const parseAddress = (addr) => {
    if (!addr) return null;
    try {
      const parsed = JSON.parse(addr);
      if (typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      // Fallback
    }
    return { address_line_1: addr };
  };

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    const orderIdMatch = order.id.toLowerCase().includes(query);
    const customerMatch = (
      (order.shipping_name || '').toLowerCase().includes(query) ||
      (order.shipping_phone || '').toLowerCase().includes(query) ||
      (order.shipping_city || '').toLowerCase().includes(query) ||
      (order.shipping_state || '').toLowerCase().includes(query)
    );
    const statusMatch = order.status.toLowerCase().includes(query);
    const productMatch = order.order_items?.some(item => 
      item.products?.name?.toLowerCase().includes(query)
    );
    return orderIdMatch || customerMatch || statusMatch || productMatch;
  });

  if (loading) return <div>Loading orders...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>All Orders</h2>
        
        {/* Search Bar */}
        <input 
          type="text" 
          placeholder="Search by ID, name, phone, product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#fff',
            width: '300px',
            maxWidth: '100%'
          }}
        />
      </div>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <>
                    <tr 
                      key={order.id} 
                      onClick={() => toggleExpand(order.id)} 
                      style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#0a0a0a' : 'transparent' }}
                    >
                      <td style={{ fontSize: '0.85rem', color: '#aaa' }}>
                        {order.id.slice(0, 8)}... <span style={{ fontSize: '0.7rem', color: '#666' }}>({isExpanded ? '▲' : '▼'})</span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        {order.shipping_name || 'Guest'}
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{order.shipping_phone || 'No Phone'}</div>
                      </td>
                      <td>
                        {order.payment_method || 'N/A'}
                        <div style={{ fontSize: '0.75rem', color: order.payment_status === 'paid' ? '#4cd964' : '#f39c12' }}>
                          {order.payment_status}
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{formatPrice(order.total_amount)}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          backgroundColor: order.status.toLowerCase() === 'delivered' ? '#34c759' : 
                                           order.status.toLowerCase() === 'pending' ? '#ff9500' : 
                                           '#007aff',
                          color: '#fff'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select 
                          value={order.status} 
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{ 
                            padding: '0.5rem', 
                            backgroundColor: '#0f0f0f', 
                            color: '#fff', 
                            border: '1px solid #333',
                            borderRadius: '4px'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Return Requested">Return Requested</option>
                          <option value="Return Approved">Return Approved</option>
                          <option value="Returned">Returned</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>

                    {/* Expandable Order Details Panel */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: '#090909' }}>
                        <td colSpan="7" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #333' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Left Column: Address & Items */}
                            <div>
                              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '0.9rem', letterSpacing: '1px' }}>SHIPPING DETAILS</h4>
                              {(() => {
                                const addrObj = parseAddress(order.shipping_address);
                                return (
                                  <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                    <strong>Name:</strong> {order.shipping_name || `${addrObj?.first_name || ''} ${addrObj?.last_name || ''}`.trim() || 'N/A'}<br />
                                    <strong>Phone:</strong> <span style={{ color: '#ff9500', fontWeight: 'bold' }}>{order.shipping_phone || addrObj?.phone || 'N/A'}</span><br />
                                    <strong>Address Line 1:</strong> {addrObj?.address_line_1 || order.shipping_address || 'N/A'}<br />
                                    {addrObj?.address_line_2 && <><strong>Address Line 2:</strong> {addrObj.address_line_2}<br /></>}
                                    <strong>City:</strong> {order.shipping_city || addrObj?.city || 'N/A'}<br />
                                    <strong>State:</strong> {order.shipping_state || addrObj?.state || 'N/A'}<br />
                                    <strong>Pincode:</strong> {order.shipping_pincode || addrObj?.pincode || 'N/A'}
                                  </p>
                                );
                              })()}

                              {order.return_reason && (
                                <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: 'rgba(255, 149, 0, 0.08)', border: '1px solid #ff9500', borderRadius: '4px' }}>
                                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff9500', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>RETURN REQUEST</h4>
                                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#aaa' }}>
                                    <strong>Reason:</strong> {order.return_reason}
                                  </p>
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }}>
                                    <strong>Details:</strong> {order.return_details || 'No additional comments.'}
                                  </p>
                                  {order.status === 'Return Requested' && (
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                      <button 
                                        onClick={() => handleApproveReturn(order)}
                                        style={{
                                          padding: '0.45rem 0.9rem',
                                          backgroundColor: '#34c759',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          transition: 'opacity 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                        onMouseOut={(e) => e.target.style.opacity = '1'}
                                      >
                                        Approve Return
                                      </button>
                                      <button 
                                        onClick={() => handleRejectReturn(order)}
                                        style={{
                                          padding: '0.45rem 0.9rem',
                                          backgroundColor: '#ff3b30',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          transition: 'opacity 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                        onMouseOut={(e) => e.target.style.opacity = '1'}
                                      >
                                        Reject Return
                                      </button>
                                    </div>
                                  )}
                                  {order.status === 'Return Approved' && (
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                                      <button 
                                        onClick={() => handleConfirmReceipt(order)}
                                        style={{
                                          padding: '0.45rem 0.9rem',
                                          backgroundColor: '#ff9500',
                                          color: '#fff',
                                          border: 'none',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          fontWeight: 'bold',
                                          cursor: 'pointer',
                                          transition: 'opacity 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                        onMouseOut={(e) => e.target.style.opacity = '1'}
                                      >
                                        Confirm Receipt & Restock
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {order.payment_status === 'Refund Pending' && (
                                <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: 'rgba(255, 59, 48, 0.08)', border: '1px solid #ff3b30', borderRadius: '4px' }}>
                                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff3b30', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>REFUND REQUIRED</h4>
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }}>
                                    This order has been cancelled or returned and has a pending online refund of <strong>{formatPrice(order.total_amount)}</strong>.
                                  </p>
                                  <button 
                                    onClick={() => handleProcessRefund(order)}
                                    style={{
                                      padding: '0.45rem 0.9rem',
                                      backgroundColor: '#ff3b30',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                                    onMouseOut={(e) => e.target.style.opacity = '1'}
                                  >
                                    Mark as Refunded via Razorpay
                                  </button>
                                </div>
                              )}

                              <h4 style={{ margin: '1.5rem 0 0.5rem 0', color: '#fff', fontSize: '0.9rem', letterSpacing: '1px' }}>ITEMS ORDERED</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {order.order_items?.map((item) => (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#aaa', paddingBottom: '0.5rem', borderBottom: '1px solid #1a1a1a' }}>
                                    <div>
                                      <strong style={{ color: '#fff' }}>{item.products?.name || 'Deleted Product'}</strong>
                                      <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        Size: <span style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: '0.85rem' }}>{item.size || 'N/A'}</span> | Color: <span style={{ color: '#fff', fontWeight: '500' }}>{item.color || 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      {item.quantity} x {formatPrice(item.price_at_time)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right Column: Shiprocket Portal */}
                            <div style={{ borderLeft: '1px solid #222', paddingLeft: '2rem' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '0.9rem', letterSpacing: '1px' }}>SHIPROCKET SHIPPING</h4>
                              
                              {order.shiprocket_shipment_id && order.shiprocket_shipment_id !== 'undefined' ? (
                                <div style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: '1.6' }}>
                                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Shiprocket Order ID:</strong> {order.shiprocket_order_id}</p>
                                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Shipment ID:</strong> {order.shiprocket_shipment_id}</p>
                                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>AWB Tracking:</strong> {order.shiprocket_awb || 'Pending'}</p>
                                  <p style={{ margin: '0 0 0.25rem 0' }}><strong>Shipping Status:</strong> <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>{order.shiprocket_status}</span></p>
                                </div>
                              ) : (
                                <div style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '4px', border: '1px solid #222' }}>
                                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#888' }}>
                                    Fill in package dimensions and weight to register shipment on Shiprocket.
                                  </p>

                                  {bookingState.orderId === order.id && bookingState.error && (
                                    <div style={{ color: '#ff3b30', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{bookingState.error}</div>
                                  )}
                                  {bookingState.orderId === order.id && bookingState.success && (
                                    <div style={{ color: '#4cd964', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{bookingState.success}</div>
                                  )}

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Weight (kg)</label>
                                      <input 
                                        type="number" 
                                        value={bookingState.weight}
                                        onChange={(e) => setBookingState({ ...bookingState, weight: Number(e.target.value) })}
                                        style={bookingInputStyle} 
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Length (cm)</label>
                                      <input 
                                        type="number" 
                                        value={bookingState.length}
                                        onChange={(e) => setBookingState({ ...bookingState, length: Number(e.target.value) })}
                                        style={bookingInputStyle} 
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Width (cm)</label>
                                      <input 
                                        type="number" 
                                        value={bookingState.width}
                                        onChange={(e) => setBookingState({ ...bookingState, width: Number(e.target.value) })}
                                        style={bookingInputStyle} 
                                      />
                                    </div>
                                    <div>
                                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Height (cm)</label>
                                      <input 
                                        type="number" 
                                        value={bookingState.height}
                                        onChange={(e) => setBookingState({ ...bookingState, height: Number(e.target.value) })}
                                        style={bookingInputStyle} 
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={() => handleBookShipment(order)}
                                    disabled={bookingState.loading}
                                    style={{
                                      width: '100%',
                                      padding: '0.5rem',
                                      backgroundColor: '#fff',
                                      color: '#000',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      fontWeight: 'bold',
                                      cursor: bookingState.loading ? 'not-allowed' : 'pointer',
                                      opacity: bookingState.loading ? 0.5 : 1
                                    }}
                                  >
                                    {bookingState.loading ? 'Booking Shipment...' : 'Book Shipment on Shiprocket'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const bookingInputStyle = {
  width: '100%',
  padding: '0.4rem',
  backgroundColor: '#000',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '0.8rem'
};

export default OrdersList;

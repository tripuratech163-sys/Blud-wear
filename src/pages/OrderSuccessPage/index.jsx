import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  const shippingCost = order ? (Number(order.total_amount) - Number(order.subtotal) - Number(order.gst_amount) - Number(order.discount_amount || 0)) : 0;

  if (!order) {
    return (
      <div className="order-success-page">
        <Navbar />
        <main className="success-main container">
          <div className="success-card">
            <h2>No Order Found</h2>
            <p>It looks like you haven't placed an order recently.</p>
            <button className="btn-primary" onClick={() => navigate('/collection')}>
              Return to Shop
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <Navbar />
      
      <main className="success-main container">
        <div className="success-card">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-blood-main)" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          
          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-subtitle">Thank you for your purchase, <strong>{order.shipping_name}</strong>. Your order is being processed.</p>

          <div className="receipt-container">
            <div className="receipt-header">
              <div className="receipt-row">
                <span>Order ID</span>
                <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className="receipt-row">
                <span>Date</span>
                <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Method</span>
                <strong>{order.payment_method}</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Status</span>
                <strong style={{ color: order.payment_status === 'paid' ? '#4cd964' : '#f39c12', textTransform: 'uppercase' }}>
                  {order.payment_status}
                </strong>
              </div>
            </div>

            <div className="receipt-shipping">
              <h3>Shipping Address</h3>
              <p>{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>Pincode: {order.shipping_pincode}</p>
              <p>Phone: {order.shipping_phone}</p>
            </div>

            <div className="receipt-totals">
              <div className="receipt-row">
                <span>Base Price</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>GST (18%)</span>
                <span>₹{Number(order.gst_amount).toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Shipping</span>
                {shippingCost > 0 ? (
                  <span>₹{shippingCost.toFixed(2)}</span>
                ) : (
                  <span style={{ color: '#4cd964' }}>FREE</span>
                )}
              </div>
              <div className="receipt-row receipt-final">
                <span>{order.payment_method === 'COD' ? 'Total Payable' : 'Total Paid'}</span>
                <span>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={() => navigate('/collection')}>
            Continue Shopping
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccessPage;

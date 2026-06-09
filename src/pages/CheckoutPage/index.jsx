import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { clearCart } from '../../backend/cart';
import { createRazorpayOrder, openRazorpayCheckout } from '../../backend/razorpay';
import Navbar from '../../sections/Navbar';
import Footer from '../../sections/Footer';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cartItems, refreshCart, cartLoading } = useCart();
  const navigate = useNavigate();

  // Auth States for inline login
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');

  // Checkout States
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    // If cart is empty and has finished loading, redirect back to collection
    if (!cartLoading && user && cartItems.length === 0) {
      navigate('/collection');
    }
  }, [user, cartItems, cartLoading, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (!phone || phone.length < 10) throw new Error("Enter valid phone number");
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      console.error("OTP Send Error:", err);
      setAuthError("Failed to send OTP. Please check your mobile number and try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (error) throw error;
    } catch (err) {
      console.error("OTP Verify Error:", err);
      setAuthError("Invalid or expired OTP. Please try again.");
    }
  };

  const handleShippingChange = (e) => {
    setShipping(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Pricing calculations
  const basePrice = cartItems.reduce((acc, item) => {
    const priceNum = Number(item.products.price.replace(/[^0-9.-]+/g,"")) || 0;
    return acc + (priceNum * item.quantity);
  }, 0);

  const gstAmount = basePrice * 0.18;
  const finalTotal = basePrice + gstAmount;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setProcessing(true);

    try {
      if (!shipping.name || !shipping.address || !shipping.pincode || !shipping.phone) {
        throw new Error("Please fill all required shipping fields.");
      }

      if (paymentMethod === 'COD') {
        await saveOrder('COD', null, null);
      } else {
        // Razorpay flow
        const methodParam = paymentMethod.toLowerCase(); // 'upi' or 'card'
        
        // Step 1: Create order on backend (Edge Function)
        const orderData = await createRazorpayOrder(
          finalTotal,
          `order_${Date.now()}`
        );

        // Step 2: Open Razorpay checkout
        const paymentResult = await openRazorpayCheckout({
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          name: "BludWear",
          description: `Order of ${cartItems.length} item(s)`,
          image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg",
          prefill: {
            name: shipping.name,
            contact: shipping.phone,
            email: user?.email || "",
            method: methodParam,
          },
          theme: {
            color: "#c0392b",
          },
          container: '#razorpay-embed-container',
        });

        // Step 3: Save order to Supabase
        await saveOrder(paymentMethod, paymentResult.razorpay_payment_id, paymentResult.razorpay_order_id);
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      if (err.message === 'Payment cancelled by user') {
        setCheckoutError('Payment was cancelled. You can try again.');
      } else if (err.message === "Please fill all required shipping fields.") {
        setCheckoutError(err.message);
      } else {
        setCheckoutError("An unexpected error occurred while placing your order. Please try again or contact support.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const saveOrder = async (method, paymentId, razorpayOrderId) => {
    const orderPayload = {
      user_id: user.id,
      total_amount: finalTotal,
      subtotal: basePrice,
      gst_amount: gstAmount,
      discount_amount: 0,
      status: 'confirmed',
      shipping_name: shipping.name,
      shipping_phone: shipping.phone,
      shipping_address: `${shipping.address}, ${shipping.city}, ${shipping.state}`,
      shipping_pincode: shipping.pincode,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      payment_method: method,
      payment_status: method === 'COD' ? 'pending' : 'paid'
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create Order Items with size and color support
    const orderItemsPayload = cartItems.map(item => ({
      order_id: orderData.id,
      product_id: item.products.id,
      quantity: item.quantity,
      price_at_time: item.products.price,
      size: item.size || null,
      color: item.color || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (itemsError) throw itemsError;

    // Clear Cart
    await clearCart(user.id);
    await refreshCart();

    // Redirect to success
    navigate('/order-success', { state: { order: orderData } });
  };

  return (
    <div className="checkout-page">
      <Navbar />
      
      <main className="checkout-main container">
        {!user ? (
          <div className="checkout-auth-card">
            <h2>Login to Checkout</h2>
            <p>Please verify your mobile number to proceed securely.</p>
            {authError && <div className="checkout-error">{authError}</div>}
            
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="checkout-form">
                <div className="input-group">
                  <label>Mobile Number (with country code)</label>
                  <input type="tel" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary">Send OTP</button>
                <div className="login-link">
                  <span onClick={() => navigate('/login')}>Or login with Email</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="checkout-form">
                <div className="input-group">
                  <label>Enter 6-digit OTP</label>
                  <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} required />
                </div>
                <button type="submit" className="btn-primary">Verify & Proceed</button>
              </form>
            )}
          </div>
        ) : (
          <div className="checkout-layout">
            <div className="checkout-details">
              {processing ? (
                <div className="checkout-processing-embedded" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem 0' }}>
                  <h2>Secure Payment Portal</h2>
                  <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Please complete your transaction details below:</p>
                  {checkoutError && <div className="checkout-error" style={{ marginBottom: '1rem' }}>{checkoutError}</div>}
                  <div id="razorpay-embed-container" style={{ width: '100%', minHeight: '450px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px' }}></div>
                  {paymentMethod !== 'COD' && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setProcessing(false);
                        setCheckoutError('');
                      }}
                      style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', backgroundColor: 'transparent', color: '#ff3b30', border: '1px solid #ff3b30', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      Cancel & Choose Another Method
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h2>Shipping Address</h2>
                  {checkoutError && <div className="checkout-error">{checkoutError}</div>}
                  
                  <form id="checkout-form" onSubmit={handlePlaceOrder} className="checkout-form">
                <div className="form-row">
                  <div className="input-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" required value={shipping.name} onChange={handleShippingChange} />
                  </div>
                  <div className="input-group">
                    <label>Mobile Number *</label>
                    <input type="tel" name="phone" required value={shipping.phone} onChange={handleShippingChange} />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Address *</label>
                  <input type="text" name="address" required value={shipping.address} onChange={handleShippingChange} placeholder="House/Flat No., Street, Area" />
                </div>
                
                <div className="form-row three-cols">
                  <div className="input-group">
                    <label>City *</label>
                    <input type="text" name="city" required value={shipping.city} onChange={handleShippingChange} />
                  </div>
                  <div className="input-group">
                    <label>State *</label>
                    <input type="text" name="state" required value={shipping.state} onChange={handleShippingChange} />
                  </div>
                  <div className="input-group">
                    <label>Pincode *</label>
                    <input type="text" name="pincode" required value={shipping.pincode} onChange={handleShippingChange} />
                  </div>
                </div>

                <h2 className="payment-heading">Payment Method</h2>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'UPI' ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span className="pay-text">UPI / QR Code</span>
                  </label>
                  <label className={`payment-option ${paymentMethod === 'Card' ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span className="pay-text">Credit / Debit Card</span>
                  </label>
                  <label className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span className="pay-text">Cash on Delivery</span>
                  </label>
                </div>
              </form>
              </>
            )}
            </div>

            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <div className="summary-items">
                {cartItems.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-img">
                      <img src={item.products.image} alt={item.products.name} />
                      <span className="summary-qty">{item.quantity}</span>
                    </div>
                    <div className="summary-item-info">
                      <h4>{item.products.name}</h4>
                      <p>{item.size} / {item.color}</p>
                    </div>
                    <div className="summary-item-price">
                      {item.products.price}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="summary-totals">
                <div className="summary-line">
                  <span>Base Price</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="summary-line highlight">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="summary-line total">
                  <span>Total Amount</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                type="submit" 
                form="checkout-form" 
                className="btn-place-order" 
                disabled={processing}
              >
                {processing ? 'Processing Secure Payment...' : `Pay ₹${finalTotal.toFixed(2)}`}
              </button>
              
              <div className="secure-checkout-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>100% Secure & Encrypted Payment</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;

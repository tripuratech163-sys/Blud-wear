import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { clearCart } from '../../backend/cart';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../backend/razorpay';
import { deductOrderItems } from '../../backend/orders';
import './CheckoutModal.css';

const CheckoutModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { cartItems, refreshCart } = useCart();
  const navigate = useNavigate();

  // Modal Step: 1 = Auth, 2 = Address, 3 = Payment
  const [step, setStep] = useState(1);

  // Auth States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Shipping States
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  // Processing States
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('upi'); // 'upi', 'card', 'netbanking', 'cod'

  // Auto-advance step if already logged in
  useEffect(() => {
    if (isOpen) {
      setCheckoutError('');
      if (user) {
        setStep(2);
      } else {
        setStep(1);
        setOtpSent(false);
        setPhone('');
        setOtp('');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Pricing calculations
  const basePrice = cartItems.reduce((acc, item) => {
    const priceNum = Number(item.products.price.replace(/[^0-9.-]+/g, "")) || 0;
    return acc + (priceNum * item.quantity);
  }, 0);
  const gstAmount = basePrice * 0.18;
  const finalTotal = basePrice + gstAmount;

  // --- Auth handlers ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (!phone || phone.length < 10) throw new Error("Enter a valid mobile number with country code (e.g. +91XXXXXXXXXX)");
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      setAuthError(err.message || "Failed to send OTP.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (error) throw error;
      setStep(2);
    } catch (err) {
      setAuthError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Email login fallback if SMS not configured
  const handleEmailFallback = () => {
    onClose();
    navigate('/login');
  };

  // --- Shipping handler ---
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setCheckoutError('');
    if (!shipping.name || !shipping.address || !shipping.pincode || !shipping.phone || !shipping.city || !shipping.state) {
      setCheckoutError("Please fill all required fields.");
      return;
    }
    setStep(3);
  };

  // --- Payment handler (Real Razorpay via Edge Function) ---
  const handleRazorpayPayment = async (method) => {
    setCheckoutError('');
    setProcessing(true);

    try {
      // Step 1: Create order on backend (Edge Function)
      const orderData = await createRazorpayOrder(
        finalTotal,
        `order_${Date.now()}`
      );

      const paymentResult = await openRazorpayCheckout({
        key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,

        name: "BludWear",
        description: `Order of ${cartItems.length} item(s)`,

        image:
          "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg",

        prefill: {
          name: shipping.name,
          contact: shipping.phone,
          email: user?.email || "",
          method: method, // 'upi', 'card', or 'netbanking'
        },

        theme: {
          color: "#c0392b",
        },
        container: '#razorpay-embed-container',
      });
      
      // Step 3: Verify Razorpay payment signature securely on backend
      await verifyRazorpayPayment(
        paymentResult.razorpay_order_id,
        paymentResult.razorpay_payment_id,
        paymentResult.razorpay_signature
      );

      // Step 4: Save order to Supabase after successful payment
      await saveOrder(method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Netbanking', paymentResult.razorpay_payment_id, paymentResult.razorpay_order_id);

    } catch (err) {
      if (err.message === 'Payment cancelled by user') {
        setCheckoutError('Payment was cancelled. You can try again.');
      } else {
        setCheckoutError(err.message || "Payment failed. Please try again.");
      }
      setProcessing(false);
    }
  };

  // --- COD handler ---
  const handleCOD = async () => {
    setCheckoutError('');
    setProcessing(true);
    try {
      await saveOrder('COD', null, null);
    } catch (err) {
      setCheckoutError(err.message || "Order failed. Please try again.");
      setProcessing(false);
    }
  };

  // --- Save order to DB ---
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
      payment_status: method === 'COD' ? 'pending' : 'paid',
    };

    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (orderError) throw orderError;

    // Save order items
    const orderItemsPayload = cartItems.map(item => ({
      order_id: savedOrder.id,
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

    // Deduct stock in inventory
    try {
      await deductOrderItems(orderItemsPayload);
    } catch (deductErr) {
      console.error("Failed to automatically deduct inventory stock:", deductErr);
    }

    // Clear cart
    await clearCart(user.id);
    await refreshCart();

    // Navigate to success
    onClose();
    navigate('/order-success', { state: { order: savedOrder } });
  };

  return (
    <div className="checkout-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-modal-content">

        {/* Header */}
        <div className="checkout-modal-header">
          <div className="c-header-left">
            {step > 1 && step <= 3 && (
              <button className="c-back-btn" onClick={() => setStep(s => s - 1)}>‹ Back</button>
            )}
          </div>
          <div className="c-logo">BLUDWEAR checkout</div>
          <button className="c-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Step Indicator */}
        <div className="c-step-indicator">
          {['Auth', 'Address', 'Payment'].map((label, i) => (
            <div key={i} className={`c-step-dot ${step > i ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
              <div className="c-dot">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="checkout-modal-body">

          {/* Order Summary Block */}
          <div className="c-summary-block">
            <div className="c-summary-row">
              <span>Order summary ({cartItems.length} item{cartItems.length !== 1 && 's'})</span>
              <div className="c-summary-price">
                <small>Base: ₹{basePrice.toFixed(2)} + GST 18%</small>
                <strong>₹{finalTotal.toFixed(2)}</strong>
              </div>
            </div>
            <div className="c-free-delivery">
              <span>🚚</span> <span>Free Delivery</span>
            </div>
          </div>

          <div className="c-steps-container">

            {/* ── Step 1: Auth ─────────────────────── */}
            {step === 1 && (
              <div className="c-step-auth animate-in">
                <h3>Enter mobile number</h3>
                <p>Provide your mobile number to continue</p>

                {authError && <div className="c-error">{authError}</div>}

                {!otpSent ? (
                  <form onSubmit={handleSendOtp}>
                    <div className="c-input-wrapper">
                      <span className="c-country-code">🇮🇳 +91</span>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="c-btn-primary" disabled={authLoading}>
                      {authLoading ? 'Sending OTP...' : 'Continue'}
                    </button>
                    <button type="button" className="c-btn-text" onClick={handleEmailFallback}>
                      Login with Email instead
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <p className="c-otp-hint">OTP sent to <strong>{phone}</strong></p>
                    <div className="c-input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        autoFocus
                        maxLength={6}
                      />
                    </div>
                    <button type="submit" className="c-btn-primary" disabled={authLoading}>
                      {authLoading ? 'Verifying...' : 'Verify & Continue'}
                    </button>
                    <button type="button" className="c-btn-text" onClick={() => { setOtpSent(false); setOtp(''); }}>
                      Change number
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ── Step 2: Shipping Address ─────────── */}
            {step === 2 && (
              <div className="c-step-address animate-in">
                <h3>Delivery Address</h3>
                <form onSubmit={handleShippingSubmit}>
                  <div className="c-form-grid">
                    <input
                      type="text" placeholder="Full Name *"
                      value={shipping.name}
                      onChange={e => setShipping({ ...shipping, name: e.target.value })}
                      required
                    />
                    <input
                      type="tel" placeholder="Mobile Number *"
                      value={shipping.phone}
                      onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                      required
                    />
                    <input
                      type="text" placeholder="Pincode *"
                      value={shipping.pincode}
                      onChange={e => setShipping({ ...shipping, pincode: e.target.value })}
                      required
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      type="text" placeholder="House / Flat No., Street, Area *"
                      value={shipping.address}
                      onChange={e => setShipping({ ...shipping, address: e.target.value })}
                      required
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      type="text" placeholder="City *"
                      value={shipping.city}
                      onChange={e => setShipping({ ...shipping, city: e.target.value })}
                      required
                    />
                    <input
                      type="text" placeholder="State *"
                      value={shipping.state}
                      onChange={e => setShipping({ ...shipping, state: e.target.value })}
                      required
                    />
                  </div>
                  {checkoutError && <div className="c-error">{checkoutError}</div>}
                  <button type="submit" className="c-btn-primary">
                    Proceed to Payment →
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 3: Payment ──────────────────── */}
            {step === 3 && (
              <div className="c-step-payment animate-in">
                {processing ? (
                  <div className="c-processing-overlay" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%', padding: '1rem 0' }}>
                    <div className="c-spinner"></div>
                    <p style={{ margin: '0.5rem 0', fontWeight: 'bold' }}>Secure Payment Portal</p>
                    {checkoutError && <div className="c-error" style={{ marginBottom: '1rem' }}>{checkoutError}</div>}
                    <div id="razorpay-embed-container" style={{ width: '100%', minHeight: '450px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px' }}></div>
                    {selectedPayment !== 'cod' && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setProcessing(false);
                          setCheckoutError('');
                        }}
                        style={{ marginTop: '1rem', padding: '0.65rem 1.5rem', backgroundColor: 'transparent', color: '#ff3b30', border: '1px solid #ff3b30', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Cancel & Choose Another Method
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <h3>Choose Payment</h3>
                    <div className="c-order-review">
                      <p><strong>{shipping.name}</strong></p>
                      <p>{shipping.address}, {shipping.city} - {shipping.pincode}</p>
                    </div>
                    <div className="c-payment-total">
                      <span>Total to pay</span>
                      <strong>₹{finalTotal.toFixed(2)}</strong>
                    </div>
                    <div className="c-payment-options-grid">
                      <div 
                        className={`c-payment-card ${selectedPayment === 'upi' ? 'active' : ''}`}
                        onClick={() => setSelectedPayment('upi')}
                      >
                        <span className="pay-icon">⚡</span>
                        <div className="pay-card-details">
                          <span className="pay-title">UPI / QR Code</span>
                          <span className="pay-desc">Pay via Google Pay, PhonePe, Paytm</span>
                        </div>
                      </div>

                      <div 
                        className={`c-payment-card ${selectedPayment === 'card' ? 'active' : ''}`}
                        onClick={() => setSelectedPayment('card')}
                      >
                        <span className="pay-icon">💳</span>
                        <div className="pay-card-details">
                          <span className="pay-title">Credit / Debit Card</span>
                          <span className="pay-desc">All major Indian and global cards</span>
                        </div>
                      </div>

                      <div 
                        className={`c-payment-card ${selectedPayment === 'netbanking' ? 'active' : ''}`}
                        onClick={() => setSelectedPayment('netbanking')}
                      >
                        <span className="pay-icon">🏦</span>
                        <div className="pay-card-details">
                          <span className="pay-title">Net Banking</span>
                          <span className="pay-desc">Direct payment from 50+ major banks</span>
                        </div>
                      </div>

                      <div 
                        className={`c-payment-card ${selectedPayment === 'cod' ? 'active' : ''}`}
                        onClick={() => setSelectedPayment('cod')}
                      >
                        <span className="pay-icon">💵</span>
                        <div className="pay-card-details">
                          <span className="pay-title">Cash on Delivery</span>
                          <span className="pay-desc">Pay in cash or UPI when order arrives</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      className="c-btn-primary" 
                      style={{ marginTop: '2rem' }}
                      onClick={() => {
                        if (selectedPayment === 'cod') {
                          handleCOD();
                        } else {
                          handleRazorpayPayment(selectedPayment);
                        }
                      }}
                    >
                      {selectedPayment === 'cod' ? 'Place COD Order' : `Pay ₹${finalTotal.toFixed(2)} Now`}
                    </button>
                    {checkoutError && <div className="c-error">{checkoutError}</div>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="checkout-modal-footer">
          <div className="c-trust-badges">
            <div className="c-badge">🛡️ PCI DSS Certified</div>
            <div className="c-badge">🔒 Secure Payments</div>
            <div className="c-badge">📦 Assured Delivery</div>
          </div>
          <div className="c-powered-by">
            Powered by <strong>Razorpay</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

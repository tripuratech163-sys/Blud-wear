import { useState, useEffect, useMemo } from 'react';
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

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Shipping calculation state
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Auto-advance step if already logged in and reset states when opened
  useEffect(() => {
    if (isOpen) {
      setCheckoutError('');
      setPromoCode('');
      setAppliedDiscount(null);
      setPromoSuccess('');
      setPromoError('');
      setShipping({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      });
      setShippingCost(0);

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

  // Fetch live shipping rates when Pincode or Payment Method changes
  useEffect(() => {
    const fetchShipping = async () => {
      if (shipping.pincode && shipping.pincode.length === 6) {
        setIsCalculatingShipping(true);
        try {
          const { data, error } = await supabase.functions.invoke('calculate-shipping', {
            body: { 
              delivery_postcode: shipping.pincode,
              cod: selectedPayment === 'cod',
              weight: cartItems.length * 0.5 || 0.5
            }
          });
          if (error) throw error;
          setShippingCost(data.shipping_cost || 0);
        } catch (err) {
          console.error("Failed to calculate live shipping:", err);
          setShippingCost(selectedPayment === 'cod' ? 90 : 50); // Fallback
        } finally {
          setIsCalculatingShipping(false);
        }
      } else {
        setShippingCost(0);
      }
    };
    fetchShipping();
  }, [shipping.pincode, selectedPayment, cartItems.length]);



  // Check if a Top and a Bottom are in the cart to qualify for auto-bundle discount
  const hasBundle = useMemo(() => {
    let hasTopOrOuterwear = false;
    let hasBottom = false;
    cartItems.forEach(item => {
      const cat = item.products.category?.toLowerCase() || '';
      if (cat === 'tops' || cat === 'outerwear') {
        hasTopOrOuterwear = true;
      }
      if (cat === 'bottoms') {
        hasBottom = true;
      }
    });
    return hasTopOrOuterwear && hasBottom;
  }, [cartItems]);

  const activeDiscount = useMemo(() => {
    if (appliedDiscount) return appliedDiscount;
    if (hasBundle) {
      return { code: 'BUNDLE15 (Auto)', type: 'percent', value: 15 };
    }
    return null;
  }, [appliedDiscount, hasBundle]);

  // Pricing calculations
  const basePrice = cartItems.reduce((acc, item) => {
    const priceNum = Number(item.products.price.replace(/[^0-9.-]+/g, "")) || 0;
    return acc + (priceNum * item.quantity);
  }, 0);

  const discountAmount = activeDiscount 
    ? activeDiscount.type === 'percent' 
      ? basePrice * (activeDiscount.value / 100) 
      : activeDiscount.value
    : 0;

  const discountedBasePrice = Math.max(0, basePrice - discountAmount);
  const gstAmount = 0;
  const finalTotal = discountedBasePrice + shippingCost;


  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'BUNDLE15' && hasBundle) {
      setAppliedDiscount({ code: 'BUNDLE15', type: 'percent', value: 15 });
      setPromoSuccess('Promo code BUNDLE15 applied! 15% discount dynamic recalculation.');
      return;
    }

    setApplyingPromo(true);
    try {
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code).maybeSingle();
      if (error || !data) throw new Error('Invalid coupon code.');
      if (data.used) throw new Error('This coupon has already been used.');

      setAppliedDiscount({ 
        id: data.id, code: data.code, type: data.discount_type, value: Number(data.discount_value) 
      });
      setPromoSuccess(`Promo code ${data.code} applied successfully!`);
    } catch (err) {
      setPromoError(err.message || 'Invalid coupon code.');
      setAppliedDiscount(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const markCouponAsUsed = async () => {
    if (appliedDiscount && appliedDiscount.id) {
      try {
        await supabase.from('coupons').update({ used: true }).eq('id', appliedDiscount.id);
      } catch (err) {
        console.error("Failed to mark coupon as used:", err);
      }
    }
  };

  if (!isOpen) return null;

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
          "https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/1.jpg_1_gaqvnn.jpg",

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
      
      await markCouponAsUsed();

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
      await markCouponAsUsed();
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
      discount_amount: discountAmount,
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

    // Auto-book on Shiprocket (Silently fail if Shiprocket is down)
    try {
      await supabase.functions.invoke('book-shiprocket-shipment', {
        body: { 
          order_id: savedOrder.id,
          weight: 0.5,
          dimensions: { length: 10, width: 10, height: 10 }
        }
      });
    } catch (shiprocketErr) {
      console.error("Auto-booking on Shiprocket failed:", shiprocketErr);
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

          {/* Order Summary Block - Detailed Price Breakup */}
          <div className="c-summary-block">
            <div className="c-summary-header">
              <span>Order summary ({cartItems.length} item{cartItems.length !== 1 && 's'})</span>
            </div>
            <div className="c-price-breakup">
              <div className="c-price-row">
                <span>Item Total (MRP)</span>
                <span>₹{basePrice.toFixed(2)}</span>
              </div>
              {activeDiscount && (
                <div className="c-price-row" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                  <span>Discount ({activeDiscount.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="c-price-row c-price-delivery">
                <span>🚚 Delivery Charges</span>
                {isCalculatingShipping ? <span>Calculating...</span> : (shippingCost === 0 ? <span className="c-free-tag">Enter Pincode</span> : <span>₹{shippingCost.toFixed(2)}</span>)}
              </div>
              <div className="c-price-divider" />
              <div className="c-price-row c-price-total">
                <span>Total Payable</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
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
                        maxLength="15"
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
                      maxLength="100"
                      required
                    />
                    <input
                      type="tel" placeholder="Mobile Number *"
                      value={shipping.phone}
                      onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                      maxLength="15"
                      required
                    />
                    <input
                      type="text" placeholder="Pincode *"
                      value={shipping.pincode}
                      onChange={e => setShipping({ ...shipping, pincode: e.target.value })}
                      maxLength="10"
                      required
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      type="text" placeholder="House / Flat No., Street, Area *"
                      value={shipping.address}
                      onChange={e => setShipping({ ...shipping, address: e.target.value })}
                      maxLength="300"
                      required
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      type="text" placeholder="City *"
                      value={shipping.city}
                      onChange={e => setShipping({ ...shipping, city: e.target.value })}
                      maxLength="100"
                      required
                    />
                    <input
                      type="text" placeholder="State *"
                      value={shipping.state}
                      onChange={e => setShipping({ ...shipping, state: e.target.value })}
                      maxLength="100"
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
                    
                    {/* IMPORTANT PAYMENT WARNING */}
                    <div style={{ backgroundColor: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', color: '#ffcc00', padding: '1rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', width: '100%', textAlign: 'left' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.9rem' }}>WARNING: DO NOT REFRESH OR CLOSE THIS PAGE.</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#ccc' }}>Refreshing the page will cause your payment to get stuck or cancelled.</span>
                      </div>
                    </div>

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
                    <h3 style={{ marginBottom: '0.5rem' }}>Have a Coupon Code?</h3>
                    <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        maxLength="20"
                        style={{ flex: 1, padding: '0.8rem', backgroundColor: '#fff', border: '1px solid #ccc', color: '#000', borderRadius: '6px', textTransform: 'uppercase', outline: 'none' }}
                      />
                      <button 
                        type="submit" 
                        disabled={applyingPromo}
                        style={{ padding: '0.8rem 1.5rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: applyingPromo ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                      >
                        {applyingPromo ? 'Applying...' : 'Apply'}
                      </button>
                    </form>
                    {promoError && <p style={{ color: '#745756ff', fontSize: '0.85rem', marginTop: '-1rem', marginBottom: '1rem' }}>{promoError}</p>}
                    {promoSuccess && <p style={{ color: '#2ecc71', fontSize: '0.85rem', marginTop: '-1rem', marginBottom: '1rem' }}>{promoSuccess}</p>}
                    {hasBundle && !appliedDiscount && (
                      <p style={{ color: '#2ecc71', fontSize: '0.85rem', marginTop: '-1rem', marginBottom: '1rem' }}>🎉 Bundle Kit detected! Automatic 15% discount applied.</p>
                    )}

                    <h3>Choose Payment</h3>
                    <div className="c-order-review">
                      <p><strong>{shipping.name}</strong></p>
                      <p>{shipping.address}, {shipping.city} - {shipping.pincode}</p>
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

                    {/* IMPORTANT WARNING BEFORE CLICKING PAY */}
                    <div style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid #ff3b30', color: '#ff3b30', padding: '1rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem' }}>ONCE PAYMENT STARTS, DO NOT REFRESH OR HIT BACK</span>
                      </div>
                    </div>

                    <button 
                      className="c-btn-primary" 
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

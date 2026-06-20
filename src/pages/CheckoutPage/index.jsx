import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';
import { clearCart } from '../../backend/cart';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../backend/razorpay';
import { deductOrderItems } from '../../backend/orders';
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

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null); // { code: '...', type: 'percent', value: 10 }
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Shipping cost states
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  useEffect(() => {
    // If cart is empty and has finished loading, redirect back to collection
    if (!cartLoading && user && cartItems.length === 0) {
      navigate('/collection');
    }
  }, [user, cartItems, cartLoading, navigate]);

  // Fetch live shipping rates when Pincode or Payment Method changes
  useEffect(() => {
    const fetchShipping = async () => {
      if (shipping.pincode && shipping.pincode.length === 6) {
        setIsCalculatingShipping(true);
        try {
          const { data, error } = await supabase.functions.invoke('calculate-shipping', {
            body: { 
              delivery_postcode: shipping.pincode,
              cod: paymentMethod === 'COD',
              weight: cartItems.length * 0.5 || 0.5
            }
          });
          if (error) throw error;
          setShippingCost(data.shipping_cost || 0);
        } catch (err) {
          console.error("Failed to calculate live shipping:", err);
          setShippingCost(paymentMethod === 'COD' ? 90 : 50); // Fallback
        } finally {
          setIsCalculatingShipping(false);
        }
      } else {
        setShippingCost(0);
      }
    };
    fetchShipping();
  }, [shipping.pincode, paymentMethod, cartItems.length]);

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

  // Determine active discount (manually entered code or auto-applied bundle discount)
  const activeDiscount = useMemo(() => {
    if (appliedDiscount) return appliedDiscount;
    if (hasBundle) {
      return { code: 'BUNDLE15 (Auto)', type: 'percent', value: 15 };
    }
    return null;
  }, [appliedDiscount, hasBundle]);

  // Pricing calculations
  const basePrice = cartItems.reduce((acc, item) => {
    const priceNum = Number(item.products.price.replace(/[^0-9.-]+/g,"")) || 0;
    return acc + (priceNum * item.quantity);
  }, 0);

  const discountAmount = activeDiscount 
    ? activeDiscount.type === 'percent' 
      ? basePrice * (activeDiscount.value / 100) 
      : 0
    : 0;

  const discountedBasePrice = basePrice - discountAmount;
  const gstAmount = 0;
  const finalTotal = discountedBasePrice + shippingCost;

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'BLUD10') {
      setAppliedDiscount({ code: 'BLUD10', type: 'percent', value: 10 });
      setPromoSuccess('Promo code BLUD10 applied! 10% discount dynamic recalculation.');
    } else if (code === 'BUNDLE15') {
      setAppliedDiscount({ code: 'BUNDLE15', type: 'percent', value: 15 });
      setPromoSuccess('Promo code BUNDLE15 applied! 15% discount dynamic recalculation.');
    } else {
      setPromoError('Invalid coupon code. Try BLUD10 or BUNDLE15.');
      setAppliedDiscount(null);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setProcessing(true);

    try {
      if (!shipping.name || !shipping.address || !shipping.pincode || !shipping.phone) {
        throw new Error("Please fill all required shipping fields.");
      }

      let finalOrderId = null;

      if (paymentMethod === 'COD') {
        const order = await saveOrder('COD', null, null);
        finalOrderId = order.id;
      } else {
        // Razorpay flow
        const methodParam = paymentMethod.toLowerCase(); // 'upi' or 'card'
        
        // Step 1: Create order on backend (Edge Function)
        const orderData = await createRazorpayOrder(
          finalTotal,
          `order_${Date.now()}`
        );

        // Step 1.5: Save order to Supabase as pending_payment
        const pendingOrder = await saveOrder(paymentMethod, null, orderData.order_id, 'pending_payment');

        // Step 2: Open Razorpay checkout
        const paymentResult = await openRazorpayCheckout({
          key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          name: "BludWear",
          description: `Order of ${cartItems.length} item(s)`,
          image: "https://res.cloudinary.com/duobc58vr/image/upload/v1781941751/1.jpg_1_gaqvnn.jpg",
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

        // Step 3: Verify Razorpay payment signature securely on backend
        await verifyRazorpayPayment(
          paymentResult.razorpay_order_id,
          paymentResult.razorpay_payment_id,
          paymentResult.razorpay_signature
        );

        // Step 4: Update order to 'paid' in Supabase
        await updateOrderToPaid(pendingOrder.id, paymentResult.razorpay_payment_id);
        finalOrderId = pendingOrder.id;
      }

      // --- AUTOMATIC SHIPROCKET BOOKING ---
      if (finalOrderId) {
        try {
          console.log("Automatically booking shipment with Shiprocket...");
          const token = (await supabase.auth.getSession()).data.session?.access_token;
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-shiprocket-shipment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              order_id: finalOrderId,
              weight: 0.5,
              dimensions: { length: 10, width: 10, height: 10 }
            })
          });
        } catch (shiprocketErr) {
          console.error("Failed to automatically book on Shiprocket:", shiprocketErr);
          // We do not block the order success page if Shiprocket fails. 
          // The admin can manually retry from the admin panel.
        }
      }
      // ------------------------------------

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

  const saveOrder = async (method, paymentId, razorpayOrderId, initialStatus = 'confirmed') => {
    const orderPayload = {
      user_id: user.id,
      total_amount: finalTotal,
      subtotal: basePrice,
      gst_amount: gstAmount,
      discount_amount: discountAmount,
      status: initialStatus === 'pending_payment' ? 'pending' : 'confirmed',
      shipping_name: shipping.name,
      shipping_phone: shipping.phone,
      shipping_address: `${shipping.address}, ${shipping.city}, ${shipping.state}`,
      shipping_pincode: shipping.pincode,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      payment_method: method,
      payment_status: method === 'COD' ? 'pending' : (initialStatus === 'pending_payment' ? 'pending' : 'paid'),
      razorpay_order_id: razorpayOrderId,
      payment_id: paymentId
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

    // Deduct stock inventory for placed order items
    try {
      await deductOrderItems(orderItemsPayload);
    } catch (deductErr) {
      console.error("Failed to deduct inventory stock:", deductErr);
    }

    // Auto-book on Shiprocket (Silently fail if Shiprocket is down)
    try {
      await supabase.functions.invoke('book-shiprocket-shipment', {
        body: { 
          order_id: orderData.id,
          weight: 0.5,
          dimensions: { length: 10, width: 10, height: 10 }
        }
      });
    } catch (shiprocketErr) {
      console.error("Auto-booking on Shiprocket failed:", shiprocketErr);
    }

    // Clear Cart
    if (initialStatus !== 'pending_payment') {
      await clearCart(user.id);
      await refreshCart();
      // Redirect to success
      navigate('/order-success', { state: { order: orderData } });
    }

    return orderData;
  };

  const updateOrderToPaid = async (orderId, paymentId) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        payment_id: paymentId
      })
      .eq('id', orderId);

    if (error) throw error;

    await clearCart(user.id);
    await refreshCart();

    // Re-fetch order to pass to success page
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    navigate('/order-success', { state: { order: data } });
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
                  <input type="tel" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength="15" required />
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
                  <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required />
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
                    <input type="text" name="name" required value={shipping.name} onChange={handleShippingChange} maxLength="100" />
                  </div>
                  <div className="input-group">
                    <label>Mobile Number *</label>
                    <input type="tel" name="phone" required value={shipping.phone} onChange={handleShippingChange} maxLength="15" />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Address *</label>
                  <input type="text" name="address" required value={shipping.address} onChange={handleShippingChange} placeholder="House/Flat No., Street, Area" maxLength="300" />
                </div>
                
                <div className="form-row three-cols">
                  <div className="input-group">
                    <label>City *</label>
                    <input type="text" name="city" required value={shipping.city} onChange={handleShippingChange} maxLength="100" />
                  </div>
                  <div className="input-group">
                    <label>State *</label>
                    <input type="text" name="state" required value={shipping.state} onChange={handleShippingChange} maxLength="100" />
                  </div>
                  <div className="input-group">
                    <label>Pincode *</label>
                    <input type="text" name="pincode" required value={shipping.pincode} onChange={handleShippingChange} maxLength="10" />
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

              {/* Promo Code Input Box */}
              <form onSubmit={handleApplyPromo} className="promo-code-form" style={{ margin: '1.5rem 0', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                <div className="promo-input-group" style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="DISCOUNT CODE"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    maxLength="20"
                    style={{
                      flex: 1,
                      backgroundColor: '#050505',
                      border: '1px solid #222',
                      color: '#fff',
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontWeight: '700'
                    }}
                  />
                  <button 
                    type="submit" 
                    className="apply-promo-btn"
                    style={{
                      backgroundColor: '#fff',
                      color: '#000',
                      border: 'none',
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.8rem',
                      fontWeight: '900',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="promo-message error" style={{ color: '#ff3b30', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{promoError}</p>}
                {promoSuccess && <p className="promo-message success" style={{ color: '#2ecc71', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{promoSuccess}</p>}
                {appliedDiscount && (
                  <div className="applied-code-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #333', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', marginTop: '0.75rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                    <span>{appliedDiscount.code}</span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAppliedDiscount(null);
                        setPromoCode('');
                        setPromoSuccess('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '1rem', padding: '0', display: 'flex', alignItems: 'center' }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {hasBundle && !appliedDiscount && (
                  <p className="auto-promo-info" style={{ color: '#2ecc71', fontSize: '0.8rem', marginTop: '0.75rem', fontWeight: '600' }}>
                    🎉 Bundle Kit detected! Automatic 15% discount applied.
                  </p>
                )}
              </form>
              
              <div className="summary-totals">
                <div className="summary-line">
                  <span>Base Price</span>
                  <span>₹{basePrice.toFixed(2)}</span>
                </div>
                {activeDiscount && (
                  <div className="summary-line discount-line" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                    <span>Discount ({activeDiscount.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-line highlight">
                  <span>Shipping</span>
                  <span>{isCalculatingShipping ? 'Calculating...' : (shippingCost === 0 ? 'Enter Pincode' : `₹${shippingCost.toFixed(2)}`)}</span>
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

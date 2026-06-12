// Razorpay integration service
// Calls our Supabase Edge Function to securely get a Razorpay Order ID
// Then opens the Razorpay checkout modal

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Step 1: Create a Razorpay order via the Supabase Edge Function
 * This keeps your SECRET KEY safe on the server side.
 */
export const createRazorpayOrder = async (amountInINR, receipt) => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/create-razorpay-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount: amountInINR,
        currency: "INR",
        receipt,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create Razorpay order");
  }

  return response.json();
};

/**
 * Step 2: Open the Razorpay Checkout widget
 * @param {Object} options - Razorpay options including order_id and prefilled customer info
 * @returns {Promise<Object>} - Resolves with payment details on success
 */
export const openRazorpayCheckout = (options) => {
  return new Promise((resolve, reject) => {
    // Load Razorpay script dynamically if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => initiateCheckout(resolve, reject, options);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.body.appendChild(script);
    } else {
      initiateCheckout(resolve, reject, options);
    }
  });
};

function initiateCheckout(resolve, reject, options) {
  const rzp = new window.Razorpay({
    ...options,
    handler: (response) => {
      // Payment success handler
      resolve({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => {
        reject(new Error("Payment cancelled by user"));
      },
    },
  });

  rzp.open();
}

/**
 * Step 3: Verify the payment signature on the backend (Edge Function)
 */
export const verifyRazorpayPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/verify-razorpay-payment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to verify Razorpay payment");
  }

  return response.json();
};

// supabase/functions/book-shiprocket-shipment/index.ts
//
// This Edge Function securely books a shipment via Shiprocket.
// It authenticates using SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD secrets.
//
// Deploy with:
//   npx supabase functions deploy book-shiprocket-shipment

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, weight = 0.5, dimensions } = await req.json();

    if (!order_id) {
      throw new Error("Order ID is required");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are missing.");
    }

    // 1. Fetch the order and items using service role to bypass RLS
    const orderResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}&select=*,order_items(*,products(*))`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!orderResponse.ok) {
      const errText = await orderResponse.text();
      throw new Error(`Failed to fetch order: ${errText}`);
    }

    const orders = await orderResponse.json();
    if (!orders || orders.length === 0) {
      throw new Error("Order not found");
    }

    const order = orders[0];

    const SHIPROCKET_EMAIL = Deno.env.get("SHIPROCKET_EMAIL");
    const SHIPROCKET_PASSWORD = Deno.env.get("SHIPROCKET_PASSWORD");

    let shiprocket_order_id = "";
    let shiprocket_shipment_id = "";
    let shiprocket_status = "Pickup Scheduled";
    let shiprocket_awb = "";

    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      console.warn("Shiprocket credentials not configured. Running in simulation mode.");
      
      // Simulation mode
      shiprocket_order_id = `SR-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      shiprocket_shipment_id = `SR-SHIP-${Math.floor(1000000 + Math.random() * 9000000)}`;
      shiprocket_status = "Pickup Scheduled (Simulated)";
      shiprocket_awb = `SRTRK${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    } else {
      // Real Shiprocket API integration
      
      // Step A: Login to Shiprocket
      const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD })
      });

      if (!authRes.ok) {
        const errBody = await authRes.text();
        throw new Error(`Shiprocket auth failed: ${authRes.status} - ${errBody}`);
      }

      const authData = await authRes.json();
      const token = authData.token;
      if (!token) {
        throw new Error(`Shiprocket auth succeeded but no token returned. Response: ${JSON.stringify(authData)}`);
      }

      // Step B: Map payload
      const orderItems = (order.order_items || []).map((item: any) => ({
        name: item.products?.name || "Product Item",
        sku: item.products?.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "sku",
        units: item.quantity,
        selling_price: Number(String(item.price_at_time).replace(/[^0-9.-]+/g, "")) || 0
      }));

      // Map shipping address details
      const addressString = order.shipping_address || "Address Line 1";
      const nameParts = (order.shipping_name || "Guest Customer").split(" ");
      const firstName = nameParts[0] || "Guest";
      const lastName = nameParts.slice(1).join(" ") || "Customer";

      // Shiprocket requires a short alphanumeric order_id (not a UUID)
      const shortOrderId = `BW-${order.id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;

      // Pickup location must EXACTLY match your warehouse name in Shiprocket dashboard
      // Set SHIPROCKET_PICKUP_LOCATION secret if your warehouse isn't named "Primary"
      const pickupLocation = Deno.env.get("SHIPROCKET_PICKUP_LOCATION") || "Primary";

      // Calculate the billing breakdown
      const subtotal = Number(order.subtotal) || Number(order.total_amount) || 0;
      const discountAmount = Number(order.discount_amount) || 0;
      const totalAmount = Number(order.total_amount) || 0;
      // Formula: total = subtotal - discount + shipping
      const shippingCharges = Math.max(0, totalAmount - subtotal + discountAmount);

      const shiprocketPayload = {
        order_id: shortOrderId,
        order_date: new Date(order.created_at).toISOString().slice(0, 19).replace("T", " "),
        pickup_location: pickupLocation,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: addressString,
        billing_city: order.shipping_city || "Mumbai",
        billing_pincode: String(order.shipping_pincode || "400001"),
        billing_state: order.shipping_state || "Maharashtra",
        billing_country: "India",
        billing_email: order.contact_info?.email || "customer@example.com",
        billing_phone: String(order.shipping_phone || "9999999999"),
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: order.payment_method === "COD" ? "COD" : "Prepaid",
        sub_total: subtotal,
        discount: discountAmount,
        shipping_charges: shippingCharges,
        length: dimensions?.length || 10,
        breadth: dimensions?.width || 10,
        height: dimensions?.height || 10,
        weight: weight
      };

      console.log("Shiprocket payload:", JSON.stringify(shiprocketPayload));

      // Step C: Book order on Shiprocket
      const bookingRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(shiprocketPayload)
      });

      const bookingRawBody = await bookingRes.text();
      console.log(`Shiprocket booking response [${bookingRes.status}]:`, bookingRawBody);

      if (!bookingRes.ok) {
        throw new Error(`Shiprocket rejected the order (${bookingRes.status}): ${bookingRawBody}`);
      }

      const bookingData = JSON.parse(bookingRawBody);

      // Shiprocket sometimes returns 200 OK HTTP status but puts an error code in the JSON payload
      // Note: Shiprocket returns status_code: 1 for SUCCESS!
      if (bookingData.status_code !== undefined && 
          bookingData.status_code !== 200 && 
          bookingData.status_code !== 201 && 
          bookingData.status_code !== 1) {
        throw new Error(`Shiprocket rejected the order: ${bookingData.message || bookingRawBody}`);
      }
      
      if (bookingData.order_id === undefined && bookingData.payload?.order_id === undefined) {
        throw new Error(`Shiprocket failed to create order. Response: ${bookingRawBody}`);
      }

      // Shiprocket returns order_id and shipment_id at the top level
      // or sometimes nested inside payload
      shiprocket_order_id = String(
        bookingData.order_id ?? bookingData.payload?.order_id ?? ""
      );
      shiprocket_shipment_id = String(
        bookingData.shipment_id ?? bookingData.payload?.shipment_id ?? ""
      );
      shiprocket_status = bookingData.status || "Pickup Scheduled";
      shiprocket_awb = bookingData.awb_code ?? bookingData.payload?.awb_code ?? "";
    }

    // 2. Update the order in Supabase with booking details
    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${order_id}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          shiprocket_order_id,
          shiprocket_shipment_id,
          shiprocket_status,
          shiprocket_awb
        }),
      }
    );

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      throw new Error(`Failed to update order database record: ${errText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        shiprocket_order_id,
        shiprocket_shipment_id,
        shiprocket_status,
        shiprocket_awb
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

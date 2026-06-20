// supabase/functions/razorpay-webhook/index.ts
//
// This Edge Function listens for Razorpay Webhook events (e.g., payment.captured).
// It provides Server-to-Server reconciliation to handle dropped connections.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const payloadText = await req.text();
    
    const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Verify webhook signature
    // HMAC-SHA256(payload, secret)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(RAZORPAY_WEBHOOK_SECRET);
    const messageData = encoder.encode(payloadText);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (expectedSignature !== signature) {
      console.error("Invalid Webhook Signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const payload = JSON.parse(payloadText);
    const event = payload.event;
    
    console.log(`Razorpay Webhook Received Event: ${event}`);

    // We only care about successful payments for fulfillment
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      if (!razorpayOrderId) {
        return new Response("No order_id in payload", { status: 400 });
      }

      // Update Supabase Database
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?razorpay_order_id=eq.${razorpayOrderId}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: paymentId
        }),
      });

      if (!updateResponse.ok) {
        const errText = await updateResponse.text();
        console.error("Failed to update Supabase order:", errText);
        return new Response("Failed to update database", { status: 500 });
      }

      const updatedOrders = await updateResponse.json();
      if (updatedOrders.length > 0) {
        console.log(`Successfully reconciled order: ${updatedOrders[0].id}`);
      } else {
        console.log(`No matching order found for razorpay_order_id: ${razorpayOrderId}. Order might not be created yet.`);
      }
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

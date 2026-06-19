// supabase/functions/shiprocket-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      // Shiprocket might send a test ping with no body or invalid JSON
      return new Response("Webhook listening", { status: 200 });
    }
    
    console.log("Shiprocket Webhook Payload received:", payload);

    if (!payload || Object.keys(payload).length === 0) {
       // Just a test ping
       return new Response("Webhook active", { status: 200 });
    }

    const awb = payload.awb || payload.awb_code;
    const order_id = payload.order_id;
    const current_status = payload.current_status || payload.shipment_status || "Processing";

    if (!awb && !order_id) {
      return new Response("Missing awb or order_id in payload", { status: 400 });
    }

    // Map Shiprocket statuses to BludWear internal order status
    let mappedStatus = undefined;
    const statusUpper = current_status.toUpperCase();
    
    if (statusUpper.includes("DELIVERED")) {
      mappedStatus = "Delivered";
    } else if (statusUpper.includes("CANCEL")) {
      mappedStatus = "Cancelled";
    } else if (statusUpper.includes("SHIPPED") || statusUpper.includes("IN TRANSIT")) {
      mappedStatus = "Shipped";
    }

    let updateBody: any = {
      shiprocket_status: current_status
    };
    
    if (awb) {
      updateBody.shiprocket_awb = awb;
    }
    if (mappedStatus) {
      updateBody.status = mappedStatus;
    }

    // Attempt to match by shiprocket_order_id first, then by AWB
    let queryParams = "";
    if (order_id) {
      queryParams = `shiprocket_order_id=eq.${order_id}`;
    } else if (awb) {
      queryParams = `shiprocket_awb=eq.${awb}`;
    }

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders?${queryParams}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });

    if (!updateResponse.ok) {
      const errText = await updateResponse.text();
      console.error("Failed to update Supabase:", errText);
      return new Response("Failed to update database", { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order updated successfully" }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

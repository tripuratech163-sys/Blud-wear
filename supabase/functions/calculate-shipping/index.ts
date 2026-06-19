// supabase/functions/calculate-shipping/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { delivery_postcode, cod, weight = 0.5 } = await req.json();

    if (!delivery_postcode) {
      return new Response(JSON.stringify({ error: "delivery_postcode is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const SHIPROCKET_EMAIL = Deno.env.get("SHIPROCKET_EMAIL");
    const SHIPROCKET_PASSWORD = Deno.env.get("SHIPROCKET_PASSWORD");

    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      throw new Error("Missing Shiprocket credentials");
    }

    // Login to Shiprocket
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }),
    });

    if (!authRes.ok) {
      throw new Error("Shiprocket Authentication Failed");
    }

    const authData = await authRes.json();
    const token = authData.token;

    // Call serviceability (Using 110030 as a standard dispatch postcode, can be adjusted)
    const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110030&delivery_postcode=${delivery_postcode}&weight=${weight}&cod=${cod ? 1 : 0}`;
    
    const serviceRes = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const serviceData = await serviceRes.json();

    if (!serviceRes.ok || !serviceData.data || !serviceData.data.available_courier_companies) {
      console.error("Serviceability error:", serviceData);
      // Fallback default flat rate if Shiprocket API fails to return couriers
      return new Response(JSON.stringify({ shipping_cost: cod ? 90 : 50 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Find the cheapest courier rate
    let cheapestRate = null;
    const couriers = serviceData.data.available_courier_companies;
    
    for (const courier of couriers) {
      // For prepaid, take 'rate'. For COD, we take 'rate' and add any additional cod charges if they are separated.
      // Shiprocket usually returns total cod charge in 'rate' if cod=1 was passed. We'll just use 'rate'.
      const rate = courier.rate;
      if (cheapestRate === null || rate < cheapestRate) {
        cheapestRate = rate;
      }
    }

    // If no couriers found
    if (cheapestRate === null) {
      cheapestRate = cod ? 90 : 50;
    }

    return new Response(JSON.stringify({ shipping_cost: Math.round(cheapestRate) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Shipping calculate error:", error.message);
    // Return a safe fallback so checkout doesn't break
    return new Response(JSON.stringify({ shipping_cost: 60 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

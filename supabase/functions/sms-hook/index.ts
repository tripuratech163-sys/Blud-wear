import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("Hello from SMS Hook Edge Function!")

serve(async (req) => {
  try {
    // 1. Parse the Webhook Payload from Supabase Auth
    const body = await req.json()
    console.log("Received payload:", body)

    // Supabase Auth SMS Hook payload typically looks like:
    // { user: { phone: '+919876543210' }, sms: { otp: '123456' } }
    const phone = body?.user?.phone || body?.phone || "";
    const otp = body?.sms?.otp || body?.otp || "";

    if (!phone || !otp) {
      throw new Error("Missing phone or otp in payload");
    }

    // 2. Format the phone number (Fast2SMS requires 10 digits without +91)
    // We strip everything except numbers, then take the last 10 digits.
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // 3. Get Fast2SMS API Key and Template ID from Edge Function Environment Secrets
    const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY');
    const otpId = Deno.env.get('FAST2SMS_OTP_ID');

    if (!fast2smsKey || !otpId) {
      throw new Error("FAST2SMS_API_KEY or FAST2SMS_OTP_ID is not set in Supabase Secrets");
    }

    // 4. Send the OTP via Fast2SMS using official OTP API (DLT Compliant)
    const response = await fetch("https://www.fast2sms.com/dev/otp/send", {
      method: "POST",
      headers: {
        "authorization": fast2smsKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: cleanPhone,
        otp_id: otpId,
        otp: otp
      })
    });

    const result = await response.json();
    console.log("Fast2SMS Response:", result);

    if (!response.ok || !result.return) {
      throw new Error(`Fast2SMS Error: ${JSON.stringify(result)}`);
    }

    // 5. Return success to Supabase so it knows the SMS was "delivered"
    return new Response(
      JSON.stringify({ success: true, message: "OTP sent via Fast2SMS" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("SMS Hook Error:", error.message)
    // Return 200 even on error so Supabase doesn't retry infinitely, but log the error
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { idToken, name } = await req.json()
    
    if (!idToken) {
      throw new Error("Missing idToken")
    }

    // 1. Verify Firebase token using Firebase REST API
    const firebaseApiKey = Deno.env.get('FIREBASE_API_KEY');
    if (!firebaseApiKey) throw new Error("FIREBASE_API_KEY secret missing");

    const fbVerifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });

    const fbData = await fbVerifyRes.json();
    if (fbData.error || !fbData.users || fbData.users.length === 0) {
      throw new Error("Invalid Firebase token");
    }

    const phoneNumber = fbData.users[0].phoneNumber;
    if (!phoneNumber) throw new Error("No phone number attached to this Firebase account");

    // 2. Initialize Supabase Admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Deterministic internal email for this phone number
    const internalEmail = `phone_${phoneNumber.replace('+', '')}@bludwear.internal`;
    
    // Generate a strong random password for this session
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();

    // 4. Try to find existing user or create a new one
    // In production with many users, listUsers is slow, but we can search by email using admin API
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let userExists = false;
    let userId = null;

    if (!listError && existingUsers?.users) {
      const match = existingUsers.users.find(u => u.email === internalEmail);
      if (match) {
        userExists = true;
        userId = match.id;
      }
    }

    if (userExists) {
      // Update password so frontend can log in immediately
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        password: tempPassword,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: name || 'User', phone: phoneNumber }
      });
      if (createError) throw createError;
    }

    // 5. Return credentials to frontend to login
    return new Response(
      JSON.stringify({ 
        success: true, 
        email: internalEmail, 
        password: tempPassword 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

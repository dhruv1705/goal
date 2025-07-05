import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { phoneNumber, otpCode } = await req.json();

  if (!phoneNumber || !otpCode) {
    return new Response(JSON.stringify({ error: 'Phone number and OTP code are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false,
      },
    },
  );

  const { data, error: dbError } = await supabaseClient
    .from('otps')
    .select('otp_code, created_at')
    .eq('phone_number', phoneNumber)
    .single();

  if (dbError) {
    console.error('Error fetching OTP:', dbError);
    if (dbError.code === 'PGRST116') {
      return new Response(JSON.stringify({ error: 'OTP not found or expired' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to retrieve OTP from database' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!data) {
    return new Response(JSON.stringify({ error: 'OTP not found for this phone number' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { otp_code: storedOtp, created_at } = data;

  const otpCreationTime = new Date(created_at).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutes = 5 * 60 * 1000;

  if (currentTime - otpCreationTime > fiveMinutes) {
    await supabaseClient.from('otps').delete().eq('phone_number', phoneNumber);
    return new Response(JSON.stringify({ error: 'OTP expired' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (otpCode === storedOtp) {
    await supabaseClient.from('otps').delete().eq('phone_number', phoneNumber);

    return new Response(JSON.stringify({ message: 'OTP verified successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid OTP' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 
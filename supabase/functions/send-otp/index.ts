import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';

serve(async (req) => {
  console.log('Edge Function send-otp invoked!');

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method Not Allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  let phoneNumber;
  try {
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);
    
    if (!bodyText || bodyText.trim() === '') {
      return new Response(JSON.stringify({
        error: 'Request body is empty'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const requestBody = JSON.parse(bodyText);
    phoneNumber = requestBody.phoneNumber;
    
    if (!phoneNumber) {
      return new Response(JSON.stringify({
        error: 'Phone number is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (jsonError) {
    console.error('Error parsing JSON:', jsonError);
    return new Response(JSON.stringify({
      error: 'Invalid JSON in request body'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        persistSession: false
      }
    }
  );

  const { error: dbError } = await supabaseClient.from('otps').upsert({
    phone_number: phoneNumber,
    otp_code: otp,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  }, {
    onConflict: 'phone_number'
  });

  if (dbError) {
    console.error('Error storing OTP:', dbError);
    return new Response(JSON.stringify({
      error: 'Failed to store OTP in database'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const fast2smsApiKey = Deno.env.get('FAST2SMS_API_KEY');
  
  if (!fast2smsApiKey) {
    return new Response(JSON.stringify({
      error: 'FAST2SMS_API_KEY is not set'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  const message = `Your OTP for Daily Schedule App is: ${otp}. Do not share this code.`;
  const fast2smsUrl = 'https://www.fast2sms.com/dev/bulkV2';

  const payload = {
    route: 'q',
    message: message,
    language: 'english',
    flash: 0,
    numbers: phoneNumber
  };

  try {
    const response = await fetch(fast2smsUrl, {
      method: 'POST',
      headers: {
        'authorization': fast2smsApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify({
        message: 'OTP sent successfully',
        data
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.error('Fast2SMS error:', data);
      return new Response(JSON.stringify({
        error: data.message || 'Failed to send OTP via Fast2SMS'
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Network error sending OTP:', error);
    return new Response(JSON.stringify({
      error: 'Network error while sending OTP'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
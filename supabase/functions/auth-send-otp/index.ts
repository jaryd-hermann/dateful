import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dev-mode',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, email, password } = await req.json()

    if (!phone || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Phone, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('otp_verifications').delete().eq('phone', phone)

    const { error: insertError } = await supabase.from('otp_verifications').insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      return new Response(
        JSON.stringify({ error: 'Twilio not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const body = new URLSearchParams({
      To: phone,
      From: twilioPhone,
      Body: `Your Dateful verification code is: ${code}. It expires in 10 minutes.`,
    })

    const devMode = req.headers.get('X-Dev-Mode') === 'true'

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
      },
      body: body.toString(),
    })

    if (!twilioRes.ok) {
      const twilioError = await twilioRes.text()
      console.error('Twilio error:', twilioError)

      let userMessage = 'Failed to send verification code'
      if (twilioError.includes('21608') || twilioError.includes('not yet verified')) {
        userMessage =
          'Twilio trial accounts can only send to verified numbers. Add your phone at console.twilio.com under Phone Numbers → Verified Caller IDs.'
      } else if (twilioError.includes('21614')) {
        userMessage = 'Invalid phone number. Please check the number and try again.'
      }

      if (devMode) {
        userMessage += ` (Dev: code was ${code})`
      }

      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(devMode ? { success: true, devCode: code } : { success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('auth-send-otp error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const formData = await req.formData()
    const from = formData.get('From')?.toString() || ''
    const body = formData.get('Body')?.toString() || ''

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: user } = await supabase
      .from('users')
      .select('id, name, couple_id')
      .eq('phone', from)
      .single()

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    const sendSms = async (to: string, text: string) => {
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) return
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
        body: new URLSearchParams({
          To: to,
          From: twilioPhone,
          Body: text,
        }).toString(),
      })
    }

    if (!user?.couple_id || !apiKey) {
      await sendSms(from, "Hi! I'm Dateful. It looks like you're not set up yet — sign up at dateful.chat to get started!")
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('city, neighborhood, budget, frequency, interests')
      .eq('id', user.couple_id)
      .single()

    const { data: recentConvos } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('couple_id', user.couple_id)
      .order('created_at', { ascending: false })
      .limit(20)

    const convoHistory = (recentConvos || []).reverse()
    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const c of convoHistory) {
      apiMessages.push({
        role: c.role === 'assistant' ? 'assistant' : 'user',
        content: c.content,
      })
    }
    apiMessages.push({ role: 'user', content: body })

    const systemPrompt = `You are Dateful, a warm date night planning assistant. You're texting with ${user.name || 'a user'}.

City: ${couple?.city || 'Unknown'}, Budget: ${couple?.budget || '$$'}, Interests: ${(couple?.interests || []).join(', ') || 'general'}

Be warm, brief (1-3 sentences), and conversational. Write like a friend texting.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    const data = await res.json()
    const responseText =
      data.content?.find((c: { type: string }) => c.type === 'text')?.text ||
      "I'm not sure how to respond — try asking about date ideas!"

    await supabase.from('conversations').insert([
      { couple_id: user.couple_id, user_id: user.id, role: 'user', content: body, channel: 'sms', context_type: 'general', twilio_message_sid: formData.get('MessageSid')?.toString() },
      { couple_id: user.couple_id, role: 'assistant', content: responseText, channel: 'sms', context_type: 'general' },
    ])

    await sendSms(from, responseText)

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (err) {
    console.error('webhook-twilio-inbound error:', err)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
})

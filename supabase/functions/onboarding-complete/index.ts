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

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { answers } = await req.json()
    if (!answers) {
      return new Response(
        JSON.stringify({ error: 'Answers required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: primaryUser, error: userError } = await supabase
      .from('users')
      .select('id, email, phone')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !primaryUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('users').update({ name: answers.primary_name || '' }).eq('id', primaryUser.id)

    let partnerUser = null
    const partnerPhone = answers.partner_phone?.trim?.() || answers.partner_phone
    if (partnerPhone) {
      partnerUser = await supabase
        .from('users')
        .select('id')
        .eq('phone', partnerPhone)
        .single()
        .then((r) => r.data)

      if (!partnerUser) {
        const { data: newPartner, error: partnerInsertError } = await supabase
          .from('users')
          .insert({
            phone: partnerPhone,
            name: answers.partner_name || '',
            role: 'partner',
          })
          .select('id')
          .single()

        if (partnerInsertError) {
          console.error('Partner insert error:', partnerInsertError)
          return new Response(
            JSON.stringify({ error: 'Failed to create partner profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        partnerUser = newPartner
      }
    }

    const preferredDays = Array.isArray(answers.preferred_days) ? answers.preferred_days : [answers.preferred_days]
    const preferredWeeknights = Array.isArray(answers.preferred_weeknights) ? answers.preferred_weeknights : (answers.preferred_weeknights ? [answers.preferred_weeknights] : [])
    const interests = Array.isArray(answers.interests) ? answers.interests : [answers.interests]

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        primary_user_id: primaryUser.id,
        partner_user_id: partnerUser?.id ?? null,
        city: answers.city || '',
        neighborhood: answers.city?.includes(',') ? answers.city.split(',')[1]?.trim() || '' : '',
        travel_radius: answers.travel_radius || 'borough',
        budget: answers.budget || '$$',
        frequency: answers.frequency || 'biweekly',
        preferred_days: preferredDays.filter(Boolean),
        preferred_weeknights: preferredWeeknights.length > 0 ? preferredWeeknights.filter(Boolean) : null,
        interests: interests.filter(Boolean),
        food_dislikes: answers.food_dislikes?.trim() || null,
        dietary_restrictions: answers.dietary_restrictions || null,
        anything_else: answers.anything_else?.trim() || null,
        surprise_preference: answers.surprise_preference || 'approve_first',
        onboarding_complete: true,
      })
      .select('id')
      .single()

    if (coupleError) {
      console.error('Couple insert error:', coupleError)
      const errMsg = coupleError.code === '23502'
        ? `Missing required field: ${coupleError.column || 'unknown'}`
        : coupleError.code === '23503'
          ? 'Referenced user or record not found'
          : coupleError.message || 'Failed to create couple profile'
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('users').update({ couple_id: couple.id }).eq('id', primaryUser.id)
    if (partnerUser) {
      await supabase.from('users').update({ couple_id: couple.id }).eq('id', partnerUser.id)
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')

    const primaryName = answers.primary_name || 'Your partner'
    const partnerName = answers.partner_name || 'there'
    const city = answers.city || 'your city'
    const appUrl = Deno.env.get('APP_URL') || 'https://dateful.chat'

    const primaryPhone = primaryUser.phone
    const primaryWelcomeMessage = `Hey ${primaryName}, I'm Lucy, your Dateful planning assistant. I'll send you some ideas in a few minutes to start getting a sense of your and ${partnerName}'s ideal date night.`
    const inviteMessage = `Hey ${partnerName}! ${primaryName} signed you both up for Dateful — I'm your date night planning assistant. I'll help find amazing things to do together in ${city}. To start, I'd love to learn what you're into. Check out your date ideas here → ${appUrl}/cards`

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const twilioAuth = twilioAccountSid && twilioAuthToken && twilioPhone

    if (twilioAuth && primaryPhone) {
      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
        body: new URLSearchParams({
          To: primaryPhone,
          From: twilioPhone,
          Body: primaryWelcomeMessage,
        }).toString(),
      })
    }

    if (twilioAuth && partnerPhone) {
      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
        body: new URLSearchParams({
          To: partnerPhone,
          From: twilioPhone,
          Body: inviteMessage,
        }).toString(),
      })
    }

    return new Response(
      JSON.stringify({ success: true, couple_id: couple.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('onboarding-complete error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

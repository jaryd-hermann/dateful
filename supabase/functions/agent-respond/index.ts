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
    const anonKey = Deno.env.get('ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser()

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { message } = await req.json()
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: primaryUser } = await supabase
      .from('users')
      .select('id, name, couple_id')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!primaryUser?.couple_id) {
      return new Response(
        JSON.stringify({ error: 'Complete onboarding first' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('city, neighborhood, budget, frequency, interests, preferred_days, preferred_weeknights, food_dislikes, dietary_restrictions, anything_else')
      .eq('id', primaryUser.couple_id)
      .single()

    const { data: recentConvos } = await supabase
      .from('conversations')
      .select('role, content')
      .eq('couple_id', primaryUser.couple_id)
      .order('created_at', { ascending: false })
      .limit(20)

    const convoHistory = (recentConvos || []).reverse()

    const systemPrompt = `You are Dateful, a warm and knowledgeable date night planning assistant for ${primaryUser.name || 'this couple'}.

## Couple Profile
- City: ${couple?.city || 'Unknown'}
- Neighborhood: ${couple?.neighborhood || 'Unknown'}
- Budget: ${couple?.budget || '$$'}
- Date frequency: ${couple?.frequency || 'biweekly'}
- Preferred days/times: ${(couple?.preferred_days || []).join(', ') || 'not specified'}
- Preferred weeknights (if weeknight): ${(couple?.preferred_weeknights || []).join(', ') || 'not specified'}
- Interests: ${(couple?.interests || []).join(', ') || 'general date activities'}
- Food dislikes: ${couple?.food_dislikes || 'none specified'}
- Dietary restrictions: ${couple?.dietary_restrictions || 'none'}
- Anything else: ${couple?.anything_else || 'nothing specified'}

## Guidelines
- Be warm, conversational, and concise. Write like a friend texting.
- You're helping plan date nights. Stay on topic but be helpful.
- Keep responses brief (2-4 sentences typically).
- If they ask about features you don't have yet, acknowledge and suggest what you can help with now.
- Don't make up specific venue names or details—you can say you'll look into it.`

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Agent not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const c of convoHistory) {
      apiMessages.push({
        role: c.role === 'assistant' ? 'assistant' : 'user',
        content: c.content,
      })
    }
    apiMessages.push({ role: 'user', content: message })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Claude API error:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed to get response from agent' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await res.json()
    const responseText =
      data.content?.find((c: { type: string }) => c.type === 'text')?.text || 'Sorry, I could not respond.'

    await supabase.from('conversations').insert([
      { couple_id: primaryUser.couple_id, user_id: primaryUser.id, role: 'user', content: message, channel: 'web', context_type: 'general' },
      { couple_id: primaryUser.couple_id, role: 'assistant', content: responseText, channel: 'web', context_type: 'general' },
    ])

    return new Response(
      JSON.stringify({ response: responseText }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('agent-respond error:', err)
    return new Response(
      JSON.stringify({ error: 'Something went wrong' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  message: string
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
}

interface RateLimitRecord {
  user_id: string
  daily_count: number
  hourly_count: number
  last_daily_reset: string
  last_hourly_reset: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Claude API key from environment
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { message, conversationHistory }: ChatRequest = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(supabase, user.id)
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          dailyRemaining: rateLimitResult.dailyRemaining,
          hourlyRemaining: rateLimitResult.hourlyRemaining 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Claude API
    const aiResponse = await callClaudeAPI(claudeApiKey, message, conversationHistory || [])

    // Update rate limit counters
    await updateRateLimit(supabase, user.id)

    // Return response
    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        dailyRemaining: rateLimitResult.dailyRemaining - 1,
        hourlyRemaining: rateLimitResult.hourlyRemaining - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in chat-ai function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkRateLimit(supabase: any, userId: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentHour = new Date().toISOString().slice(0, 13) + ':00:00.000Z'

  // Get or create rate limit record
  let { data: rateLimitData, error } = await supabase
    .from('ai_usage_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !rateLimitData) {
    // Create new rate limit record
    const { data: newRecord, error: insertError } = await supabase
      .from('ai_usage_limits')
      .insert({
        user_id: userId,
        daily_count: 0,
        hourly_count: 0,
        last_daily_reset: today,
        last_hourly_reset: currentHour
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }
    rateLimitData = newRecord
  }

  let dailyCount = rateLimitData.daily_count
  let hourlyCount = rateLimitData.hourly_count

  // Reset daily count if new day
  if (rateLimitData.last_daily_reset !== today) {
    dailyCount = 0
  }

  // Reset hourly count if new hour
  if (rateLimitData.last_hourly_reset !== currentHour) {
    hourlyCount = 0
  }

  const DAILY_LIMIT = 50
  const HOURLY_LIMIT = 10

  return {
    allowed: dailyCount < DAILY_LIMIT && hourlyCount < HOURLY_LIMIT,
    dailyRemaining: Math.max(0, DAILY_LIMIT - dailyCount),
    hourlyRemaining: Math.max(0, HOURLY_LIMIT - hourlyCount)
  }
}

async function updateRateLimit(supabase: any, userId: string) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentHour = new Date().toISOString().slice(0, 13) + ':00:00.000Z'

  // Get current counts
  const { data: current } = await supabase
    .from('ai_usage_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  let dailyCount = (current?.last_daily_reset === today) ? current.daily_count + 1 : 1
  let hourlyCount = (current?.last_hourly_reset === currentHour) ? current.hourly_count + 1 : 1

  // Update counts
  await supabase
    .from('ai_usage_limits')
    .upsert({
      user_id: userId,
      daily_count: dailyCount,
      hourly_count: hourlyCount,
      last_daily_reset: today,
      last_hourly_reset: currentHour,
      updated_at: now.toISOString()
    })
}

async function callClaudeAPI(apiKey: string, message: string, conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>) {
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: message }
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: messages,
      system: `You are a helpful AI assistant that specializes in goal setting and productivity. Your role is to guide users through a structured conversation to create actionable goals.

CONVERSATION FLOW:
1. **Category Selection**: Help users choose from: Physical Health, Mental Health, Finance, or Social
2. **Goal Definition**: Get specific about what they want to achieve (e.g., "lose 20 pounds", "save $10,000", "improve communication skills")
3. **Goal Breakdown**: Help break the goal into smaller, actionable steps
4. **Timeline & Priority**: Discuss when they want to achieve this and how important it is
5. **Task Creation**: Offer to create specific goals and tasks in their app

CATEGORY DESCRIPTIONS:
- **Physical Health**: fitness, nutrition, health habits, medical goals
- **Mental Health**: stress management, mindfulness, personal growth, therapy
- **Finance**: budgeting, savings, income goals, debt reduction, investments
- **Social**: relationships, networking, social skills, family time

CONVERSATION STYLE:
- Be encouraging and supportive
- Ask one focused question at a time
- Keep responses concise (2-3 sentences max)
- Use examples to clarify when helpful
- When ready to create goals, explicitly ask: "Should I create these goals and tasks in your app?"

GOAL CREATION FORMAT:
When creating goals, structure your response like this:
🎯 **Goal Title**: [Clear, specific title]
📝 **Description**: [Brief description]  
🏷️ **Category**: [Physical Health/Mental Health/Finance/Social]
📅 **Target**: [Timeline if mentioned]

**Tasks**:
- Task 1: [Specific action]
- Task 2: [Specific action]
- Task 3: [Specific action]

Start by asking which life area they'd like to improve.`
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data.content && data.content[0] && data.content[0].text) {
    return data.content[0].text
  } else {
    throw new Error('Unexpected response format from Claude API')
  }
}
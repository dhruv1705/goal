import { supabase } from './supabase'

interface ChatResponse {
  response: string
  dailyRemaining: number
  hourlyRemaining: number
}

interface ChatError {
  error: string
  dailyRemaining?: number
  hourlyRemaining?: number
}

class ClaudeService {
  constructor() {
    // No initialization needed - using backend API
  }

  async sendMessage(message: string, conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = []): Promise<ChatResponse> {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in to use AI features.')
      }

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message,
          conversationHistory
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw new Error('Failed to get AI response. Please try again.')
      }

      // Check if it's a rate limit error
      if (data.error) {
        if (data.error === 'Rate limit exceeded') {
          throw new RateLimitError(data.error, data.dailyRemaining || 0, data.hourlyRemaining || 0)
        }
        throw new Error(data.error)
      }

      return {
        response: data.response,
        dailyRemaining: data.dailyRemaining || 0,
        hourlyRemaining: data.hourlyRemaining || 0
      }
    } catch (error) {
      console.error('Error calling AI service:', error)
      if (error instanceof RateLimitError) {
        throw error
      }
      throw new Error('Failed to get response from AI assistant')
    }
  }

  isReady(): boolean {
    // Always ready since we're using backend API
    return true
  }

  // Get current rate limit status
  async getRateLimitStatus(): Promise<{ dailyRemaining: number, hourlyRemaining: number } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const { data } = await supabase
        .from('ai_usage_limits')
        .select('daily_count, hourly_count, last_daily_reset, last_hourly_reset')
        .eq('user_id', session.user.id)
        .single()

      if (!data) {
        return { dailyRemaining: 50, hourlyRemaining: 10 } // Default limits
      }

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentHour = now.toISOString().slice(0, 13) + ':00:00.000Z'

      const dailyCount = data.last_daily_reset === today ? data.daily_count : 0
      const hourlyCount = data.last_hourly_reset === currentHour ? data.hourly_count : 0

      return {
        dailyRemaining: Math.max(0, 50 - dailyCount),
        hourlyRemaining: Math.max(0, 10 - hourlyCount)
      }
    } catch (error) {
      console.error('Error getting rate limit status:', error)
      return null
    }
  }
}

export class RateLimitError extends Error {
  public dailyRemaining: number
  public hourlyRemaining: number

  constructor(message: string, dailyRemaining: number, hourlyRemaining: number) {
    super(message)
    this.name = 'RateLimitError'
    this.dailyRemaining = dailyRemaining
    this.hourlyRemaining = hourlyRemaining
  }
}

export const claudeService = new ClaudeService()
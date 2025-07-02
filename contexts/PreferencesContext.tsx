import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export interface UserPreference {
  id: string
  user_id: string
  category: string
  priority_score: number
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface UserOnboarding {
  id: string
  user_id: string
  completed_at: string
  primary_goal: string | null
  motivation_context: string | null
  created_at: string
}

export interface CategoryPriority {
  category: string
  priority_score: number
  is_primary: boolean
  color: string
  icon: string
}

interface PreferencesContextType {
  preferences: UserPreference[]
  categoryPriorities: CategoryPriority[]
  onboardingCompleted: boolean
  primaryCategory: string | null
  secondaryCategories: string[]
  loading: boolean
  error: string | null
  refreshPreferences: () => Promise<void>
  updatePreferences: (newPreferences: Partial<UserPreference>[]) => Promise<void>
  getPriorityScore: (category: string) => number
  getOrderedCategories: () => CategoryPriority[]
  markOnboardingComplete: (data: { primary_goal: string; motivation_context?: string }) => Promise<void>
  completeOnboardingLocally: () => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const CATEGORY_INFO = {
  'Physical Health': { color: '#FF6B6B', icon: '💪' },
  'Mental Health': { color: '#4ECDC4', icon: '🧠' },
  'Finance': { color: '#45B7D1', icon: '💰' },
  'Social': { color: '#96CEB4', icon: '👥' },
}

interface PreferencesProviderProps {
  children: ReactNode
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreference[]>([])
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Derived state
  const categoryPriorities: CategoryPriority[] = Object.keys(CATEGORY_INFO).map(category => {
    const preference = preferences.find(p => p.category === category)
    const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]
    
    return {
      category,
      priority_score: preference?.priority_score || 25,
      is_primary: preference?.is_primary || false,
      color: categoryInfo.color,
      icon: categoryInfo.icon,
    }
  })

  const primaryCategory = categoryPriorities.find(cp => cp.is_primary)?.category || null
  const secondaryCategories = categoryPriorities
    .filter(cp => !cp.is_primary && cp.priority_score > 25)
    .map(cp => cp.category)

  const getPriorityScore = (category: string): number => {
    const preference = preferences.find(p => p.category === category)
    return preference?.priority_score || 25
  }

  const getOrderedCategories = (): CategoryPriority[] => {
    return [...categoryPriorities].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1
      if (!a.is_primary && b.is_primary) return 1
      return b.priority_score - a.priority_score
    })
  }

  const fetchPreferences = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('priority_score', { ascending: false })

      if (preferencesError) {
        console.error('Error fetching preferences:', preferencesError)
        throw preferencesError
      }

      // Fetch onboarding status
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('Error fetching onboarding status:', onboardingError)
        // Don't throw here as onboarding record might not exist for new users
      }

      setPreferences(preferencesData || [])
      setOnboardingCompleted(!!onboardingData)
      
      // If no preferences exist, create default balanced preferences
      if (!preferencesData || preferencesData.length === 0) {
        await createDefaultPreferences()
      }
    } catch (err: any) {
      console.error('Error in fetchPreferences:', err)
      setError(err.message || 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPreferences = async () => {
    if (!user) return

    try {
      const defaultPreferences = Object.keys(CATEGORY_INFO).map(category => ({
        user_id: user.id,
        category,
        priority_score: 25,
        is_primary: false,
      }))

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(defaultPreferences, { onConflict: 'user_id,category' })
        .select('*')

      if (error) {
        console.error('Error creating default preferences:', error)
        throw error
      }

      if (data) {
        setPreferences(data)
      }
    } catch (err: any) {
      console.error('Error creating default preferences:', err)
      setError(err.message || 'Failed to create default preferences')
    }
  }

  const updatePreferences = async (newPreferences: Partial<UserPreference>[]) => {
    if (!user) return

    try {
      setError(null)
      
      const preferencesData = newPreferences.map(pref => ({
        user_id: user.id,
        ...pref,
      }))

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, { onConflict: 'user_id,category' })
        .select('*')

      if (error) {
        console.error('Error updating preferences:', error)
        throw error
      }

      if (data) {
        setPreferences(data)
      }
    } catch (err: any) {
      console.error('Error in updatePreferences:', err)
      setError(err.message || 'Failed to update preferences')
      throw err
    }
  }

  const markOnboardingComplete = async (data: { primary_goal: string; motivation_context?: string }) => {
    if (!user) return

    try {
      setError(null)

      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          primary_goal: data.primary_goal,
          motivation_context: data.motivation_context || null,
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error marking onboarding complete:', error)
        throw error
      }

      // Immediately update local state
      console.log('Marking onboarding as completed locally')
      setOnboardingCompleted(true)
      
      // Also refresh preferences to get the latest data
      await refreshPreferences()
    } catch (err: any) {
      console.error('Error in markOnboardingComplete:', err)
      setError(err.message || 'Failed to complete onboarding')
      throw err
    }
  }

  const completeOnboardingLocally = () => {
    console.log('Setting onboarding completed to true locally')
    setOnboardingCompleted(true)
  }

  const refreshPreferences = async () => {
    await fetchPreferences()
  }

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      fetchPreferences()
    } else {
      setPreferences([])
      setOnboardingCompleted(false)
      setLoading(false)
    }
  }, [user])

  const value: PreferencesContextType = {
    preferences,
    categoryPriorities,
    onboardingCompleted,
    primaryCategory,
    secondaryCategories,
    loading,
    error,
    refreshPreferences,
    updatePreferences,
    getPriorityScore,
    getOrderedCategories,
    markOnboardingComplete,
    completeOnboardingLocally,
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { GuestDataManager, GuestOnboardingData } from '../lib/guestDataManager'

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
  transferGuestDataToUser: () => Promise<boolean>
  checkAndTransferGuestData: () => Promise<boolean>
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

  const transferGuestDataToUser = async (): Promise<boolean> => {
    if (!user) {
      console.log('❌ No authenticated user for guest data transfer')
      return false
    }

    try {
      console.log('🔄 Starting guest data transfer to authenticated user...')
      
      // Get guest onboarding data
      const guestData = await GuestDataManager.getGuestOnboarding()
      if (!guestData) {
        console.log('No guest onboarding data found')
        return false
      }

      console.log('📦 Found guest data:', {
        category: guestData.selectedCategory?.name,
        goal: guestData.selectedGoal?.title,
        habitsCount: guestData.selectedHabits?.length || 0,
        demoXP: guestData.demoXP
      })

      // 1. Create goal in database
      let createdGoal = null
      if (guestData.selectedGoal) {
        const goalData = {
          user_id: user.id,
          title: guestData.selectedGoal.title,
          description: guestData.selectedGoal.description,
          category: guestData.selectedCategory?.name || 'Physical Health',
          status: 'active'
        }

        const { data: goalResult, error: goalError } = await supabase
          .from('goals')
          .insert(goalData)
          .select()
          .single()

        if (goalError) {
          console.error('Error creating goal from guest data:', goalError)
          throw goalError
        }

        createdGoal = goalResult
        console.log('✅ Goal created from guest data:', createdGoal.id)
      }

      // 2. Create schedules/habits linked to the goal
      if (createdGoal && guestData.selectedHabits && guestData.selectedHabits.length > 0) {
        const today = new Date()
        const schedulePromises = guestData.selectedHabits.map(async (habit, index) => {
          const scheduleDate = new Date(today)
          scheduleDate.setDate(today.getDate() + index)

          const scheduleData = {
            user_id: user.id,
            goal_id: createdGoal.id,
            title: habit.title,
            description: habit.description,
            schedule_date: scheduleDate.toISOString().split('T')[0],
            schedule_time: index === 0 ? '09:00' : index === 1 ? '18:00' : '12:00',
            completed: false,
            priority: 'medium'
          }

          return supabase.from('schedules').insert(scheduleData)
        })

        const scheduleResults = await Promise.all(schedulePromises)
        const scheduleErrors = scheduleResults.filter(result => result.error)
        
        if (scheduleErrors.length === 0) {
          console.log('✅ All schedules created from guest habits')
        } else {
          console.error('Some schedules failed to create:', scheduleErrors)
        }
      }

      // 3. Set category preferences based on guest selection
      if (guestData.selectedCategory) {
        const categoryPreferences = Object.keys(CATEGORY_INFO).map(category => ({
          user_id: user.id,
          category,
          priority_score: category === guestData.selectedCategory?.name ? 100 : 25,
          is_primary: category === guestData.selectedCategory?.name,
        }))

        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert(categoryPreferences, { onConflict: 'user_id,category' })

        if (prefError) {
          console.error('Error setting category preferences:', prefError)
        } else {
          console.log('✅ Category preferences set from guest data')
        }
      }

      // 4. Mark onboarding as complete with enhanced data
      const onboardingData = {
        user_id: user.id,
        primary_goal: guestData.selectedGoal?.id || 'transferred-from-guest',
        motivation_context: guestData.motivationContext || 'Transferred from guest experience',
        // Note: time_commitment and selected_category columns may not exist yet
        // Remove these if migration hasn't been applied:
        // time_commitment: guestData.timeCommitment,
        // selected_category: guestData.selectedCategory?.id || 'physical-health',
        completed_at: new Date().toISOString()
      }

      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert(onboardingData, { onConflict: 'user_id' })

      if (onboardingError) {
        console.error('Error saving onboarding from guest data:', onboardingError)
        throw onboardingError
      }

      console.log('✅ Onboarding completed with guest data')

      // 5. Update local state
      setOnboardingCompleted(true)

      // 6. Clear guest data after successful transfer
      await GuestDataManager.clearGuestOnboardingData()
      console.log('✅ Guest data cleared after successful transfer')

      // 7. Refresh preferences to get updated data
      await refreshPreferences()

      console.log('🎉 Guest data transfer completed successfully!')
      return true

    } catch (error) {
      console.error('❌ Error transferring guest data to user:', error)
      
      // If transfer fails, we should still clear guest data to prevent repeated failed attempts
      try {
        console.log('🧹 Clearing guest data due to transfer failure to prevent retry loops')
        await GuestDataManager.clearGuestOnboardingData()
      } catch (clearError) {
        console.error('❌ Failed to clear guest data after transfer error:', clearError)
      }
      
      return false
    }
  }

  const checkAndTransferGuestData = async (): Promise<boolean> => {
    if (!user) return false

    try {
      const hasGuestData = await GuestDataManager.hasGuestDataForTransfer()
      
      if (hasGuestData) {
        console.log('🔍 Guest data detected for authenticated user - transferring...')
        const transferred = await transferGuestDataToUser()
        return transferred
      } else {
        console.log('No guest data found for transfer')
        return false
      }
    } catch (error) {
      console.error('Error checking for guest data:', error)
      return false
    }
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
    transferGuestDataToUser,
    checkAndTransferGuestData,
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
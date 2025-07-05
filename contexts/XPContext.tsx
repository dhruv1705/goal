import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  UserXPProgress,
  XPTransaction,
  UserAchievement,
  ACHIEVEMENT_DEFINITIONS,
  AchievementDefinition
} from '../types/habits'

interface XPContextType {
  // XP Progress Data
  xpProgress: UserXPProgress | null
  recentTransactions: XPTransaction[]
  achievements: UserAchievement[]
  
  // Computed Properties
  currentLevel: number
  totalXP: number
  xpToNextLevel: number
  levelProgress: number // 0-100 percentage
  dailyXPGoal: number
  currentStreak: number
  bestStreak: number
  
  // Loading States
  loading: boolean
  error: string | null
  
  // Actions
  addXP: (amount: number, transactionType: XPTransaction['transaction_type'], description?: string, habitCompletionId?: string) => Promise<void>
  checkAndUnlockAchievements: () => Promise<UserAchievement[]>
  updateDailyXPGoal: (newGoal: number) => Promise<void>
  calculateLevelFromXP: (xp: number) => number
  getXPRequiredForLevel: (level: number) => number
  refreshXPData: () => Promise<void>
  
  // Achievement Helpers
  getAvailableAchievements: () => AchievementDefinition[]
  getUnlockedAchievements: () => UserAchievement[]
  getAchievementProgress: (achievementId: string) => number // 0-100 percentage
}

const XPContext = createContext<XPContextType | undefined>(undefined)

interface XPProviderProps {
  children: ReactNode
}

export const XPProvider: React.FC<XPProviderProps> = ({ children }) => {
  const { user } = useAuth()
  
  // State
  const [xpProgress, setXPProgress] = useState<UserXPProgress | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<XPTransaction[]>([])
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // XP Level Calculation (Exponential Growth)
  const calculateLevelFromXP = (xp: number): number => {
    if (xp < 100) return 1
    if (xp < 300) return 2
    if (xp < 600) return 3
    if (xp < 1000) return 4
    if (xp < 1500) return 5
    if (xp < 2100) return 6
    if (xp < 2800) return 7
    if (xp < 3600) return 8
    if (xp < 4500) return 9
    if (xp < 5500) return 10
    
    // Beyond level 10: each level requires 1000 more XP
    return Math.floor((xp - 5500) / 1000) + 11
  }
  
  const getXPRequiredForLevel = (level: number): number => {
    if (level <= 1) return 0
    if (level === 2) return 100
    if (level === 3) return 300
    if (level === 4) return 600
    if (level === 5) return 1000
    if (level === 6) return 1500
    if (level === 7) return 2100
    if (level === 8) return 2800
    if (level === 9) return 3600
    if (level === 10) return 4500
    if (level === 11) return 5500
    
    // Beyond level 11: each level requires 1000 more XP
    return 5500 + ((level - 11) * 1000)
  }
  
  // Computed Properties
  const currentLevel = xpProgress ? calculateLevelFromXP(xpProgress.total_xp) : 1
  const totalXP = xpProgress?.total_xp || 0
  const nextLevelXP = getXPRequiredForLevel(currentLevel + 1)
  const currentLevelXP = getXPRequiredForLevel(currentLevel)
  const xpToNextLevel = nextLevelXP - totalXP
  const levelProgress = currentLevelXP < nextLevelXP ? 
    Math.round(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100) : 100
  const dailyXPGoal = xpProgress?.daily_xp_goal || 50
  const currentStreak = xpProgress?.current_streak || 0
  const bestStreak = xpProgress?.best_streak || 0
  
  // Fetch user XP progress
  const fetchXPProgress = async () => {
    if (!user) {
      setXPProgress(null)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('user_xp_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        setXPProgress(data)
      } else {
        // Create initial XP progress record
        const { data: newProgress, error: createError } = await supabase
          .from('user_xp_progress')
          .insert({
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            xp_to_next_level: 100,
            daily_xp_goal: 50,
            current_streak: 0,
            best_streak: 0,
            last_activity_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single()
        
        if (createError) throw createError
        setXPProgress(newProgress)
      }
    } catch (err: any) {
      console.error('Error fetching XP progress:', err)
      setError(err.message)
    }
  }
  
  // Fetch recent XP transactions
  const fetchRecentTransactions = async () => {
    if (!user) {
      setRecentTransactions([])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      setRecentTransactions(data || [])
    } catch (err: any) {
      console.error('Error fetching XP transactions:', err)
    }
  }
  
  // Fetch user achievements
  const fetchAchievements = async () => {
    if (!user) {
      setAchievements([])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
      
      if (error) throw error
      setAchievements(data || [])
    } catch (err: any) {
      console.error('Error fetching achievements:', err)
    }
  }
  
  // Add XP and update progress
  const addXP = async (
    amount: number, 
    transactionType: XPTransaction['transaction_type'], 
    description?: string,
    habitCompletionId?: string
  ) => {
    if (!user || !xpProgress) throw new Error('User not authenticated or XP progress not loaded')
    
    try {
      setError(null)
      
      const newTotalXP = xpProgress.total_xp + amount
      const newLevel = calculateLevelFromXP(newTotalXP)
      const newXPToNext = getXPRequiredForLevel(newLevel + 1) - newTotalXP
      
      // Update streak if this is daily activity
      const today = new Date().toISOString().split('T')[0]
      const lastActivityDate = xpProgress.last_activity_date
      let newCurrentStreak = xpProgress.current_streak
      let newBestStreak = xpProgress.best_streak
      
      if (transactionType === 'habit_completion') {
        if (lastActivityDate === today) {
          // Same day, maintain streak
        } else {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          
          if (lastActivityDate === yesterdayStr) {
            // Consecutive day, increment streak
            newCurrentStreak += 1
            newBestStreak = Math.max(newBestStreak, newCurrentStreak)
          } else {
            // Streak broken, reset to 1
            newCurrentStreak = 1
          }
        }
      }
      
      // Update XP progress
      const { error: updateError } = await supabase
        .from('user_xp_progress')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel,
          xp_to_next_level: newXPToNext,
          current_streak: newCurrentStreak,
          best_streak: newBestStreak,
          last_activity_date: today
        })
        .eq('user_id', user.id)
      
      if (updateError) throw updateError
      
      // Create XP transaction record
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: user.id,
          habit_completion_id: habitCompletionId,
          xp_amount: amount,
          transaction_type: transactionType,
          description: description || `Earned ${amount} XP from ${transactionType}`
        })
      
      if (transactionError) throw transactionError
      
      // Check for level up achievement
      if (newLevel > xpProgress.current_level) {
        await addXP(50, 'level_bonus', `Level ${newLevel} reached!`)
      }
      
      // Refresh data
      await refreshXPData()
      
      // Check for new achievements
      await checkAndUnlockAchievements()
      
    } catch (err: any) {
      console.error('Error adding XP:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Check and unlock achievements
  const checkAndUnlockAchievements = async (): Promise<UserAchievement[]> => {
    if (!user) return []
    
    try {
      const newAchievements: UserAchievement[] = []
      const unlockedAchievementIds = achievements.map(a => a.achievement_id)
      
      // Check each achievement definition
      for (const achievementDef of ACHIEVEMENT_DEFINITIONS) {
        if (unlockedAchievementIds.includes(achievementDef.id)) {
          continue // Already unlocked
        }
        
        const isUnlocked = await checkAchievementCriteria(achievementDef)
        
        if (isUnlocked) {
          const newAchievement = {
            user_id: user.id,
            achievement_id: achievementDef.id,
            achievement_name: achievementDef.name,
            achievement_description: achievementDef.description,
            achievement_icon: achievementDef.icon,
            xp_reward: achievementDef.xp_reward,
            unlocked_at: new Date().toISOString()
          }
          
          const { data, error } = await supabase
            .from('user_achievements')
            .insert(newAchievement)
            .select()
            .single()
          
          if (error) throw error
          
          newAchievements.push(data)
          
          // Award achievement XP
          if (achievementDef.xp_reward > 0) {
            await addXP(achievementDef.xp_reward, 'achievement_bonus', `Achievement unlocked: ${achievementDef.name}`)
          }
        }
      }
      
      if (newAchievements.length > 0) {
        await fetchAchievements() // Refresh achievements list
      }
      
      return newAchievements
      
    } catch (err: any) {
      console.error('Error checking achievements:', err)
      return []
    }
  }
  
  // Check individual achievement criteria
  const checkAchievementCriteria = async (achievement: AchievementDefinition): Promise<boolean> => {
    if (!user) return false
    
    try {
      const { type, value } = achievement.unlock_criteria
      
      switch (type) {
        case 'habit_completions':
          const { data: completions, error: completionsError } = await supabase
            .from('habit_completions')
            .select('id')
            .eq('user_id', user.id)
          
          if (completionsError) throw completionsError
          return (completions?.length || 0) >= value
          
        case 'streak_days':
          return currentStreak >= value
          
        case 'level_completion':
          // This would require checking habit progress for specific level completion
          // For now, return false (implement when needed)
          return false
          
        case 'goal_completion':
          const { data: completedGoals, error: goalsError } = await supabase
            .from('user_active_goals')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
          
          if (goalsError) throw goalsError
          return (completedGoals?.length || 0) >= value
          
        case 'xp_milestone':
          return totalXP >= value
          
        default:
          return false
      }
    } catch (err: any) {
      console.error('Error checking achievement criteria:', err)
      return false
    }
  }
  
  // Update daily XP goal
  const updateDailyXPGoal = async (newGoal: number) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      const { error } = await supabase
        .from('user_xp_progress')
        .update({ daily_xp_goal: newGoal })
        .eq('user_id', user.id)
      
      if (error) throw error
      await fetchXPProgress()
    } catch (err: any) {
      console.error('Error updating daily XP goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Refresh all XP data
  const refreshXPData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchXPProgress(),
        fetchRecentTransactions(),
        fetchAchievements()
      ])
    } catch (err: any) {
      console.error('Error refreshing XP data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Achievement helpers
  const getAvailableAchievements = (): AchievementDefinition[] => {
    return ACHIEVEMENT_DEFINITIONS
  }
  
  const getUnlockedAchievements = (): UserAchievement[] => {
    return achievements
  }
  
  const getAchievementProgress = (achievementId: string): number => {
    const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId)
    if (!achievement) return 0
    
    const { type, value } = achievement.unlock_criteria
    
    switch (type) {
      case 'habit_completions':
        // Would need to fetch completion count - for now return 0
        return 0
        
      case 'streak_days':
        return Math.min(Math.round((currentStreak / value) * 100), 100)
        
      case 'xp_milestone':
        return Math.min(Math.round((totalXP / value) * 100), 100)
        
      default:
        return 0
    }
  }
  
  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshXPData()
    } else {
      setXPProgress(null)
      setRecentTransactions([])
      setAchievements([])
      setLoading(false)
    }
  }, [user])
  
  const value: XPContextType = {
    // XP Progress Data
    xpProgress,
    recentTransactions,
    achievements,
    
    // Computed Properties
    currentLevel,
    totalXP,
    xpToNextLevel,
    levelProgress,
    dailyXPGoal,
    currentStreak,
    bestStreak,
    
    // Loading States
    loading,
    error,
    
    // Actions
    addXP,
    checkAndUnlockAchievements,
    updateDailyXPGoal,
    calculateLevelFromXP,
    getXPRequiredForLevel,
    refreshXPData,
    
    // Achievement Helpers
    getAvailableAchievements,
    getUnlockedAchievements,
    getAchievementProgress
  }
  
  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  )
}

export const useXP = (): XPContextType => {
  const context = useContext(XPContext)
  if (context === undefined) {
    throw new Error('useXP must be used within an XPProvider')
  }
  return context
}
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useXP } from './XPContext'
import {
  Category,
  GoalTemplate,
  UserActiveGoal,
  GoalProgress,
  TimeCommitment,
  GoalStatus,
  UserHabitProgress,
  HabitTemplate
} from '../types/habits'

// Extended interfaces for Goal Journey
export interface GoalStats {
  daysActive: number
  habitsCompleted: number
  totalHabits: number
  xpEarned: number
  currentLevel: number
  totalLevels: number
  completionPercentage: number
  averageDailyProgress: number
  estimatedDaysRemaining: number
}

export interface JourneyStats {
  totalGoalsCompleted: number
  totalDaysActive: number
  totalXPEarned: number
  currentStreak: number
  longestStreak: number
  categoriesExplored: string[]
  averageGoalCompletionTime: number
  mostProductiveTimeOfDay: string
}

export interface WeeklyProgressData {
  week: string
  habitsCompleted: number
  xpEarned: number
  streakDays: number
  goalProgress: number
}

export interface UnlockRequirements {
  type: 'level' | 'goal_completion' | 'category_exploration' | 'streak' | 'xp_milestone'
  value: number
  description: string
  currentProgress: number
  isUnlocked: boolean
}

export interface GoalRecommendation {
  goal: GoalTemplate
  score: number
  reason: string
  difficulty: 'perfect_match' | 'slight_challenge' | 'big_challenge'
  estimatedTimeToComplete: number
}

interface GoalJourneyContextType {
  // Current State
  currentGoal: UserActiveGoal | null
  availableGoals: GoalTemplate[]
  completedGoals: UserActiveGoal[]
  goalProgress: GoalProgress | null
  goalStats: GoalStats | null
  
  // Categories & Organization
  categories: Category[]
  goalsByCategory: Record<string, GoalTemplate[]>
  
  // Progress & Analytics
  journeyStats: JourneyStats | null
  weeklyProgress: WeeklyProgressData[]
  
  // Discovery & Recommendations
  recommendedGoals: GoalRecommendation[]
  unlockedGoals: GoalTemplate[]
  
  // Loading States
  loading: boolean
  error: string | null
  
  // Core Actions
  selectGoal: (goalTemplateId: string, timeCommitment: TimeCommitment) => Promise<void>
  pauseGoal: () => Promise<void>
  resumeGoal: () => Promise<void>
  completeGoal: () => Promise<void>
  switchGoal: (newGoalTemplateId: string, reason?: string) => Promise<void>
  
  // Discovery & Search
  getRecommendedGoals: () => Promise<GoalRecommendation[]>
  getGoalsByCategory: (categoryName: string) => GoalTemplate[]
  searchGoals: (query: string) => GoalTemplate[]
  getPopularGoals: () => GoalTemplate[]
  
  // Progress & Analytics
  refreshProgress: () => Promise<void>
  getGoalStats: () => GoalStats | null
  getCompletionPrediction: () => { estimatedCompletionDate: Date, confidence: number } | null
  getWeeklyProgressData: () => Promise<WeeklyProgressData[]>
  
  // Unlock System
  canUnlockGoal: (goalId: string) => boolean
  getGoalUnlockRequirements: (goalId: string) => UnlockRequirements[]
  checkAndUnlockNewGoals: () => Promise<GoalTemplate[]>
}

const GoalJourneyContext = createContext<GoalJourneyContextType | undefined>(undefined)

interface GoalJourneyProviderProps {
  children: ReactNode
}

export const GoalJourneyProvider: React.FC<GoalJourneyProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const { currentLevel, totalXP, currentStreak } = useXP()
  
  // State
  const [currentGoal, setCurrentGoal] = useState<UserActiveGoal | null>(null)
  const [availableGoals, setAvailableGoals] = useState<GoalTemplate[]>([])
  const [completedGoals, setCompletedGoals] = useState<UserActiveGoal[]>([])
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null)
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [goalsByCategory, setGoalsByCategory] = useState<Record<string, GoalTemplate[]>>({})
  const [journeyStats, setJourneyStats] = useState<JourneyStats | null>(null)
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressData[]>([])
  const [recommendedGoals, setRecommendedGoals] = useState<GoalRecommendation[]>([])
  const [unlockedGoals, setUnlockedGoals] = useState<GoalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index')
      
      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      setError(err.message)
    }
  }
  
  // Fetch all goal templates
  const fetchGoalTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_templates')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name')
      
      if (error) {
        // Handle case where habit system tables don't exist
        if (error.code === '42P01') {
          console.log('Goal templates table does not exist, setting empty goals list')
          setAvailableGoals([])
          return
        }
        throw error
      }
      
      const goals = data || []
      setAvailableGoals(goals)
      
      // Organize by category
      const byCategory: Record<string, GoalTemplate[]> = {}
      goals.forEach(goal => {
        const categoryName = goal.category?.name || 'Other'
        if (!byCategory[categoryName]) {
          byCategory[categoryName] = []
        }
        byCategory[categoryName].push(goal)
      })
      setGoalsByCategory(byCategory)
      
    } catch (err: any) {
      console.error('Error fetching goal templates:', err)
      setError(err.message)
    }
  }
  
  // Fetch user's current active goal
  const fetchCurrentGoal = async () => {
    if (!user) {
      setCurrentGoal(null)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('user_active_goals')
        .select(`
          *,
          goal_template:goal_templates(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      setCurrentGoal(data && data.length > 0 ? data[0] : null)
    } catch (err: any) {
      console.error('Error fetching current goal:', err)
      setError(err.message)
    }
  }
  
  // Fetch user's completed goals
  const fetchCompletedGoals = async () => {
    if (!user) {
      setCompletedGoals([])
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('user_active_goals')
        .select(`
          *,
          goal_template:goal_templates(
            *,
            category:categories(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completion_date', { ascending: false })
      
      if (error) throw error
      setCompletedGoals(data || [])
    } catch (err: any) {
      console.error('Error fetching completed goals:', err)
    }
  }
  
  // Calculate goal progress and stats
  const calculateGoalProgress = async () => {
    if (!user || !currentGoal) {
      setGoalProgress(null)
      setGoalStats(null)
      return
    }
    
    try {
      // Fetch habit progress for current goal
      const { data: habitProgressData, error: habitError } = await supabase
        .from('user_habit_progress')
        .select(`
          *,
          habit_template:habit_templates(*)
        `)
        .eq('user_active_goal_id', currentGoal.id)
      
      if (habitError) throw habitError
      
      // Fetch habit completions for current goal
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', currentGoal.start_date)
      
      if (completionsError) throw completionsError
      
      const habitProgress = habitProgressData || []
      const completions = completionsData || []
      
      // Calculate statistics
      const totalHabits = habitProgress.length
      const completedHabits = habitProgress.filter(h => h.status === 'completed').length
      const inProgressHabits = habitProgress.filter(h => h.status === 'in_progress').length
      const availableHabits = habitProgress.filter(h => h.status === 'available').length
      
      const totalXPEarned = completions.reduce((sum, c) => sum + c.xp_earned, 0)
      const daysActive = Math.ceil(
        (new Date().getTime() - new Date(currentGoal.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const completionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
      const averageDailyProgress = daysActive > 0 ? completedHabits / daysActive : 0
      const estimatedDaysRemaining = averageDailyProgress > 0 ? 
        Math.ceil((totalHabits - completedHabits) / averageDailyProgress) : 0
      
      // Calculate current level within the goal
      const levelsProgress = Array.from({ length: currentGoal.goal_template?.total_levels || 4 }, (_, i) => {
        const level = i + 1
        const levelHabits = habitProgress.filter(h => h.habit_template?.level === level)
        const levelCompleted = levelHabits.filter(h => h.status === 'completed')
        return {
          level,
          level_name: ['Foundation', 'Building', 'Power', 'Mastery'][i] || `Level ${level}`,
          habits_in_level: levelHabits.map(h => h.habit_template!).filter(Boolean),
          completed_habits: levelCompleted.length,
          total_habits: levelHabits.length,
          completion_percentage: levelHabits.length > 0 ? Math.round((levelCompleted.length / levelHabits.length) * 100) : 0,
          is_unlocked: level <= currentGoal.current_level
        }
      })
      
      const goalProgressData: GoalProgress = {
        goal: currentGoal,
        goal_template: currentGoal.goal_template!,
        current_level: currentGoal.current_level,
        total_levels: currentGoal.goal_template?.total_levels || 4,
        overall_completion_percentage: completionPercentage,
        level_progress: levelsProgress,
        days_active: daysActive,
        total_xp_earned: totalXPEarned,
        current_streak: currentStreak
      }
      
      const goalStatsData: GoalStats = {
        daysActive,
        habitsCompleted: completedHabits,
        totalHabits,
        xpEarned: totalXPEarned,
        currentLevel: currentGoal.current_level,
        totalLevels: currentGoal.goal_template?.total_levels || 4,
        completionPercentage,
        averageDailyProgress,
        estimatedDaysRemaining
      }
      
      setGoalProgress(goalProgressData)
      setGoalStats(goalStatsData)
      
    } catch (err: any) {
      console.error('Error calculating goal progress:', err)
      setError(err.message)
    }
  }
  
  // Calculate journey statistics
  const calculateJourneyStats = async () => {
    if (!user) {
      setJourneyStats(null)
      return
    }
    
    try {
      // Get all user's goals (completed and current)
      const { data: allGoals, error: goalsError } = await supabase
        .from('user_active_goals')
        .select(`
          *,
          goal_template:goal_templates(
            *,
            category:categories(name)
          )
        `)
        .eq('user_id', user.id)
      
      if (goalsError) throw goalsError
      
      // Get all XP transactions
      const { data: xpTransactions, error: xpError } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', user.id)
      
      if (xpError) throw xpError
      
      const goals = allGoals || []
      const completedGoalsList = goals.filter(g => g.status === 'completed')
      const totalXPEarned = (xpTransactions || []).reduce((sum, t) => sum + t.xp_amount, 0)
      
      // Calculate total days active (from first goal start to now)
      const firstGoalDate = goals.length > 0 ? 
        new Date(Math.min(...goals.map(g => new Date(g.start_date).getTime()))) : new Date()
      const totalDaysActive = Math.ceil(
        (new Date().getTime() - firstGoalDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Calculate average completion time
      const completedGoalsWithDuration = completedGoalsList.filter(g => g.completion_date)
      const averageCompletionTime = completedGoalsWithDuration.length > 0 ?
        completedGoalsWithDuration.reduce((sum, g) => {
          const duration = (new Date(g.completion_date!).getTime() - new Date(g.start_date).getTime()) / (1000 * 60 * 60 * 24)
          return sum + duration
        }, 0) / completedGoalsWithDuration.length : 0
      
      // Categories explored
      const categoriesExplored = Array.from(new Set(
        goals.map(g => g.goal_template?.category?.name).filter(Boolean)
      )) as string[]
      
      const journeyStatsData: JourneyStats = {
        totalGoalsCompleted: completedGoalsList.length,
        totalDaysActive,
        totalXPEarned,
        currentStreak,
        longestStreak: currentStreak, // TODO: Calculate actual longest streak
        categoriesExplored,
        averageGoalCompletionTime: Math.round(averageCompletionTime),
        mostProductiveTimeOfDay: 'Morning' // TODO: Calculate from completion times
      }
      
      setJourneyStats(journeyStatsData)
      
    } catch (err: any) {
      console.error('Error calculating journey stats:', err)
    }
  }
  
  // Select a new goal
  const selectGoal = async (goalTemplateId: string, timeCommitment: TimeCommitment) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setError(null)
      
      // Pause any existing active goal
      if (currentGoal) {
        await pauseGoal()
      }
      
      // Create new active goal
      const { data: newGoal, error: goalError } = await supabase
        .from('user_active_goals')
        .insert({
          user_id: user.id,
          goal_template_id: goalTemplateId,
          status: 'active',
          current_level: 1,
          start_date: new Date().toISOString().split('T')[0],
          time_commitment: timeCommitment
        })
        .select(`
          *,
          goal_template:goal_templates(
            *,
            category:categories(*)
          )
        `)
        .single()
      
      if (goalError) throw goalError
      
      // Create initial habit progress records
      const { data: habits, error: habitsError } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('goal_template_id', goalTemplateId)
        .order('level', { ascending: true })
        .order('order_index', { ascending: true })
      
      if (habitsError) throw habitsError
      
      // Create habit progress records
      const habitProgressRecords = (habits || []).map(habit => ({
        user_id: user.id,
        user_active_goal_id: newGoal.id,
        habit_template_id: habit.id,
        status: habit.level === 1 ? 'available' as const : 'locked' as const,
        completed_count: 0,
        best_streak: 0,
        current_streak: 0,
        total_xp_earned: 0,
        unlocked_at: habit.level === 1 ? new Date().toISOString() : undefined
      }))
      
      if (habitProgressRecords.length > 0) {
        const { error: progressError } = await supabase
          .from('user_habit_progress')
          .insert(habitProgressRecords)
        
        if (progressError) throw progressError
      }
      
      // Refresh data
      await refreshProgress()
      
    } catch (err: any) {
      console.error('Error selecting goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Pause current goal
  const pauseGoal = async () => {
    if (!user || !currentGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({ status: 'paused' })
        .eq('id', currentGoal.id)
      
      if (error) throw error
      await refreshProgress()
    } catch (err: any) {
      console.error('Error pausing goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Resume paused goal
  const resumeGoal = async () => {
    if (!user || !currentGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({ status: 'active' })
        .eq('id', currentGoal.id)
      
      if (error) throw error
      await refreshProgress()
    } catch (err: any) {
      console.error('Error resuming goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Complete current goal
  const completeGoal = async () => {
    if (!user || !currentGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', currentGoal.id)
      
      if (error) throw error
      await refreshProgress()
    } catch (err: any) {
      console.error('Error completing goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Switch to a different goal
  const switchGoal = async (newGoalTemplateId: string, reason?: string) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      // Pause current goal if exists
      if (currentGoal) {
        await pauseGoal()
      }
      
      // Select new goal with moderate commitment by default
      await selectGoal(newGoalTemplateId, TimeCommitment.Moderate)
      
    } catch (err: any) {
      console.error('Error switching goal:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Generate goal recommendations
  const getRecommendedGoals = async (): Promise<GoalRecommendation[]> => {
    try {
      // Simple recommendation algorithm
      // TODO: Enhance with ML-based recommendations
      
      const userCompletedCategories = completedGoals.map(g => g.goal_template?.category?.name).filter(Boolean)
      const userCurrentCategory = currentGoal?.goal_template?.category?.name
      
      const recommendations: GoalRecommendation[] = []
      
      for (const goal of availableGoals) {
        // Skip if already completed or currently active
        const alreadyCompleted = completedGoals.some(cg => cg.goal_template_id === goal.id)
        const currentlyActive = currentGoal?.goal_template_id === goal.id
        
        if (alreadyCompleted || currentlyActive) continue
        
        let score = 50 // Base score
        let reason = 'Good match for your level'
        let difficulty: 'perfect_match' | 'slight_challenge' | 'big_challenge' = 'perfect_match'
        
        // Boost score for unexplored categories
        if (!userCompletedCategories.includes(goal.category?.name)) {
          score += 20
          reason = 'Explore a new life area'
        }
        
        // Boost score based on difficulty and user level
        if (goal.difficulty === 'beginner' && currentLevel <= 3) {
          score += 15
          difficulty = 'perfect_match'
        } else if (goal.difficulty === 'intermediate' && currentLevel >= 3 && currentLevel <= 8) {
          score += 15
          difficulty = 'perfect_match'
        } else if (goal.difficulty === 'advanced' && currentLevel >= 8) {
          score += 15
          difficulty = 'perfect_match'
        } else if (goal.difficulty === 'intermediate' && currentLevel < 3) {
          score -= 10
          difficulty = 'big_challenge'
          reason = 'Ambitious challenge'
        } else if (goal.difficulty === 'advanced' && currentLevel < 8) {
          score -= 20
          difficulty = 'big_challenge'
          reason = 'Advanced challenge'
        }
        
        // Estimate completion time based on goal and user level
        const baseWeeks = parseInt(goal.estimated_duration.replace(/\D/g, '')) || 8
        const estimatedTimeToComplete = Math.max(4, baseWeeks - Math.floor(currentLevel / 2))
        
        recommendations.push({
          goal,
          score,
          reason,
          difficulty,
          estimatedTimeToComplete
        })
      }
      
      // Sort by score and return top 5
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
      
      setRecommendedGoals(sortedRecommendations)
      return sortedRecommendations
      
    } catch (err: any) {
      console.error('Error generating recommendations:', err)
      return []
    }
  }
  
  // Get goals by category
  const getGoalsByCategory = (categoryName: string): GoalTemplate[] => {
    return goalsByCategory[categoryName] || []
  }
  
  // Search goals
  const searchGoals = (query: string): GoalTemplate[] => {
    const lowercaseQuery = query.toLowerCase()
    return availableGoals.filter(goal =>
      goal.title.toLowerCase().includes(lowercaseQuery) ||
      goal.description.toLowerCase().includes(lowercaseQuery) ||
      goal.category?.name.toLowerCase().includes(lowercaseQuery)
    )
  }
  
  // Get popular goals (most completed)
  const getPopularGoals = (): GoalTemplate[] => {
    // TODO: Implement based on completion statistics
    return availableGoals.slice(0, 6) // Placeholder
  }
  
  // Get goal stats
  const getGoalStats = (): GoalStats | null => {
    return goalStats
  }
  
  // Get completion prediction
  const getCompletionPrediction = (): { estimatedCompletionDate: Date, confidence: number } | null => {
    if (!goalStats || goalStats.averageDailyProgress <= 0) return null
    
    const today = new Date()
    const estimatedDate = new Date(today.getTime() + (goalStats.estimatedDaysRemaining * 24 * 60 * 60 * 1000))
    
    // Calculate confidence based on consistency
    const confidence = Math.min(95, Math.max(20, goalStats.averageDailyProgress * 100))
    
    return {
      estimatedCompletionDate: estimatedDate,
      confidence: Math.round(confidence)
    }
  }
  
  // Get weekly progress data
  const getWeeklyProgressData = async (): Promise<WeeklyProgressData[]> => {
    if (!user || !currentGoal) return []
    
    try {
      // Get habit completions for the last 12 weeks
      const twelveWeeksAgo = new Date()
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
      
      const { data: completions, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completion_date', twelveWeeksAgo.toISOString().split('T')[0])
        .order('completion_date')
      
      if (error) throw error
      
      // Group by week
      const weeklyData: Record<string, WeeklyProgressData> = {}
      
      ;(completions || []).forEach(completion => {
        const date = new Date(completion.completion_date)
        const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week: weekKey,
            habitsCompleted: 0,
            xpEarned: 0,
            streakDays: 0,
            goalProgress: 0
          }
        }
        
        weeklyData[weekKey].habitsCompleted += 1
        weeklyData[weekKey].xpEarned += completion.xp_earned
      })
      
      const progressData = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week))
      setWeeklyProgress(progressData)
      return progressData
      
    } catch (err: any) {
      console.error('Error fetching weekly progress:', err)
      return []
    }
  }
  
  // Check if goal can be unlocked
  const canUnlockGoal = (goalId: string): boolean => {
    // TODO: Implement unlock requirements logic
    return true // Placeholder - all goals unlocked for now
  }
  
  // Get goal unlock requirements
  const getGoalUnlockRequirements = (goalId: string): UnlockRequirements[] => {
    // TODO: Implement based on goal difficulty and user progress
    return [] // Placeholder
  }
  
  // Check and unlock new goals
  const checkAndUnlockNewGoals = async (): Promise<GoalTemplate[]> => {
    // TODO: Implement unlock checking logic
    return [] // Placeholder
  }
  
  // Refresh all progress data
  const refreshProgress = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCategories(),
        fetchGoalTemplates(),
        fetchCurrentGoal(),
        fetchCompletedGoals()
      ])
      
      // These depend on the above data
      await Promise.all([
        calculateGoalProgress(),
        calculateJourneyStats(),
        getRecommendedGoals(),
        getWeeklyProgressData()
      ])
      
    } catch (err: any) {
      console.error('Error refreshing progress:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshProgress()
    } else {
      // Reset all data when user logs out
      setCurrentGoal(null)
      setAvailableGoals([])
      setCompletedGoals([])
      setGoalProgress(null)
      setGoalStats(null)
      setCategories([])
      setGoalsByCategory({})
      setJourneyStats(null)
      setWeeklyProgress([])
      setRecommendedGoals([])
      setUnlockedGoals([])
      setLoading(false)
    }
  }, [user])
  
  // Recalculate progress when goal changes
  useEffect(() => {
    if (currentGoal) {
      calculateGoalProgress()
      calculateJourneyStats()
    }
  }, [currentGoal, currentLevel, totalXP, currentStreak])
  
  const value: GoalJourneyContextType = {
    // Current State
    currentGoal,
    availableGoals,
    completedGoals,
    goalProgress,
    goalStats,
    
    // Categories & Organization
    categories,
    goalsByCategory,
    
    // Progress & Analytics
    journeyStats,
    weeklyProgress,
    
    // Discovery & Recommendations
    recommendedGoals,
    unlockedGoals,
    
    // Loading States
    loading,
    error,
    
    // Core Actions
    selectGoal,
    pauseGoal,
    resumeGoal,
    completeGoal,
    switchGoal,
    
    // Discovery & Search
    getRecommendedGoals,
    getGoalsByCategory,
    searchGoals,
    getPopularGoals,
    
    // Progress & Analytics
    refreshProgress,
    getGoalStats,
    getCompletionPrediction,
    getWeeklyProgressData,
    
    // Unlock System
    canUnlockGoal,
    getGoalUnlockRequirements,
    checkAndUnlockNewGoals
  }
  
  return (
    <GoalJourneyContext.Provider value={value}>
      {children}
    </GoalJourneyContext.Provider>
  )
}

export const useGoalJourney = (): GoalJourneyContextType => {
  const context = useContext(GoalJourneyContext)
  if (context === undefined) {
    throw new Error('useGoalJourney must be used within a GoalJourneyProvider')
  }
  return context
}
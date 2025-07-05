import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  Category,
  GoalTemplate,
  HabitTemplate,
  UserActiveGoal,
  UserHabitProgress,
  HabitCompletion,
  DailyHabitSummary,
  GoalProgress,
  LevelProgress,
  HabitStatus,
  GoalStatus
} from '../types/habits'

interface HabitsContextType {
  // Data
  categories: Category[]
  goalTemplates: GoalTemplate[]
  habitTemplates: HabitTemplate[]
  activeGoal: UserActiveGoal | null
  habitProgress: UserHabitProgress[]
  dailyHabits: DailyHabitSummary[]
  goalProgress: GoalProgress | null
  
  // Loading states
  loading: boolean
  error: string | null
  
  // Actions
  selectGoal: (goalTemplateId: string, timeCommitment: 'light' | 'moderate' | 'intensive') => Promise<void>
  completeHabit: (habitTemplateId: string, rating?: number, notes?: string, actualTime?: number) => Promise<void>
  pauseGoal: () => Promise<void>
  resumeGoal: () => Promise<void>
  completeGoal: () => Promise<void>
  refreshData: () => Promise<void>
  
  // Computed properties
  getTodayCompletedHabits: () => HabitCompletion[]
  getAvailableHabits: () => UserHabitProgress[]
  getHabitsForLevel: (level: number) => UserHabitProgress[]
  canUnlockNextLevel: () => boolean
  getNextLevelRequirements: () => { level: number; requiredCompletions: number; currentCompletions: number } | null
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined)

interface HabitsProviderProps {
  children: ReactNode
}

export const HabitsProvider: React.FC<HabitsProviderProps> = ({ children }) => {
  const { user } = useAuth()
  
  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([])
  const [habitTemplates, setHabitTemplates] = useState<HabitTemplate[]>([])
  const [activeGoal, setActiveGoal] = useState<UserActiveGoal | null>(null)
  const [habitProgress, setHabitProgress] = useState<UserHabitProgress[]>([])
  const [dailyHabits, setDailyHabits] = useState<DailyHabitSummary[]>([])
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch all base data (categories, goal templates, habit templates)
  const fetchBaseData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index')
      
      if (categoriesError) {
        if (categoriesError.code === '42P01') {
          console.log('Categories table does not exist, using empty list')
          setCategories([])
        } else {
          throw categoriesError
        }
      } else {
        setCategories(categoriesData || [])
      }
      
      // Fetch goal templates
      const { data: goalTemplatesData, error: goalTemplatesError } = await supabase
        .from('goal_templates')
        .select(`
          *,
          category:categories(*)
        `)
      
      if (goalTemplatesError) {
        if (goalTemplatesError.code === '42P01') {
          console.log('Goal templates table does not exist, using empty list')
          setGoalTemplates([])
        } else {
          throw goalTemplatesError
        }
      } else {
        setGoalTemplates(goalTemplatesData || [])
      }
      
      // Fetch habit templates
      const { data: habitTemplatesData, error: habitTemplatesError } = await supabase
        .from('habit_templates')
        .select(`
          *,
          goal_template:goal_templates(*)
        `)
        .order('level, order_index')
      
      if (habitTemplatesError) {
        if (habitTemplatesError.code === '42P01') {
          console.log('Habit templates table does not exist, using empty list')
          setHabitTemplates([])
        } else {
          throw habitTemplatesError
        }
      } else {
        setHabitTemplates(habitTemplatesData || [])
      }
      
    } catch (err: any) {
      console.error('Error fetching base data:', err)
      setError(err.message)
    }
  }
  
  // Fetch user-specific data (active goal, habit progress)
  const fetchUserData = async () => {
    if (!user) {
      setActiveGoal(null)
      setHabitProgress([])
      setDailyHabits([])
      setGoalProgress(null)
      return
    }
    
    try {
      // Fetch active goal
      const { data: activeGoalData, error: activeGoalError } = await supabase
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
      
      if (activeGoalError) {
        if (activeGoalError.code === '42P01') {
          console.log('User active goals table does not exist, using null active goal')
          setActiveGoal(null)
          setHabitProgress([])
          setDailyHabits([])
          setGoalProgress(null)
          return
        }
        throw activeGoalError
      }
      const activeGoal = activeGoalData && activeGoalData.length > 0 ? activeGoalData[0] : null
      setActiveGoal(activeGoal)
      
      if (activeGoal) {
        // Fetch habit progress for active goal
        const { data: habitProgressData, error: habitProgressError } = await supabase
          .from('user_habit_progress')
          .select(`
            *,
            habit_template:habit_templates(*)
          `)
          .eq('user_id', user.id)
          .eq('user_active_goal_id', activeGoal.id)
        
        if (habitProgressError) {
          if (habitProgressError.code === '42P01') {
            console.log('User habit progress table does not exist, using empty progress')
            setHabitProgress([])
            setDailyHabits([])
            setGoalProgress(null)
            return
          }
          throw habitProgressError
        }
        setHabitProgress(habitProgressData || [])
        
        // Debug habit progress data
        console.log('fetchUserData: Habit progress data:', {
          count: habitProgressData?.length || 0,
          sample: habitProgressData?.slice(0, 2).map(p => ({
            id: p.id,
            status: p.status,
            habit_template_id: p.habit_template_id,
            habit_template: p.habit_template ? {
              id: p.habit_template.id,
              title: p.habit_template.title
            } : null
          }))
        })
        
        // Generate daily habits and goal progress
        await generateDailyHabits(habitProgressData || [], activeGoal)
        await generateGoalProgress(activeGoal, habitProgressData || [])
      } else {
        setHabitProgress([])
        setDailyHabits([])
        setGoalProgress(null)
      }
      
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      setError(err.message)
    }
  }
  
  // Generate daily habits summary
  const generateDailyHabits = async (progressData: UserHabitProgress[], goal: UserActiveGoal) => {
    console.log('generateDailyHabits called with:', {
      user: user?.id,
      goal: goal?.goal_template_id,
      progressDataCount: progressData?.length || 0,
      habitTemplatesCount: habitTemplates?.length || 0
    })
    
    if (!user || !goal) {
      console.log('generateDailyHabits: Missing user or goal, returning')
      return
    }
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's completions
      const { data: todayCompletions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_template_id')
        .eq('user_id', user.id)
        .eq('completion_date', today)
      
      if (completionsError) {
        if (completionsError.code === '42P01') {
          console.log('Habit completions table does not exist, assuming no habits completed today')
          const completedToday = new Set()
          // Continue with empty completions set
          const availableHabits = progressData.filter(progress => 
            progress.status === 'available' || progress.status === 'in_progress'
          )
          
          console.log('generateDailyHabits: Table missing, filtered results:', {
            totalProgressData: progressData.length,
            availableHabits: availableHabits.length,
            progressStatuses: progressData.map(p => p.status)
          })
          
          const dailySummary: DailyHabitSummary[] = availableHabits.map(progress => ({
            habit_template: progress.habit_template!,
            progress,
            today_completed: false,
            can_complete_today: true,
            streak_count: progress.current_streak
          }))
          
          setDailyHabits(dailySummary)
          return
        }
        throw completionsError
      }
      
      const completedToday = new Set(todayCompletions?.map(c => c.habit_template_id) || [])
      
      // Filter available habits for today based on current level and unlock status
      const availableHabits = progressData.filter(progress => 
        progress.status === 'available' || progress.status === 'in_progress'
      )
      
      console.log('generateDailyHabits: Filtered results:', {
        totalProgressData: progressData.length,
        availableHabits: availableHabits.length,
        progressStatuses: progressData.map(p => p.status),
        activeGoalId: goal.id,
        progressGoalIds: progressData.map(p => p.user_active_goal_id),
        progressWithTemplates: progressData.map(p => ({
          id: p.id,
          status: p.status,
          hasTemplate: !!p.habit_template,
          templateTitle: p.habit_template?.title
        })),
        availableHabitsDetails: availableHabits.map(p => ({
          id: p.id,
          status: p.status,
          hasTemplate: !!p.habit_template,
          templateTitle: p.habit_template?.title,
          templateId: p.habit_template?.id
        }))
      })
      
      const dailySummary: DailyHabitSummary[] = availableHabits.map(progress => {
        console.log('generateDailyHabits: Processing progress record:', {
          id: progress.id,
          status: progress.status,
          habit_template_id: progress.habit_template_id,
          habit_template_exists: !!progress.habit_template,
          habit_template_title: progress.habit_template?.title || 'NO TITLE'
        })
        
        return {
          habit_template: progress.habit_template!,
          progress,
          today_completed: completedToday.has(progress.habit_template_id),
          can_complete_today: !completedToday.has(progress.habit_template_id),
          streak_count: progress.current_streak
        }
      })
      
      console.log('generateDailyHabits: Setting daily habits:', {
        dailySummaryLength: dailySummary.length,
        dailySummary: dailySummary.map(ds => ({
          title: ds.habit_template?.title,
          canComplete: ds.can_complete_today,
          completed: ds.today_completed
        }))
      })
      
      setDailyHabits(dailySummary)
      
    } catch (err: any) {
      console.error('Error generating daily habits:', err)
    }
  }
  
  // Generate goal progress summary
  const generateGoalProgress = async (goal: UserActiveGoal, progressData: UserHabitProgress[]) => {
    if (!goal.goal_template) return
    
    try {
      // Group habits by level
      const habitsByLevel: { [level: number]: UserHabitProgress[] } = {}
      progressData.forEach(progress => {
        const level = progress.habit_template?.level || 1
        if (!habitsByLevel[level]) habitsByLevel[level] = []
        habitsByLevel[level].push(progress)
      })
      
      // Calculate level progress
      const levelProgress: LevelProgress[] = []
      for (let level = 1; level <= goal.goal_template.total_levels; level++) {
        const habitsInLevel = habitsByLevel[level] || []
        const completedHabits = habitsInLevel.filter(h => h.status === 'completed').length
        const totalHabits = habitsInLevel.length
        
        levelProgress.push({
          level,
          level_name: getLevelName(level),
          habits_in_level: habitsInLevel.map(h => h.habit_template!),
          completed_habits: completedHabits,
          total_habits: totalHabits,
          completion_percentage: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
          is_unlocked: level <= goal.current_level,
          unlock_progress: level === goal.current_level + 1 ? completedHabits : undefined
        })
      }
      
      // Calculate overall progress
      const totalHabits = progressData.length
      const completedHabits = progressData.filter(h => h.status === 'completed').length
      const overallCompletion = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
      
      // Calculate days active
      const startDate = new Date(goal.start_date)
      const today = new Date()
      const daysActive = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      
      // Calculate total XP earned
      const totalXP = progressData.reduce((sum, progress) => sum + progress.total_xp_earned, 0)
      
      // Get current streak
      const maxStreak = Math.max(...progressData.map(p => p.current_streak), 0)
      
      const progress: GoalProgress = {
        goal,
        goal_template: goal.goal_template,
        current_level: goal.current_level,
        total_levels: goal.goal_template.total_levels,
        overall_completion_percentage: overallCompletion,
        level_progress: levelProgress,
        days_active: daysActive,
        total_xp_earned: totalXP,
        current_streak: maxStreak
      }
      
      setGoalProgress(progress)
      
    } catch (err: any) {
      console.error('Error generating goal progress:', err)
    }
  }
  
  // Helper function to get level name
  const getLevelName = (level: number): string => {
    switch (level) {
      case 1: return 'Foundation'
      case 2: return 'Building'
      case 3: return 'Power'
      case 4: return 'Mastery'
      default: return `Level ${level}`
    }
  }
  
  // Select a new goal
  const selectGoal = async (goalTemplateId: string, timeCommitment: 'light' | 'moderate' | 'intensive') => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setLoading(true)
      setError(null)
      
      // Create user active goal
      const { data: newGoal, error: goalError } = await supabase
        .from('user_active_goals')
        .insert({
          user_id: user.id,
          goal_template_id: goalTemplateId,
          time_commitment: timeCommitment,
          start_date: new Date().toISOString().split('T')[0]
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
      
      // Get habit templates for this goal
      const { data: habitTemplatesForGoal, error: habitTemplatesError } = await supabase
        .from('habit_templates')
        .select('*')
        .eq('goal_template_id', goalTemplateId)
        .order('level, order_index')
      
      if (habitTemplatesError) throw habitTemplatesError
      
      // Create initial habit progress records
      const habitProgressRecords = habitTemplatesForGoal.map((template, index) => ({
        user_id: user.id,
        user_active_goal_id: newGoal.id,
        habit_template_id: template.id,
        status: template.level === 1 ? 'available' : 'locked', // Level 1 habits start available
        unlocked_at: template.level === 1 ? new Date().toISOString() : null
      }))
      
      const { error: progressError } = await supabase
        .from('user_habit_progress')
        .insert(habitProgressRecords)
      
      if (progressError) throw progressError
      
      // Refresh data to get the new goal and progress
      await refreshData()
      
    } catch (err: any) {
      console.error('Error selecting goal:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // Complete a habit
  const completeHabit = async (habitTemplateId: string, rating?: number, notes?: string, actualTime?: number) => {
    if (!user || !activeGoal) throw new Error('User not authenticated or no active goal')
    
    try {
      setError(null)
      
      // Get habit progress record
      const habitProgressRecord = habitProgress.find(h => h.habit_template_id === habitTemplateId)
      if (!habitProgressRecord) throw new Error('Habit progress not found')
      
      const habitTemplate = habitProgressRecord.habit_template!
      const today = new Date().toISOString().split('T')[0]
      
      // Check if already completed today
      const { data: existingCompletion, error: checkError } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('habit_template_id', habitTemplateId)
        .eq('completion_date', today)
        .maybeSingle()
      
      if (checkError) throw checkError
      if (existingCompletion) {
        throw new Error('Habit already completed today')
      }
      
      // Create habit completion record
      const { data: completion, error: completionError } = await supabase
        .from('habit_completions')
        .insert({
          user_id: user.id,
          habit_template_id: habitTemplateId,
          user_habit_progress_id: habitProgressRecord.id,
          completion_date: today,
          xp_earned: habitTemplate.xp_reward,
          rating,
          notes,
          completion_time: actualTime
        })
        .select()
        .single()
      
      if (completionError) throw completionError
      
      // Update habit progress
      const newCompletedCount = habitProgressRecord.completed_count + 1
      const newCurrentStreak = habitProgressRecord.current_streak + 1
      const newBestStreak = Math.max(habitProgressRecord.best_streak, newCurrentStreak)
      const newTotalXP = habitProgressRecord.total_xp_earned + habitTemplate.xp_reward
      
      const { error: updateError } = await supabase
        .from('user_habit_progress')
        .update({
          completed_count: newCompletedCount,
          current_streak: newCurrentStreak,
          best_streak: newBestStreak,
          total_xp_earned: newTotalXP,
          last_completed_at: new Date().toISOString(),
          status: newCompletedCount >= 5 ? 'completed' : 'in_progress' // Mark as completed after 5 completions
        })
        .eq('id', habitProgressRecord.id)
      
      if (updateError) throw updateError
      
      // Check if we can unlock next level
      await checkAndUnlockNextLevel()
      
      // Refresh data
      await refreshData()
      
    } catch (err: any) {
      console.error('Error completing habit:', err)
      setError(err.message)
      throw err
    }
  }
  
  // Check and unlock next level if requirements are met
  const checkAndUnlockNextLevel = async () => {
    if (!user || !activeGoal) return
    
    try {
      const currentLevel = activeGoal.current_level
      const nextLevel = currentLevel + 1
      
      if (nextLevel > activeGoal.goal_template!.total_levels) return // Already at max level
      
      // Check completion of current level
      const currentLevelHabits = habitProgress.filter(h => h.habit_template?.level === currentLevel)
      const completedCurrentLevel = currentLevelHabits.filter(h => h.status === 'completed')
      
      // Unlock next level if 80% of current level is completed
      const completionRate = currentLevelHabits.length > 0 ? completedCurrentLevel.length / currentLevelHabits.length : 0
      
      if (completionRate >= 0.8) {
        // Update goal level
        const { error: goalUpdateError } = await supabase
          .from('user_active_goals')
          .update({ current_level: nextLevel })
          .eq('id', activeGoal.id)
        
        if (goalUpdateError) throw goalUpdateError
        
        // Unlock next level habits
        const nextLevelHabits = habitProgress.filter(h => h.habit_template?.level === nextLevel)
        
        if (nextLevelHabits.length > 0) {
          const unlockPromises = nextLevelHabits.map(habit =>
            supabase
              .from('user_habit_progress')
              .update({
                status: 'available',
                unlocked_at: new Date().toISOString()
              })
              .eq('id', habit.id)
          )
          
          await Promise.all(unlockPromises)
        }
      }
      
    } catch (err: any) {
      console.error('Error checking level unlock:', err)
    }
  }
  
  // Pause current goal
  const pauseGoal = async () => {
    if (!activeGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({ status: 'paused' })
        .eq('id', activeGoal.id)
      
      if (error) throw error
      await refreshData()
    } catch (err: any) {
      console.error('Error pausing goal:', err)
      setError(err.message)
    }
  }
  
  // Resume paused goal
  const resumeGoal = async () => {
    if (!activeGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({ status: 'active' })
        .eq('id', activeGoal.id)
      
      if (error) throw error
      await refreshData()
    } catch (err: any) {
      console.error('Error resuming goal:', err)
      setError(err.message)
    }
  }
  
  // Complete current goal
  const completeGoal = async () => {
    if (!activeGoal) return
    
    try {
      const { error } = await supabase
        .from('user_active_goals')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', activeGoal.id)
      
      if (error) throw error
      await refreshData()
    } catch (err: any) {
      console.error('Error completing goal:', err)
      setError(err.message)
    }
  }
  
  // Refresh all data
  const refreshData = async () => {
    setLoading(true)
    try {
      if (user) {
        // Only fetch base data if user is authenticated (required by RLS policies)
        await Promise.all([fetchBaseData(), fetchUserData()])
      } else {
        // User not authenticated, clear all data
        setCategories([])
        setGoalTemplates([])
        setHabitTemplates([])
        setActiveGoal(null)
        setHabitProgress([])
        setDailyHabits([])
        setGoalProgress(null)
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // Computed properties
  const getTodayCompletedHabits = (): HabitCompletion[] => {
    // This would require fetching today's completions
    // For now, return empty array - would implement with actual data fetching
    return []
  }
  
  const getAvailableHabits = (): UserHabitProgress[] => {
    return habitProgress.filter(h => h.status === 'available' || h.status === 'in_progress')
  }
  
  const getHabitsForLevel = (level: number): UserHabitProgress[] => {
    return habitProgress.filter(h => h.habit_template?.level === level)
  }
  
  const canUnlockNextLevel = (): boolean => {
    if (!activeGoal) return false
    
    const currentLevel = activeGoal.current_level
    const currentLevelHabits = getHabitsForLevel(currentLevel)
    const completedHabits = currentLevelHabits.filter(h => h.status === 'completed')
    
    return currentLevelHabits.length > 0 && (completedHabits.length / currentLevelHabits.length) >= 0.8
  }
  
  const getNextLevelRequirements = () => {
    if (!activeGoal) return null
    
    const currentLevel = activeGoal.current_level
    const nextLevel = currentLevel + 1
    
    if (nextLevel > activeGoal.goal_template!.total_levels) return null
    
    const currentLevelHabits = getHabitsForLevel(currentLevel)
    const completedHabits = currentLevelHabits.filter(h => h.status === 'completed')
    const requiredCompletions = Math.ceil(currentLevelHabits.length * 0.8)
    
    return {
      level: nextLevel,
      requiredCompletions,
      currentCompletions: completedHabits.length
    }
  }
  
  // Load data when user changes
  useEffect(() => {
    refreshData()
  }, [user])
  
  const value: HabitsContextType = {
    // Data
    categories,
    goalTemplates,
    habitTemplates,
    activeGoal,
    habitProgress,
    dailyHabits,
    goalProgress,
    
    // Loading states
    loading,
    error,
    
    // Actions
    selectGoal,
    completeHabit,
    pauseGoal,
    resumeGoal,
    completeGoal,
    refreshData,
    
    // Computed properties
    getTodayCompletedHabits,
    getAvailableHabits,
    getHabitsForLevel,
    canUnlockNextLevel,
    getNextLevelRequirements
  }
  
  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  )
}

export const useHabits = (): HabitsContextType => {
  const context = useContext(HabitsContext)
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider')
  }
  return context
}
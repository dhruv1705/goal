// TypeScript interfaces for the habit/lesson system

export interface Category {
  id: string
  name: 'Physical Health' | 'Mental Health' | 'Finance' | 'Social'
  description: string
  icon: string
  color: string
  order_index: number
  created_at: string
}

export interface GoalTemplate {
  id: string
  category_id: string
  name: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: string
  total_levels: number
  benefits: string[]
  created_at: string
  category?: Category // Optional joined data
}

export interface HabitTemplate {
  id: string
  goal_template_id: string
  title: string
  description: string
  level: number
  estimated_duration: number // in minutes
  xp_reward: number
  habit_type: 'foundation' | 'building' | 'power' | 'mastery'
  instructions: string
  tips: string
  unlock_requirements: {
    completed_habits: number
    required_level: number
  }
  order_index: number
  created_at: string
  goal_template?: GoalTemplate // Optional joined data
}

export interface UserActiveGoal {
  id: string
  user_id: string
  goal_template_id: string
  status: 'active' | 'paused' | 'completed'
  current_level: number
  start_date: string
  target_completion_date?: string
  completion_date?: string
  time_commitment: 'light' | 'moderate' | 'intensive'
  created_at: string
  updated_at: string
  goal_template?: GoalTemplate // Optional joined data
}

export interface UserHabitProgress {
  id: string
  user_id: string
  user_active_goal_id: string
  habit_template_id: string
  status: 'locked' | 'available' | 'in_progress' | 'completed'
  completed_count: number
  best_streak: number
  current_streak: number
  total_xp_earned: number
  last_completed_at?: string
  unlocked_at?: string
  mastered_at?: string
  created_at: string
  updated_at: string
  habit_template?: HabitTemplate // Optional joined data
}

export interface UserXPProgress {
  id: string
  user_id: string
  total_xp: number
  current_level: number
  xp_to_next_level: number
  daily_xp_goal: number
  current_streak: number
  best_streak: number
  last_activity_date: string
  created_at: string
  updated_at: string
}

export interface HabitCompletion {
  id: string
  user_id: string
  habit_template_id: string
  user_habit_progress_id: string
  completion_date: string
  xp_earned: number
  rating?: number // 1=hard, 2=okay, 3=great
  notes?: string
  completion_time?: number // actual time spent in minutes
  created_at: string
  habit_template?: HabitTemplate // Optional joined data
}

export interface XPTransaction {
  id: string
  user_id: string
  habit_completion_id?: string
  xp_amount: number
  transaction_type: 'habit_completion' | 'streak_bonus' | 'perfect_score' | 'level_bonus' | 'achievement_bonus'
  description?: string
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  achievement_name: string
  achievement_description: string
  achievement_icon: string
  xp_reward: number
  unlocked_at: string
}

// Helper types for UI components
export interface DailyHabitSummary {
  habit_template: HabitTemplate
  progress: UserHabitProgress
  today_completed: boolean
  can_complete_today: boolean
  streak_count: number
}

export interface LevelProgress {
  level: number
  level_name: string
  habits_in_level: HabitTemplate[]
  completed_habits: number
  total_habits: number
  completion_percentage: number
  is_unlocked: boolean
  unlock_progress?: number // Progress towards unlocking this level
}

export interface GoalProgress {
  goal: UserActiveGoal
  goal_template: GoalTemplate
  current_level: number
  total_levels: number
  overall_completion_percentage: number
  level_progress: LevelProgress[]
  days_active: number
  total_xp_earned: number
  current_streak: number
}

// Enums for better type safety
export enum HabitType {
  Foundation = 'foundation',
  Building = 'building',
  Power = 'power',
  Mastery = 'mastery'
}

export enum GoalStatus {
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed'
}

export enum HabitStatus {
  Locked = 'locked',
  Available = 'available',
  InProgress = 'in_progress',
  Completed = 'completed'
}

export enum TimeCommitment {
  Light = 'light',
  Moderate = 'moderate',
  Intensive = 'intensive'
}

// Achievement definitions
export interface AchievementDefinition {
  id: string
  name: string
  description: string
  icon: string
  xp_reward: number
  unlock_criteria: {
    type: 'habit_completions' | 'streak_days' | 'level_completion' | 'goal_completion' | 'xp_milestone'
    value: number
    additional_criteria?: any
  }
}

// Common achievement definitions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_habit',
    name: 'First Steps',
    description: 'Complete your very first habit',
    icon: '🥇',
    xp_reward: 10,
    unlock_criteria: { type: 'habit_completions', value: 1 }
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xp_reward: 50,
    unlock_criteria: { type: 'streak_days', value: 7 }
  },
  {
    id: 'foundation_master',
    name: 'Foundation Master',
    description: 'Complete all Level 1 habits in a goal',
    icon: '🏗️',
    xp_reward: 100,
    unlock_criteria: { type: 'level_completion', value: 1 }
  },
  {
    id: 'habit_crusher',
    name: 'Habit Crusher',
    description: 'Complete 50 habits total',
    icon: '💪',
    xp_reward: 200,
    unlock_criteria: { type: 'habit_completions', value: 50 }
  },
  {
    id: 'streak_legend',
    name: 'Streak Legend',
    description: 'Maintain a 30-day streak',
    icon: '🌟',
    xp_reward: 300,
    unlock_criteria: { type: 'streak_days', value: 30 }
  },
  {
    id: 'goal_achiever',
    name: 'Goal Achiever',
    description: 'Complete your first goal',
    icon: '🎯',
    xp_reward: 500,
    unlock_criteria: { type: 'goal_completion', value: 1 }
  }
]
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CategoryTemplate, GoalTemplate, HabitTemplate } from '../data/onboardingTemplates'

// AsyncStorage keys for guest data
const GUEST_ONBOARDING_DATA = '@guest_onboarding_data'
const GUEST_ONBOARDING_COMPLETED = '@guest_onboarding_completed'
const GUEST_DEMO_PROGRESS = '@guest_demo_progress'

export interface GuestOnboardingData {
  selectedCategory: CategoryTemplate | null
  selectedGoal: GoalTemplate | null
  selectedHabits: HabitTemplate[]
  timeCommitment: 'light' | 'moderate' | 'intensive'
  motivationContext: string
  demoCompleted: boolean
  demoXP: number
  completedAt: string
}

export interface GuestDemoProgress {
  totalXP: number
  completedHabits: number
  demoExperiences: string[] // IDs of completed demo experiences
}

export class GuestDataManager {
  /**
   * Save complete guest onboarding data to AsyncStorage
   */
  static async saveGuestOnboarding(data: GuestOnboardingData): Promise<void> {
    try {
      const jsonData = JSON.stringify(data)
      await AsyncStorage.setItem(GUEST_ONBOARDING_DATA, jsonData)
      console.log('✅ Guest onboarding data saved successfully')
    } catch (error) {
      console.error('❌ Error saving guest onboarding data:', error)
      throw error
    }
  }

  /**
   * Retrieve guest onboarding data from AsyncStorage
   */
  static async getGuestOnboarding(): Promise<GuestOnboardingData | null> {
    try {
      const jsonData = await AsyncStorage.getItem(GUEST_ONBOARDING_DATA)
      if (jsonData) {
        const data = JSON.parse(jsonData) as GuestOnboardingData
        console.log('✅ Guest onboarding data retrieved successfully')
        return data
      }
      return null
    } catch (error) {
      console.error('❌ Error retrieving guest onboarding data:', error)
      return null
    }
  }

  /**
   * Check if guest has completed onboarding
   */
  static async isGuestOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(GUEST_ONBOARDING_COMPLETED)
      return completed === 'true'
    } catch (error) {
      console.error('❌ Error checking guest onboarding completion:', error)
      return false
    }
  }

  /**
   * Mark guest onboarding as completed
   */
  static async markGuestOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(GUEST_ONBOARDING_COMPLETED, 'true')
      console.log('✅ Guest onboarding marked as completed')
    } catch (error) {
      console.error('❌ Error marking guest onboarding as completed:', error)
      throw error
    }
  }

  /**
   * Save guest demo progress (for use in choice screen)
   */
  static async saveGuestDemoProgress(progress: GuestDemoProgress): Promise<void> {
    try {
      const jsonData = JSON.stringify(progress)
      await AsyncStorage.setItem(GUEST_DEMO_PROGRESS, jsonData)
      console.log('✅ Guest demo progress saved successfully')
    } catch (error) {
      console.error('❌ Error saving guest demo progress:', error)
      throw error
    }
  }

  /**
   * Get guest demo progress
   */
  static async getGuestDemoProgress(): Promise<GuestDemoProgress | null> {
    try {
      const jsonData = await AsyncStorage.getItem(GUEST_DEMO_PROGRESS)
      if (jsonData) {
        return JSON.parse(jsonData) as GuestDemoProgress
      }
      return null
    } catch (error) {
      console.error('❌ Error retrieving guest demo progress:', error)
      return null
    }
  }

  /**
   * Clear all guest onboarding data (called after successful auth transfer)
   */
  static async clearGuestOnboardingData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GUEST_ONBOARDING_DATA),
        AsyncStorage.removeItem(GUEST_ONBOARDING_COMPLETED),
        AsyncStorage.removeItem(GUEST_DEMO_PROGRESS)
      ])
      console.log('✅ All guest onboarding data cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing guest onboarding data:', error)
      throw error
    }
  }

  /**
   * Check if there's any guest data available for transfer
   */
  static async hasGuestDataForTransfer(): Promise<boolean> {
    try {
      const [onboardingData, isCompleted] = await Promise.all([
        GuestDataManager.getGuestOnboarding(),
        GuestDataManager.isGuestOnboardingCompleted()
      ])
      
      return onboardingData !== null && isCompleted
    } catch (error) {
      console.error('❌ Error checking guest data for transfer:', error)
      return false
    }
  }

  /**
   * Get summary of guest data for debugging
   */
  static async getGuestDataSummary(): Promise<{
    hasOnboardingData: boolean
    isCompleted: boolean
    hasDemoProgress: boolean
    categoryName?: string
    goalTitle?: string
    habitsCount?: number
  }> {
    try {
      const [onboardingData, isCompleted, demoProgress] = await Promise.all([
        GuestDataManager.getGuestOnboarding(),
        GuestDataManager.isGuestOnboardingCompleted(),
        GuestDataManager.getGuestDemoProgress()
      ])

      return {
        hasOnboardingData: onboardingData !== null,
        isCompleted,
        hasDemoProgress: demoProgress !== null,
        categoryName: onboardingData?.selectedCategory?.name,
        goalTitle: onboardingData?.selectedGoal?.title,
        habitsCount: onboardingData?.selectedHabits?.length || 0
      }
    } catch (error) {
      console.error('❌ Error getting guest data summary:', error)
      return {
        hasOnboardingData: false,
        isCompleted: false,
        hasDemoProgress: false
      }
    }
  }
}
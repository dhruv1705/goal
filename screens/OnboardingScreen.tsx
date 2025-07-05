import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { 
  categoryTemplates, 
  goalTemplates,
  getGoalsByCategory,
  getHabitsByGoal,
  CategoryTemplate,
  GoalTemplate,
  HabitTemplate,
  DemoExperience
} from '../data/onboardingTemplates'
import { BreathingExerciseModal } from '../components/BreathingExerciseModal'
import { StretchExerciseModal } from '../components/StretchExerciseModal'
import { GuestDataManager, GuestOnboardingData } from '../lib/guestDataManager'

const { width } = Dimensions.get('window')

interface OnboardingScreenProps {
  navigation: any
  onComplete: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0) // 0: Category, 1: Goal, 2: Demo, 3: Habits + Summary
  const [selectedCategory, setSelectedCategory] = useState<CategoryTemplate | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<GoalTemplate | null>(null)
  const [selectedHabits, setSelectedHabits] = useState<HabitTemplate[]>([])
  const [motivationContext, setMotivationContext] = useState<string>('')
  const [timeCommitment, setTimeCommitment] = useState<'light' | 'moderate' | 'intensive'>('moderate')
  const [loading, setLoading] = useState(false)
  
  // Demo-related state
  const [demoCompleted, setDemoCompleted] = useState(false)
  const [demoXP, setDemoXP] = useState(0)
  const [showBreathingModal, setShowBreathingModal] = useState(false)
  const [showStretchModal, setShowStretchModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<string>('')
  const [gratitudePerson, setGratitudePerson] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  
  const { user } = useAuth()
  const { updatePreferences, completeOnboardingLocally } = usePreferences()
  const insets = useSafeAreaInsets()

  const totalSteps = 4 // Category -> Goal -> Demo -> Habits + Summary

  const timeCommitmentOptions = [
    { 
      id: 'light', 
      label: 'Light', 
      description: '15-30 min/day', 
      icon: '🌱',
      color: '#10B981'
    },
    { 
      id: 'moderate', 
      label: 'Moderate', 
      description: '30-60 min/day', 
      icon: '🌿',
      color: '#3B82F6'
    },
    { 
      id: 'intensive', 
      label: 'Intensive', 
      description: '60+ min/day', 
      icon: '🌳',
      color: '#8B5CF6'
    }
  ]

  // Demo helper functions
  const expenseOptions = [
    { label: '$5 Coffee', value: 'coffee' },
    { label: '$12 Lunch', value: 'lunch' },
    { label: '$3 Snack', value: 'snack' },
    { label: 'Other', value: 'other' }
  ]

  const moodOptions = [
    { label: 'Stressed 😰', value: 'stressed' },
    { label: 'Balanced 😌', value: 'balanced' },
    { label: 'Energized ⚡', value: 'energized' }
  ]

  const getCurrentDemo = (): DemoExperience | null => {
    if (!selectedGoal?.demoExperience) return null
    return selectedGoal.demoExperience
  }

  const startGoalSpecificDemo = () => {
    const demo = getCurrentDemo()
    if (!demo) return

    switch (demo.type) {
      case 'stretch':
        setShowStretchModal(true)
        break
      case 'breathing':
        setShowBreathingModal(true)
        break
      case 'expense':
        showExpenseTracker()
        break
      case 'gratitude':
        showGratitudeExercise()
        break
      case 'mindfulness':
        showMindfulnessCheck()
        break
    }
  }

  const showExpenseTracker = () => {
    Alert.alert(
      'Track Your Spending 💰',
      getCurrentDemo()?.instruction || 'What did you spend on today?',
      [
        ...expenseOptions.map(option => ({
          text: option.label,
          onPress: () => {
            setSelectedExpense(option.value)
            completeDemoTask()
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const showGratitudeExercise = () => {
    Alert.prompt(
      'Express Gratitude 🤝',
      getCurrentDemo()?.instruction || 'Think of someone who made your day better - who was it?',
      (text?: string) => {
        if (text && text.trim()) {
          setGratitudePerson(text)
          completeDemoTask()
        }
      },
      'plain-text',
      '',
      'default'
    )
  }

  const showMindfulnessCheck = () => {
    Alert.alert(
      'Check In With Yourself ⚖️',
      getCurrentDemo()?.instruction || 'How are you feeling right now?',
      [
        ...moodOptions.map(option => ({
          text: option.label,
          onPress: () => {
            setSelectedMood(option.value)
            completeDemoTask()
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const completeDemoTask = () => {
    const demo = getCurrentDemo()
    if (!demo) return
    
    setDemoXP(demo.xpReward)
    setDemoCompleted(true)
    
    // Show success message
    setTimeout(() => {
      Alert.alert(
        'Well Done! 🎉',
        demo.successMessage,
        [{ text: 'Continue', onPress: () => setCurrentStep(3) }]
      )
    }, 500)
  }

  const handleBreathingComplete = () => {
    setShowBreathingModal(false)
    completeDemoTask()
  }

  const handleBreathingCancel = async () => {
    setShowBreathingModal(false)
    
    // Stop any voice that might be playing
    try {
      const Speech = await import('expo-speech')
      await Speech.stop()
    } catch (error) {
      console.log('Error stopping speech in onboarding:', error)
    }
  }

  const handleStretchComplete = () => {
    setShowStretchModal(false)
    completeDemoTask()
  }

  const handleStretchCancel = async () => {
    setShowStretchModal(false)
    
    // Stop any voice that might be playing
    try {
      const Speech = await import('expo-speech')
      await Speech.stop()
    } catch (error) {
      console.log('Error stopping speech in onboarding:', error)
    }
  }

  const handleComplete = async () => {
    if (!user) {
      // Guest user - save onboarding data to AsyncStorage
      console.log('=== GUEST ONBOARDING COMPLETION ===')
      
      try {
        const guestData: GuestOnboardingData = {
          selectedCategory,
          selectedGoal,
          selectedHabits,
          timeCommitment,
          motivationContext,
          demoCompleted,
          demoXP,
          completedAt: new Date().toISOString()
        }

        console.log('Saving guest onboarding data:', {
          category: selectedCategory?.name,
          goal: selectedGoal?.title,
          habitsCount: selectedHabits.length,
          demoXP,
          timeCommitment
        })

        // Save guest data to AsyncStorage
        await GuestDataManager.saveGuestOnboarding(guestData)
        await GuestDataManager.markGuestOnboardingCompleted()

        console.log('✅ Guest onboarding data saved successfully')

        setTimeout(() => {
          Alert.alert(
            'Progress Saved! 🎉',
            `Amazing! You earned ${demoXP} XP and selected ${selectedHabits.length} habits. Your progress is saved - sign up to unlock the full experience!`,
            [{ text: 'Continue to Sign Up!' }]
          )
        }, 500)

      } catch (error) {
        console.error('❌ Error saving guest onboarding data:', error)
        
        setTimeout(() => {
          Alert.alert(
            'Demo Complete! 🎉',
            `You earned ${demoXP} XP and selected ${selectedHabits.length} habits. Sign up to save your progress!`,
            [{ text: 'Continue!' }]
          )
        }, 500)
      }
      
      onComplete()
      return
    }

    setLoading(true)
    console.log('=== ENHANCED ONBOARDING COMPLETION STARTED ===')

    try {
      console.log('Starting enhanced onboarding completion...', {
        userId: user.id,
        selectedCategory: selectedCategory?.name,
        selectedGoal: selectedGoal?.title,
        selectedHabits: selectedHabits.map(h => h.title),
        timeCommitment
      })

      // Map onboarding goal IDs to database goal template names
      const goalIdMapping: { [key: string]: string } = {
        'weight-loss': 'lose-weight',
        'muscle-gain': 'build-muscle', 
        'endurance': 'improve-cardio',
        'flexibility': 'improve-cardio', // Use cardio as fallback for flexibility
        'stress-relief': 'reduce-stress',
        'mindfulness': 'build-mindfulness',
        'sleep-improvement': 'improve-sleep',
        'budgeting': 'budget-better',
        'saving': 'save-money',
        'investing': 'build-wealth',
        'communication': 'improve-relationships',
        'networking': 'network-better',
        'confidence': 'build-confidence'
      }

      const databaseGoalName = goalIdMapping[selectedGoal?.id || ''] || 'lose-weight' // Default fallback

      // Check if habit system tables exist by attempting to query goal_templates
      let { data: goalTemplates, error: goalTemplateError } = await supabase
        .from('goal_templates')
        .select('id, skill_id')
        .eq('name', databaseGoalName)
        .single()

      if (goalTemplateError) {
        console.error('Goal template error:', goalTemplateError)
        
        // If the table doesn't exist (relation does not exist), skip habit system setup
        if (goalTemplateError.code === '42P01') {
          console.log('Habit system tables do not exist, skipping habit system setup...')
          
          // Just complete the onboarding without creating habit system entries
          await updatePreferences({
            onboardingCompleted: true,
            selectedCategory: selectedCategory?.name,
            selectedGoal: selectedGoal?.title,
            timeCommitment,
            motivationContext,
            demoXP: demoXP || 0
          })
          
          completeOnboardingLocally()
          console.log('✅ Onboarding completed successfully (without habit system)')
          
          setTimeout(() => {
            Alert.alert(
              'Welcome! 🎉',
              `Great job! You've completed the onboarding and earned ${demoXP} XP. Let's start building your ${selectedGoal?.title} habit!`,
              [{ text: 'Let\'s Go!' }]
            )
          }, 500)
          
          onComplete()
          return
        }
        
        console.log('Attempting fallback to lose-weight goal...')
        
        // Fallback: try to get the lose-weight goal as default
        const { data: fallbackGoal, error: fallbackError } = await supabase
          .from('goal_templates')
          .select('id, skill_id')
          .eq('name', 'lose-weight')
          .single()
          
        if (fallbackError || !fallbackGoal) {
          console.log('No goal templates found, completing onboarding without habit system...')
          
          // Complete without habit system
          await updatePreferences({
            onboardingCompleted: true,
            selectedCategory: selectedCategory?.name,
            selectedGoal: selectedGoal?.title,
            timeCommitment,
            motivationContext,
            demoXP: demoXP || 0
          })
          
          completeOnboardingLocally()
          console.log('✅ Onboarding completed successfully (without habit system)')
          
          setTimeout(() => {
            Alert.alert(
              'Welcome! 🎉',
              `Great job! You've completed the onboarding and earned ${demoXP} XP. Your schedule is ready!`,
              [{ text: 'Let\'s Go!' }]
            )
          }, 500)
          
          onComplete()
          return
        }
        
        console.log('Using fallback goal template:', fallbackGoal.id)
        goalTemplates = fallbackGoal
      }

      console.log('✅ Found goal template:', goalTemplates.id)

      // Check if user already has this active goal
      const { data: existingGoal } = await supabase
        .from('user_active_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('goal_template_id', goalTemplates.id)
        .single()

      let createdUserGoal
      if (existingGoal) {
        console.log('✅ User already has this active goal:', existingGoal.id)
        createdUserGoal = existingGoal
      } else {
        // Create user active goal
        const userActiveGoalData = {
          user_id: user.id,
          goal_template_id: goalTemplates.id,
          status: 'active',
          current_level: 1,
          time_commitment: timeCommitment,
          start_date: new Date().toISOString().split('T')[0]
        }

        console.log('Creating user active goal:', userActiveGoalData)
        const { data: newUserGoal, error: userGoalError } = await supabase
          .from('user_active_goals')
          .insert(userActiveGoalData)
          .select()
          .single()

        if (userGoalError) {
          console.error('Error creating user active goal:', userGoalError)
          throw userGoalError
        }
        
        createdUserGoal = newUserGoal
      }

      console.log('✅ User active goal created successfully:', createdUserGoal.id)

      // Create user XP progress if it doesn't exist
      const { data: existingXP } = await supabase
        .from('user_xp_progress')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!existingXP) {
        const userXPData = {
          user_id: user.id,
          total_xp: demoXP || 0,
          current_level: 1,
          xp_to_next_level: 100 - (demoXP || 0),
          daily_xp_goal: timeCommitment === 'light' ? 30 : timeCommitment === 'moderate' ? 50 : 80,
          current_streak: 0,
          best_streak: 0
        }

        console.log('Creating user XP progress:', userXPData)
        const { error: xpError } = await supabase
          .from('user_xp_progress')
          .insert(userXPData)

        if (xpError) {
          console.error('Error creating XP progress:', xpError)
          // Don't throw, XP is not critical for onboarding
        } else {
          console.log('✅ User XP progress created successfully')
        }
      }

      // Get habit templates for this goal and create user habit progress
      const { data: habitTemplates, error: habitTemplateError } = await supabase
        .from('habit_templates')
        .select('id, title, level, xp_reward')
        .eq('goal_template_id', goalTemplates.id)
        .eq('level', 1) // Start with level 1 habits
        .order('order_index')

      if (habitTemplateError || !habitTemplates?.length) {
        console.error('No habit templates found:', habitTemplateError)
        // Continue without habits for now
      } else {
        console.log(`Found ${habitTemplates.length} level 1 habit templates`)

        // Create user habit progress for level 1 habits
        const habitProgressPromises = habitTemplates.slice(0, Math.min(3, habitTemplates.length)).map(async (habitTemplate) => {
          const habitProgressData = {
            user_id: user.id,
            user_active_goal_id: createdUserGoal.id,
            habit_template_id: habitTemplate.id,
            status: 'available', // First few habits are immediately available
            completed_count: 0,
            best_streak: 0,
            current_streak: 0,
            total_xp_earned: 0,
            unlocked_at: new Date().toISOString()
          }

          return supabase.from('user_habit_progress').insert(habitProgressData)
        })

        const habitResults = await Promise.all(habitProgressPromises)
        const habitErrors = habitResults.filter(result => result.error)
        
        if (habitErrors.length > 0) {
          console.error('Some habit progress entries failed to create:', habitErrors)
        } else {
          console.log('✅ All initial habit progress entries created successfully')
        }
      }

      // Save onboarding completion with enhanced data
      const onboardingData = {
        user_id: user.id,
        primary_goal: goalTemplates.id, // Use the actual goal template ID
        motivation_context: motivationContext,
        time_commitment: timeCommitment,
        selected_category: goalTemplates.skill_id, // Use the skill ID
        completed_at: new Date().toISOString()
      }

      console.log('Saving enhanced onboarding data:', onboardingData)
      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert(onboardingData, { onConflict: 'user_id' })

      if (onboardingError) {
        console.error('Error saving onboarding:', onboardingError)
        throw onboardingError
      }

      console.log('✅ Enhanced onboarding saved successfully')

      // Update local preferences
      console.log('🔄 Updating local onboarding state...')
      completeOnboardingLocally()
      
      // Wait a moment for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🚀 Calling onComplete callback...')
      onComplete()
      
      console.log('=== ENHANCED ONBOARDING COMPLETION FINISHED ===')

      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          'Welcome! 🎉',
          `Your ${selectedGoal?.title || 'goal'} journey is ready! You've unlocked Level 1 habits and earned ${demoXP} XP. Time to build amazing habits!`,
          [{ text: 'Let\'s Go!' }]
        )
      }, 1000)

    } catch (error: any) {
      console.error('❌ Error completing enhanced onboarding:', error)
      Alert.alert(
        'Setup Error',
        `Failed to save your preferences: ${error.message || 'Unknown error'}. Would you like to try again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleComplete }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 0 && !selectedCategory) {
      Alert.alert('Selection Required', 'Please select a category to continue.')
      return
    }
    if (currentStep === 1 && !selectedGoal) {
      Alert.alert('Selection Required', 'Please select a goal to continue.')
      return
    }
    if (currentStep === 2 && !demoCompleted) {
      Alert.alert('Complete Demo', 'Please complete the demo experience to continue.')
      return
    }
    if (currentStep === 3 && selectedHabits.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one habit to continue.')
      return
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    Alert.alert(
      'Skip Onboarding',
      'You can always set your preferences later in the Profile settings. Continue with default settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: onComplete }
      ]
    )
  }

  const toggleHabitSelection = (habit: HabitTemplate) => {
    setSelectedHabits(prev => {
      const isSelected = prev.some(h => h.id === habit.id)
      if (isSelected) {
        return prev.filter(h => h.id !== habit.id)
      } else {
        return [...prev, habit]
      }
    })
  }

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{currentStep + 1} of {totalSteps}</Text>
    </View>
  )

  const renderStep0 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Your Focus Area 🎯</Text>
      <Text style={styles.stepSubtitle}>
        What aspect of your life would you like to improve most?
      </Text>

      <View style={styles.optionsContainer}>
        {categoryTemplates.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryOption,
              selectedCategory?.id === category.id && styles.categoryOptionSelected
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory?.id === category.id && styles.categoryLabelSelected
                ]}>
                  {category.name}
                </Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            </View>
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              {category.benefits.slice(0, 2).map((benefit, index) => (
                <Text key={index} style={styles.benefitItem}>• {benefit}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderStep1 = () => {
    if (!selectedCategory) return null
    const availableGoals = getGoalsByCategory(selectedCategory.id)

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Select Your Goal 🏆</Text>
        <Text style={styles.stepSubtitle}>
          Choose a specific goal within {selectedCategory.name}
        </Text>

        <View style={styles.optionsContainer}>
          {availableGoals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalOption,
                selectedGoal?.id === goal.id && styles.goalOptionSelected
              ]}
              onPress={() => setSelectedGoal(goal)}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.goalTextContainer}>
                  <Text style={[
                    styles.goalTitle,
                    selectedGoal?.id === goal.id && styles.goalTitleSelected
                  ]}>
                    {goal.title}
                  </Text>
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                </View>
                <View style={[styles.difficultyBadge, getDifficultyStyle(goal.difficulty)]}>
                  <Text style={styles.difficultyText}>
                    {goal.difficulty.charAt(0).toUpperCase() + goal.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.goalDetails}>
                <Text style={styles.estimatedDuration}>🕐 {goal.estimatedDuration}</Text>
                <Text style={styles.benefitsPreview}>
                  ✨ {goal.benefits.slice(0, 2).join(', ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  const renderStep2 = () => {
    if (!selectedGoal) return null
    const demo = getCurrentDemo()
    
    if (!demo) {
      // If no demo available, skip to habits step
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>No Demo Available 📝</Text>
          <Text style={styles.stepSubtitle}>
            This goal doesn't have a demo experience yet. Let's proceed to select your habits!
          </Text>
          <TouchableOpacity
            style={styles.skipDemoButton}
            onPress={() => setCurrentStep(3)}
          >
            <Text style={styles.skipDemoText}>Continue to Habits</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Try This Experience! 🎆</Text>
        <Text style={styles.stepSubtitle}>
          Get a taste of your goal: {selectedGoal.title}
        </Text>

        <View style={styles.demoContainer}>
          <TouchableOpacity
            style={[
              styles.demoCard,
              demoCompleted && styles.demoCardCompleted
            ]}
            onPress={startGoalSpecificDemo}
            disabled={demoCompleted}
          >
            <View style={styles.demoIcon}>
              <Text style={styles.demoEmoji}>{selectedGoal.icon}</Text>
            </View>
            
            <View style={styles.demoContent}>
              <Text style={[
                styles.demoLabel,
                demoCompleted && styles.demoLabelCompleted
              ]}>
                {demo.instruction}
              </Text>
              <Text style={styles.demoInstruction}>
                Tap to start your {selectedGoal.title.toLowerCase()} experience
              </Text>
            </View>
            
            <View style={styles.demoXP}>
              <Text style={styles.demoXPText}>+{demo.xpReward} XP</Text>
            </View>
            
            {demoCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {demoCompleted && (
            <View style={styles.demoSuccessContainer}>
              <Text style={styles.demoSuccessText}>
                🎉 Excellent! You earned {demoXP} XP. Ready to build lasting habits?
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderStep3 = () => {
    if (!selectedGoal) return null
    const availableHabits = getHabitsByGoal(selectedGoal.id)

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Choose Your Habits 📝</Text>
        <Text style={styles.stepSubtitle}>
          Select habits that will help you achieve: {selectedGoal.title}
        </Text>

        {/* Time Commitment Selector */}
        <View style={styles.timeCommitmentContainer}>
          <Text style={styles.timeCommitmentTitle}>Time Commitment:</Text>
          <View style={styles.timeCommitmentOptions}>
            {timeCommitmentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timeCommitmentOption,
                  timeCommitment === option.id && { backgroundColor: option.color }
                ]}
                onPress={() => setTimeCommitment(option.id as any)}
              >
                <Text style={styles.timeCommitmentIcon}>{option.icon}</Text>
                <Text style={[
                  styles.timeCommitmentLabel,
                  timeCommitment === option.id && { color: '#FFFFFF' }
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.timeCommitmentDesc,
                  timeCommitment === option.id && { color: '#E5E7EB' }
                ]}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Habit Selection */}
        <View style={styles.habitsContainer}>
          <Text style={styles.habitsTitle}>Available Habits:</Text>
          {availableHabits.map((habit) => {
            const isSelected = selectedHabits.some(h => h.id === habit.id)
            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitOption,
                  isSelected && styles.habitOptionSelected
                ]}
                onPress={() => toggleHabitSelection(habit)}
              >
                <View style={styles.habitHeader}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <View style={styles.habitTextContainer}>
                    <Text style={[
                      styles.habitTitle,
                      isSelected && styles.habitTitleSelected
                    ]}>
                      {habit.title}
                    </Text>
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                  </View>
                  <View style={styles.habitMeta}>
                    <Text style={styles.habitFrequency}>
                      {habit.defaultTimes}x {habit.frequency}
                    </Text>
                    <Text style={styles.habitXP}>+{habit.xpReward} XP</Text>
                  </View>
                </View>
                
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓ Selected</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.habitSelectionNote}>
          💡 You can always add or remove habits later in the main app
        </Text>

        {/* Summary Section - shown once habits are selected */}
        {selectedHabits.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Ready to Start! 🚀</Text>
            
            <View style={styles.summaryContainer}>
              {/* Demo Summary */}
              {demoCompleted && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryCardTitle}>Demo Completed</Text>
                  <View style={styles.summaryItem}>
                    <View style={[styles.summaryIconContainer, { backgroundColor: selectedCategory?.color }]}>
                      <Text style={styles.summaryIcon}>{selectedGoal?.icon}</Text>
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryName}>Experience: {selectedGoal?.title}</Text>
                      <Text style={styles.summaryDesc}>+{demoXP} XP earned</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Habits Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Your Habits ({selectedHabits.length})</Text>
                {selectedHabits.slice(0, 3).map((habit) => (
                  <View key={habit.id} style={styles.summaryHabitItem}>
                    <Text style={styles.summaryHabitIcon}>{habit.icon}</Text>
                    <View style={styles.summaryHabitContent}>
                      <Text style={styles.summaryHabitName}>{habit.title}</Text>
                      <Text style={styles.summaryHabitFreq}>
                        {habit.defaultTimes}x {habit.frequency} • +{habit.xpReward} XP
                      </Text>
                    </View>
                  </View>
                ))}
                {selectedHabits.length > 3 && (
                  <Text style={styles.moreHabitsText}>
                    +{selectedHabits.length - 3} more habits
                  </Text>
                )}
              </View>

              {/* Stats Summary */}
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{selectedHabits.length}</Text>
                  <Text style={styles.statLabel}>Habits</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{demoXP + selectedHabits.reduce((sum, habit) => sum + habit.xpReward, 0)}</Text>
                  <Text style={styles.statLabel}>Total XP</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{timeCommitment}</Text>
                  <Text style={styles.statLabel}>Pace</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderStep4 = () => {
    const totalHabitsXP = selectedHabits.reduce((sum, habit) => sum + habit.xpReward, 0)
    const totalXP = demoXP + totalHabitsXP
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>You're Ready! 🚀</Text>
        <Text style={styles.stepSubtitle}>
          Review your personalized habit plan
        </Text>

        <View style={styles.summaryContainer}>
          {/* Category Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Focus Area</Text>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIconContainer, { backgroundColor: selectedCategory?.color }]}>
                <Text style={styles.summaryIcon}>{selectedCategory?.icon}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryName}>{selectedCategory?.name}</Text>
                <Text style={styles.summaryDesc}>{selectedCategory?.description}</Text>
              </View>
            </View>
          </View>

          {/* Goal Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Your Goal</Text>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>{selectedGoal?.icon}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryName}>{selectedGoal?.title}</Text>
                <Text style={styles.summaryDesc}>
                  {selectedGoal?.difficulty} • {selectedGoal?.estimatedDuration}
                </Text>
              </View>
            </View>
          </View>

          {/* Habits Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>Your Habits ({selectedHabits.length})</Text>
            {selectedHabits.map((habit) => (
              <View key={habit.id} style={styles.summaryHabitItem}>
                <Text style={styles.summaryHabitIcon}>{habit.icon}</Text>
                <View style={styles.summaryHabitContent}>
                  <Text style={styles.summaryHabitName}>{habit.title}</Text>
                  <Text style={styles.summaryHabitFreq}>
                    {habit.defaultTimes}x {habit.frequency} • +{habit.xpReward} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{selectedHabits.length}</Text>
              <Text style={styles.statLabel}>Habits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalXP}</Text>
              <Text style={styles.statLabel}>XP/day</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{timeCommitment}</Text>
              <Text style={styles.statLabel}>Commitment</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { backgroundColor: '#10B981' }
      case 'intermediate':
        return { backgroundColor: '#F59E0B' }
      case 'advanced':
        return { backgroundColor: '#EF4444' }
      default:
        return { backgroundColor: '#6B7280' }
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0()
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3() // Habits + Summary combined
      default:
        return renderStep0()
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Your Goals</Text>
        <View style={styles.skipPlaceholder} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(8, insets.bottom) }]}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            loading && styles.nextButtonDisabled,
            currentStep === 0 ? styles.nextButtonFull : styles.nextButtonHalf
          ]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Setting up...' : currentStep === totalSteps - 1 ? 'Complete Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Demo Modals */}
      <BreathingExerciseModal
        visible={showBreathingModal}
        onComplete={handleBreathingComplete}
        onCancel={handleBreathingCancel}
      />

      <StretchExerciseModal
        visible={showStretchModal}
        onComplete={handleStretchComplete}
        onCancel={handleStretchCancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '500',
  },
  skipPlaceholder: {
    width: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
  },
  
  // Category Selection Styles
  categoryOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F9FF',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryLabelSelected: {
    color: '#7C3AED',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  benefitItem: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Goal Selection Styles
  goalOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F9FF',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 4,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  goalTitleSelected: {
    color: '#7C3AED',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  estimatedDuration: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  benefitsPreview: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Time Commitment Styles
  timeCommitmentContainer: {
    marginBottom: 24,
  },
  timeCommitmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  timeCommitmentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCommitmentOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeCommitmentIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  timeCommitmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  timeCommitmentDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Habit Selection Styles
  habitsContainer: {
    marginTop: 8,
  },
  habitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  habitOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  habitOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F9FF',
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  habitTextContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  habitTitleSelected: {
    color: '#7C3AED',
  },
  habitDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  habitMeta: {
    alignItems: 'flex-end',
  },
  habitFrequency: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  habitXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  selectedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedIndicatorText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
  habitSelectionNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },

  // Summary Styles
  summaryContainer: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryIcon: {
    fontSize: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  summaryDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryHabitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryHabitIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  summaryHabitContent: {
    flex: 1,
  },
  summaryHabitName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  summaryHabitFreq: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '500',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonHalf: {
    flex: 2,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Demo Styles
  demoContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
    width: '100%',
  },
  demoCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  demoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  demoEmoji: {
    fontSize: 28,
  },
  demoContent: {
    flex: 1,
  },
  demoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  demoLabelCompleted: {
    color: '#059669',
  },
  demoInstruction: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  demoXP: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  demoXPText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoSuccessContainer: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    width: '100%',
  },
  demoSuccessText: {
    fontSize: 16,
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  skipDemoButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  skipDemoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summarySection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  moreHabitsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
})
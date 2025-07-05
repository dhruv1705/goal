import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { BreathingExerciseModal } from '../components/BreathingExerciseModal'

const { width, height } = Dimensions.get('window')

interface OnboardingScreenProps {
  navigation: any
  onComplete: (totalXP?: number, completedHabits?: number) => void
}

interface CategoryOption {
  id: string
  name: string
  color: string
  icon: string
  description: string
  examples: string[]
}

const categories: CategoryOption[] = [
  {
    id: 'physical-health',
    name: 'Physical Health',
    color: '#FF6B6B',
    icon: '💪',
    description: 'Improve your fitness, nutrition, and overall physical wellbeing',
    examples: ['Exercise regularly', 'Eat healthier', 'Sleep better', 'Track weight']
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    color: '#4ECDC4',
    icon: '🧠',
    description: 'Focus on mindfulness, stress management, and emotional wellbeing',
    examples: ['Practice meditation', 'Manage stress', 'Build habits', 'Self-care routines']
  },
  {
    id: 'finance',
    name: 'Finance',
    color: '#45B7D1',
    icon: '💰',
    description: 'Manage money, savings, investments, and financial goals',
    examples: ['Save money', 'Budget tracking', 'Debt management', 'Investment goals']
  },
  {
    id: 'social',
    name: 'Social',
    color: '#96CEB4',
    icon: '👥',
    description: 'Build relationships, networking, and social connections',
    examples: ['Meet new people', 'Strengthen friendships', 'Family time', 'Professional networking']
  },
]

const demoHabits = [
  { 
    id: 'water', 
    label: 'Drink a glass of water', 
    icon: '💧', 
    xp: 10,
    type: 'confirmation',
    instruction: 'Grab a glass of water and take a sip!'
  },
  { 
    id: 'stretch', 
    label: 'Do a 2-minute stretch', 
    icon: '🤸‍♂️', 
    xp: 15,
    type: 'timer',
    duration: 120,
    instruction: 'Let\'s do some simple stretches together'
  },
  { 
    id: 'breathe', 
    label: 'Take 5 deep breaths', 
    icon: '🌬️', 
    xp: 10,
    type: 'breathing',
    duration: 30,
    instruction: 'Follow the breathing animation'
  },
  { 
    id: 'smile', 
    label: 'Smile for 10 seconds', 
    icon: '😊', 
    xp: 5,
    type: 'timer',
    duration: 10,
    instruction: 'Keep smiling! You\'re doing great!'
  },
]

const primaryGoalOptions = [
  { id: 'health-transformation', label: 'Transform my health and fitness', icon: '🏃‍♂️' },
  { id: 'financial-freedom', label: 'Achieve financial stability', icon: '💎' },
  { id: 'mental-wellness', label: 'Improve mental wellbeing', icon: '🧘‍♀️' },
  { id: 'social-growth', label: 'Build better relationships', icon: '🤝' },
  { id: 'overall-balance', label: 'Create overall life balance', icon: '⚖️' },
]

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0) // Start at 0 for demo
  const [primaryGoal, setPrimaryGoal] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [motivationContext, setMotivationContext] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [demoCompleted, setDemoCompleted] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [completedHabits, setCompletedHabits] = useState<string[]>([])
  const [activeHabit, setActiveHabit] = useState<string | null>(null)
  const [habitTimer, setHabitTimer] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale')
  const [breathCount, setBreathCount] = useState(0)
  const [breathingText, setBreathingText] = useState('')
  const [showBreathingModal, setShowBreathingModal] = useState(false)
  
  const { user } = useAuth()
  const { updatePreferences, completeOnboardingLocally } = usePreferences()
  const insets = useSafeAreaInsets()

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const xpAnim = useRef(new Animated.Value(0)).current
  const streakAnim = useRef(new Animated.Value(0)).current
  const timerAnim = useRef(new Animated.Value(0)).current
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Breathing guidance texts
  const encouragingTexts = [
    "Feel the calm flowing through you...",
    "Let go of any tension...",
    "You're doing wonderfully...",
    "Notice the peace within...",
    "Almost there, stay focused..."
  ]

  const totalSteps = 4 // Added demo step

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
    } else if (selectedCategories.length < 2) {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const getCategoryPriorityScore = (categoryId: string): number => {
    if (selectedCategories.length === 0) return 25 // Default balanced
    
    const index = selectedCategories.indexOf(categoryId)
    if (index === 0) return 100 // Primary category
    if (index === 1) return 60  // Secondary category
    return 30 // Other categories
  }

  const getIsPrimary = (categoryId: string): boolean => {
    return selectedCategories.length > 0 && selectedCategories[0] === categoryId
  }

  const mapCategoryIdToName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || categoryId
  }

  const handleComplete = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setLoading(true)
    console.log('=== ONBOARDING COMPLETION STARTED ===')

    try {
      console.log('Starting onboarding completion...', {
        userId: user.id,
        selectedCategories,
        primaryGoal
      })

      // Save user preferences
      const preferencesData = categories.map(category => ({
        user_id: user.id,
        category: category.name,
        priority_score: getCategoryPriorityScore(category.id),
        is_primary: getIsPrimary(category.id),
      }))

      console.log('Saving preferences:', preferencesData)

      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert(preferencesData, { onConflict: 'user_id,category' })

      if (preferencesError) {
        console.error('Error saving preferences:', preferencesError)
        throw preferencesError
      }

      console.log('✅ Preferences saved successfully')

      // Save onboarding completion
      const onboardingData = {
        user_id: user.id,
        primary_goal: primaryGoal,
        motivation_context: motivationContext,
      }

      console.log('Saving onboarding data:', onboardingData)

      const { error: onboardingError } = await supabase
        .from('user_onboarding')
        .upsert(onboardingData, { onConflict: 'user_id' })

      if (onboardingError) {
        console.error('Error saving onboarding:', onboardingError)
        throw onboardingError
      }

      console.log('✅ Onboarding saved successfully')

      // CRITICAL: Update local state first
      console.log('🔄 Updating local onboarding state...')
      completeOnboardingLocally()
      
      // Wait a moment for state to propagate
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🚀 Calling onComplete callback...')
      onComplete()
      
      console.log('=== ONBOARDING COMPLETION FINISHED ===')

      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          'Welcome! 🎉',
          'Your personalized experience is ready!',
          [{ text: 'OK' }]
        )
      }, 1000)

    } catch (error: any) {
      console.error('❌ Error completing onboarding:', error)
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

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start()
  }, [currentStep])

  const startHabitActivity = (habitId: string) => {
    if (completedHabits.includes(habitId)) return
    
    const habit = demoHabits.find(h => h.id === habitId)
    if (!habit) return
    
    setActiveHabit(habitId)
    
    if (habit.type === 'confirmation') {
      // Simple confirmation - just show instruction
      Alert.alert(
        habit.instruction,
        'Ready to continue?',
        [
          { text: 'Not Yet', style: 'cancel' },
          { text: 'Done! 💪', onPress: () => completeHabit(habitId, habit.xp) }
        ]
      )
    } else if (habit.type === 'timer') {
      // Start timer-based activity
      setHabitTimer(habit.duration!)
      startTimer(habitId, habit.duration!, habit.xp)
    } else if (habit.type === 'breathing') {
      // Start full-screen breathing exercise
      setShowBreathingModal(true)
    }
  }
  
  const startTimer = (habitId: string, duration: number, xp: number) => {
    timerRef.current = setInterval(() => {
      setHabitTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          completeHabit(habitId, xp)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Progress animation
    Animated.timing(timerAnim, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start()
  }
  
  const handleBreathingComplete = () => {
    setShowBreathingModal(false)
    const habit = demoHabits.find(h => h.id === 'breathe')
    if (habit) {
      completeHabit('breathe', habit.xp)
    }
  }

  const handleBreathingCancel = () => {
    setShowBreathingModal(false)
    setActiveHabit(null)
  }

  const startBreathingExercise = (habitId: string, xp: number) => {
    // Start particle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(particleAnim1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim1, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start()
    
    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(particleAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim2, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start()
    
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(particleAnim3, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim3, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start()
    
    Animated.timing(particleOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
    
    const breathingCycle = () => {
      const currentBreathIndex = breathCount
      const encouragingText = encouragingTexts[Math.min(currentBreathIndex, encouragingTexts.length - 1)]
      setBreathingText(encouragingText)
      
      // Inhale phase
      setBreathingPhase('inhale')
      Animated.parallel([
        Animated.timing(breathingAnim, {
          toValue: 1.3,
          duration: 3500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(breathingColorAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: false,
        })
      ]).start(() => {
        // Brief hold
        setTimeout(() => {
          // Exhale phase
          setBreathingPhase('exhale')
          Animated.parallel([
            Animated.timing(breathingAnim, {
              toValue: 0.8,
              duration: 3500,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: true,
            }),
            Animated.timing(breathingColorAnim, {
              toValue: 0,
              duration: 3500,
              easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
              useNativeDriver: false,
            })
          ]).start(() => {
            setBreathCount(prev => {
              const newCount = prev + 1
              if (newCount >= 5) {
                completeHabit(habitId, xp)
                return 5
              }
              setTimeout(breathingCycle, 800) // Brief pause between breaths
              return newCount
            })
          })
        }, 500) // Brief hold at top of inhale
      })
    }
    breathingCycle()
  }
  
  const completeHabit = (habitId: string, xp: number) => {
    setActiveHabit(null)
    setHabitTimer(0)
    timerAnim.setValue(0)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    setCompletedHabits([...completedHabits, habitId])
    setTotalXP(totalXP + xp)
    
    // XP animation
    Animated.sequence([
      Animated.timing(xpAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(xpAnim, {
        toValue: 0,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start()

    // Streak animation
    Animated.sequence([
      Animated.timing(streakAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start()

    // Show completion celebration
    setTimeout(() => {
      if (completedHabits.length + 1 >= 2) {
        setDemoCompleted(true)
        Alert.alert(
          'Amazing! 🎉', 
          'You just experienced the power of habit completion! Ready to build your personalized habit journey?',
          [{ text: 'Let\'s Go!', onPress: () => onComplete(totalXP, completedHabits.length) }]
        )
      }
    }, 1500)
  }
  
  const cancelHabitActivity = () => {
    setActiveHabit(null)
    setHabitTimer(0)
    timerAnim.setValue(0)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !primaryGoal) {
      Alert.alert('Selection Required', 'Please select your primary goal to continue.')
      return
    }
    if (currentStep === 2 && selectedCategories.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one area to focus on.')
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

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{currentStep} of {totalSteps}</Text>
    </View>
  )

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your main goal? 🎯</Text>
      <Text style={styles.stepSubtitle}>
        Based on what you just experienced, what would you like to focus on?
      </Text>

      <View style={styles.optionsContainer}>
        {primaryGoalOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.goalOption,
              primaryGoal === option.id && styles.goalOptionSelected
            ]}
            onPress={() => setPrimaryGoal(option.id)}
          >
            <Text style={styles.goalIcon}>{option.icon}</Text>
            <Text style={[
              styles.goalLabel,
              primaryGoal === option.id && styles.goalLabelSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your focus areas</Text>
      <Text style={styles.stepSubtitle}>
        Select 1-2 categories you want to prioritize (tap to select)
      </Text>

      <View style={styles.categoriesContainer}>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id)
          const isPrimary = selectedCategories[0] === category.id
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
                isPrimary && styles.categoryCardPrimary,
                selectedCategories.length >= 2 && !isSelected && styles.categoryCardDisabled
              ]}
              onPress={() => handleCategorySelect(category.id)}
              disabled={selectedCategories.length >= 2 && !isSelected}
            >
              <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <Text style={[
                styles.categoryName,
                isSelected && styles.categoryNameSelected
              ]}>
                {category.name}
              </Text>
              <Text style={[
                styles.categoryDescription,
                isSelected && styles.categoryDescriptionSelected
              ]}>
                {category.description}
              </Text>
              <View style={styles.examplesContainer}>
                {category.examples.slice(0, 2).map((example, index) => (
                  <Text key={index} style={[
                    styles.exampleText,
                    isSelected && styles.exampleTextSelected
                  ]}>
                    • {example}
                  </Text>
                ))}
              </View>
              {isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
              {isSelected && !isPrimary && (
                <View style={styles.secondaryBadge}>
                  <Text style={styles.secondaryBadgeText}>FOCUS</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {selectedCategories.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryText}>
            Primary: {mapCategoryIdToName(selectedCategories[0])}
            {selectedCategories[1] && ` • Secondary: ${mapCategoryIdToName(selectedCategories[1])}`}
          </Text>
        </View>
      )}
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ready to build your streak! 🔥</Text>
      <Text style={styles.stepSubtitle}>
        You've already completed {completedHabits.length} habits and earned {totalXP} XP! Let's keep the momentum going.
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Focus Areas:</Text>
          {selectedCategories.map((categoryId, index) => {
            const category = categories.find(cat => cat.id === categoryId)
            if (!category) return null
            
            return (
              <View key={categoryId} style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.summaryEmoji}>{category.icon}</Text>
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryName}>
                    {category.name} {index === 0 ? '(Primary)' : '(Secondary)'}
                  </Text>
                  <Text style={styles.summaryDesc}>{category.description}</Text>
                </View>
              </View>
            )
          })}
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>
          <Text style={styles.benefitItem}>✨ Personalized category prioritization</Text>
          <Text style={styles.benefitItem}>🎯 Smart goal suggestions</Text>
          <Text style={styles.benefitItem}>📊 Progress tracking for your focus areas</Text>
          <Text style={styles.benefitItem}>🔄 Recommendations based on your interests</Text>
        </View>
      </View>
    </View>
  )

  const renderDemoStep = () => (
    <Animated.View 
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }
      ]}
    >
      <Text style={styles.demoTitle}>Let's start with something simple! 🎆</Text>
      <Text style={styles.demoSubtitle}>
        Complete 2 quick habits to see how good it feels to build momentum
      </Text>

      <View style={styles.demoHabitsContainer}>
        {demoHabits.map((habit) => {
          const isCompleted = completedHabits.includes(habit.id)
          const isActive = activeHabit === habit.id
          
          return (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.demoHabitCard,
                isCompleted && styles.demoHabitCardCompleted,
                isActive && styles.demoHabitCardActive
              ]}
              onPress={() => startHabitActivity(habit.id)}
              disabled={isCompleted || isActive}
            >
              <View style={styles.demoHabitIcon}>
                <Text style={styles.demoHabitEmoji}>{habit.icon}</Text>
              </View>
              
              <View style={styles.demoHabitContent}>
                <Text style={[
                  styles.demoHabitLabel,
                  isCompleted && styles.demoHabitLabelCompleted
                ]}>
                  {habit.label}
                </Text>
                
                {isActive && habit.type === 'timer' && (
                  <View style={styles.activityContainer}>
                    <View style={styles.timerContainer}>
                      <Text style={styles.timerText}>{habitTimer}s</Text>
                      <View style={styles.timerProgress}>
                        <Animated.View style={[
                          styles.timerProgressFill,
                          { width: timerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          }) }
                        ]} />
                      </View>
                      <Text style={styles.timerInstruction}>{habit.instruction}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={cancelHabitActivity}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <View style={styles.demoHabitXP}>
                <Text style={styles.demoHabitXPText}>+{habit.xp} XP</Text>
              </View>
              
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* XP Display */}
      <Animated.View 
        style={[
          styles.xpContainer,
          {
            opacity: xpAnim,
            transform: [{ scale: xpAnim }]
          }
        ]}
      >
        <Text style={styles.xpText}>+{totalXP} XP Earned! 🎆</Text>
      </Animated.View>

      {/* Streak Display */}
      <Animated.View 
        style={[
          styles.streakContainer,
          {
            opacity: streakAnim,
            transform: [{ scale: streakAnim }]
          }
        ]}
      >
        <Text style={styles.streakText}>🔥 {completedHabits.length} habit streak!</Text>
      </Animated.View>

      {demoCompleted && (
        <View style={styles.demoCompletedContainer}>
          <Text style={styles.demoCompletedText}>
            🎉 You're already building momentum! Let's make this a daily habit.
          </Text>
        </View>
      )}
    </Animated.View>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderDemoStep()
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderDemoStep()
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
        <Text style={styles.headerTitle}>Welcome!</Text>
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
        {currentStep > 1 && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep === 0 ? (
          // Demo step - only show next after completing habits
          demoCompleted && (
            <TouchableOpacity
              style={[styles.nextButton, styles.nextButtonFull]}
              onPress={() => onComplete(totalXP, completedHabits.length)}
            >
              <Text style={styles.nextButtonText}>Build My Habit Plan! 🚀</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={[
              styles.nextButton,
              loading && styles.nextButtonDisabled,
              currentStep === 1 ? styles.nextButtonFull : styles.nextButtonHalf
            ]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Setting up...' : currentStep === totalSteps - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Debug: Add a skip button for testing */}
        {currentStep === totalSteps - 1 && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#6B7280', marginTop: 8 }]}
            onPress={() => {
              Alert.alert(
                'Skip Setup',
                'Skip for now and use default settings?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Skip', 
                    onPress: () => {
                      console.log('Skipping onboarding setup')
                      completeOnboardingLocally()
                      onComplete()
                    }
                  }
                ]
              )
            }}
          >
            <Text style={styles.nextButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full-screen breathing modal */}
      <BreathingExerciseModal
        visible={showBreathingModal}
        onComplete={handleBreathingComplete}
        onCancel={handleBreathingCancel}
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
  demoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoSubtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  demoHabitsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  demoHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoHabitCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  demoHabitCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F7FF',
  },
  demoHabitContent: {
    flex: 1,
  },
  demoHabitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  demoHabitEmoji: {
    fontSize: 24,
  },
  demoHabitLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  demoHabitLabelCompleted: {
    color: '#059669',
  },
  demoHabitXP: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  breathingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  breathingCircleContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  breathingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A78BFA',
  },
  particle1: {
    top: -10,
    left: '50%',
    marginLeft: -4,
  },
  particle2: {
    top: 10,
    right: -10,
  },
  particle3: {
    top: 15,
    left: -10,
  },
  breathingTextContainer: {
    alignItems: 'center',
    minHeight: 80,
  },
  breathingPhaseText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  breathingEncouragement: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
    minHeight: 20,
  },
  breathingProgressContainer: {
    alignItems: 'center',
  },
  breathingProgressRing: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  breathingProgressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  breathingProgressDotCompleted: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  activityContainer: {
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 8,
  },
  timerProgress: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  timerInstruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  breathingCount: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  demoHabitXPText: {
    fontSize: 14,
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
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -width * 0.2 }, { translateY: -50 }],
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  xpText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D97706',
  },
  streakContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  streakText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  demoCompletedContainer: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  demoCompletedText: {
    fontSize: 16,
    color: '#065F46',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  goalOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  goalLabelSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F7FF',
  },
  categoryCardPrimary: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F4F6',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryCardDisabled: {
    opacity: 0.5,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  categoryNameSelected: {
    color: '#7C3AED',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryDescriptionSelected: {
    color: '#4B5563',
  },
  examplesContainer: {
    gap: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  exampleTextSelected: {
    color: '#6B7280',
  },
  primaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  secondaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionSummary: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryContainer: {
    gap: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryEmoji: {
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
  benefitsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
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
})
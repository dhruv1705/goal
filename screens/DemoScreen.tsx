import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BreathingExerciseModal } from '../components/BreathingExerciseModal'
import { StretchExerciseModal } from '../components/StretchExerciseModal'

interface DemoScreenProps {
  navigation: any
  onComplete: (totalXP?: number, completedHabits?: number) => void
}

interface GoalSpecificDemo {
  id: string
  label: string
  icon: string
  xp: number
  type: 'stretch' | 'breathing' | 'expense' | 'gratitude' | 'mindfulness'
  instruction: string
  successMessage: string
}

const goalDemoMapping: Record<string, GoalSpecificDemo> = {
  'health-transformation': {
    id: 'stretch-demo',
    label: 'Do a 2-minute stretch',
    icon: '🤸‍♂️',
    xp: 20,
    type: 'stretch',
    instruction: 'Let\'s wake up your body with some gentle stretches',
    successMessage: 'Feel your body wake up! 💪'
  },
  'mental-wellness': {
    id: 'breathing-demo',
    label: 'Take 5 deep breaths',
    icon: '🌬️',
    xp: 15,
    type: 'breathing',
    instruction: 'Follow the breathing animation for calm',
    successMessage: 'Notice the calm flowing through you 🧘‍♀️'
  },
  'financial-freedom': {
    id: 'expense-demo',
    label: 'Track a small expense',
    icon: '💰',
    xp: 10,
    type: 'expense',
    instruction: 'What did you spend on today?',
    successMessage: 'Awareness is the first step to control! 💎'
  },
  'social-growth': {
    id: 'gratitude-demo',
    label: 'Express gratitude',
    icon: '🤝',
    xp: 15,
    type: 'gratitude',
    instruction: 'Think of someone who made your day better',
    successMessage: 'Connection starts with gratitude 🌟'
  },
  'overall-balance': {
    id: 'mindfulness-demo',
    label: 'Check in with yourself',
    icon: '⚖️',
    xp: 10,
    type: 'mindfulness',
    instruction: 'How are you feeling right now?',
    successMessage: 'Self-awareness creates balance 🌸'
  }
}

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

const primaryGoalOptions = [
  { id: 'health-transformation', label: 'Transform my health and fitness', icon: '🏃‍♂️' },
  { id: 'financial-freedom', label: 'Achieve financial stability', icon: '💎' },
  { id: 'mental-wellness', label: 'Improve mental wellbeing', icon: '🧘‍♀️' },
  { id: 'social-growth', label: 'Build better relationships', icon: '🤝' },
  { id: 'overall-balance', label: 'Create overall life balance', icon: '⚖️' },
]

export const DemoScreen: React.FC<DemoScreenProps> = ({ navigation, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [primaryGoal, setPrimaryGoal] = useState<string>('')
  const [selectedExpense, setSelectedExpense] = useState<string>('')
  const [gratitudePerson, setGratitudePerson] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [demoCompleted, setDemoCompleted] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [showBreathingModal, setShowBreathingModal] = useState(false)
  const [showStretchModal, setShowStretchModal] = useState(false)
  
  const insets = useSafeAreaInsets()
  const totalSteps = 3 // Goal Selection -> Demo -> Summary

  const getCurrentDemo = (): GoalSpecificDemo | null => {
    if (!primaryGoal) return null
    return goalDemoMapping[primaryGoal] || null
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
      'What did you spend on today?',
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
      'Think of someone who made your day better - who was it?',
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
      'How are you feeling right now?',
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
    
    setTotalXP(demo.xp)
    setDemoCompleted(true)
    
    // Show success message
    setTimeout(() => {
      Alert.alert(
        'Well Done! 🎉',
        demo.successMessage,
        [{ text: 'Continue', onPress: () => setCurrentStep(2) }]
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
      console.log('Error stopping speech in demo:', error)
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
      console.log('Error stopping speech in demo:', error)
    }
  }

  const handleNext = () => {
    if (currentStep === 0 && !primaryGoal) {
      Alert.alert('Selection Required', 'Please select your primary goal to continue.')
      return
    }
    if (currentStep === 1 && !demoCompleted) {
      Alert.alert('Complete Demo', 'Please complete the demo task to continue.')
      return
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete demo and pass data to choice screen
      onComplete(totalXP, 1) // 1 habit completed
    }
  }

  const handleSkip = () => {
    Alert.alert(
      'Skip Demo',
      'You can always try the demo later. Continue to sign up?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => onComplete(0, 0) }
      ]
    )
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
      <Text style={styles.stepTitle}>What's your main goal? 🎯</Text>
      <Text style={styles.stepSubtitle}>
        Choose your primary focus area to experience a personalized demo
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

  const renderStep1 = () => {
    const demo = getCurrentDemo()
    if (!demo) return null

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Try this habit! 🎆</Text>
        <Text style={styles.stepSubtitle}>
          Experience a habit that aligns with your goal: {primaryGoalOptions.find(g => g.id === primaryGoal)?.label}
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
              <Text style={styles.demoEmoji}>{demo.icon}</Text>
            </View>
            
            <View style={styles.demoContent}>
              <Text style={[
                styles.demoLabel,
                demoCompleted && styles.demoLabelCompleted
              ]}>
                {demo.label}
              </Text>
              <Text style={styles.demoInstruction}>
                {demo.instruction}
              </Text>
            </View>
            
            <View style={styles.demoXP}>
              <Text style={styles.demoXPText}>+{demo.xp} XP</Text>
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
                🎉 Amazing! You earned {totalXP} XP. Ready to unlock your full potential?
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderStep2 = () => {
    const goalOption = primaryGoalOptions.find(g => g.id === primaryGoal)
    const demo = getCurrentDemo()
    
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>You're a natural! 🌟</Text>
        <Text style={styles.stepSubtitle}>
          You've just experienced the power of habit building. Ready for the full experience?
        </Text>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Demo Summary:</Text>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>{goalOption?.icon}</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryName}>{goalOption?.label}</Text>
                <Text style={styles.summaryDesc}>Your chosen focus area</Text>
              </View>
            </View>
            
            {demoCompleted && demo && (
              <View style={styles.demoSummaryItem}>
                <Text style={styles.demoSummaryTitle}>Habit Completed:</Text>
                <View style={styles.demoSummaryRow}>
                  <Text style={styles.demoSummaryEmoji}>{demo.icon}</Text>
                  <Text style={styles.demoSummaryText}>{demo.label}</Text>
                  <Text style={styles.demoSummaryXP}>+{totalXP} XP</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>With the full app, you get:</Text>
            <Text style={styles.benefitItem}>✨ Hundreds of personalized habits</Text>
            <Text style={styles.benefitItem}>🎯 Smart progress tracking & analytics</Text>
            <Text style={styles.benefitItem}>🔥 Streak counters and rewards</Text>
            <Text style={styles.benefitItem}>🏆 Achievements and level progression</Text>
            <Text style={styles.benefitItem}>📊 Weekly challenges and insights</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0()
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
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
          <Text style={styles.skipText}>Skip Demo</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Try Goals!</Text>
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
            currentStep === 0 ? styles.nextButtonFull : styles.nextButtonHalf
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps - 1 ? 'Continue' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
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
    fontSize: 14,
    fontWeight: '500',
  },
  skipPlaceholder: {
    width: 70,
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
    fontSize: 20,
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
  demoSummaryItem: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  demoSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  demoSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoSummaryEmoji: {
    fontSize: 20,
  },
  demoSummaryText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  demoSummaryXP: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
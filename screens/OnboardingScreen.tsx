import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'

const { width } = Dimensions.get('window')

interface OnboardingScreenProps {
  navigation: any
  onComplete: () => void
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

const primaryGoalOptions = [
  { id: 'health-transformation', label: 'Transform my health and fitness', icon: '🏃‍♂️' },
  { id: 'financial-freedom', label: 'Achieve financial stability', icon: '💎' },
  { id: 'mental-wellness', label: 'Improve mental wellbeing', icon: '🧘‍♀️' },
  { id: 'social-growth', label: 'Build better relationships', icon: '🤝' },
  { id: 'overall-balance', label: 'Create overall life balance', icon: '⚖️' },
]

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [primaryGoal, setPrimaryGoal] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [motivationContext, setMotivationContext] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { updatePreferences, completeOnboardingLocally } = usePreferences()
  const insets = useSafeAreaInsets()

  const totalSteps = 3

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

  const handleNext = () => {
    if (currentStep === 1 && !primaryGoal) {
      Alert.alert('Selection Required', 'Please select your primary goal to continue.')
      return
    }
    if (currentStep === 2 && selectedCategories.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one area to focus on.')
      return
    }
    
    if (currentStep < totalSteps) {
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
      <Text style={styles.stepTitle}>What brings you here?</Text>
      <Text style={styles.stepSubtitle}>
        Tell us your primary goal so we can personalize your experience
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
      <Text style={styles.stepTitle}>You're all set! 🎉</Text>
      <Text style={styles.stepSubtitle}>
        We'll personalize your experience based on your preferences
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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderStep1()
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
            {loading ? 'Setting up...' : currentStep === totalSteps ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
        
        {/* Debug: Add a skip button for testing */}
        {currentStep === totalSteps && (
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
                      // Mark as completed locally and then call onComplete
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
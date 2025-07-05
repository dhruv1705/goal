import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHabits } from '../contexts/HabitsContext'
import { useXP } from '../contexts/XPContext'
import { HabitTemplate, UserHabitProgress } from '../types/habits'

const { width } = Dimensions.get('window')

interface HabitCompletionScreenProps {
  navigation: any
  route: {
    params: {
      habitTemplate: HabitTemplate
      habitProgress: UserHabitProgress
    }
  }
}

export const HabitCompletionScreen: React.FC<HabitCompletionScreenProps> = ({
  navigation,
  route
}) => {
  const insets = useSafeAreaInsets()
  const { habitTemplate, habitProgress } = route.params
  const { completeHabit } = useHabits()
  const { addXP } = useXP()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [completing, setCompleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const progressAnim = useRef(new Animated.Value(0)).current
  const successAnim = useRef(new Animated.Value(0)).current
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const steps = [
    'preparation',
    'activity',
    'completion',
    'feedback'
  ]
  
  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / steps.length,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [currentStep])
  
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerRunning])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#10B981'
      case 2: return '#3B82F6'
      case 3: return '#8B5CF6'
      case 4: return '#F59E0B'
      default: return '#6B7280'
    }
  }
  
  const getLevelName = (level: number) => {
    switch (level) {
      case 1: return 'Foundation'
      case 2: return 'Building'
      case 3: return 'Power'
      case 4: return 'Mastery'
      default: return `Level ${level}`
    }
  }
  
  const handleStartTimer = () => {
    setTimerRunning(true)
    setCurrentStep(1)
  }
  
  const handleStopTimer = () => {
    setTimerRunning(false)
    setCurrentStep(2)
  }
  
  const handleComplete = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please rate how this habit felt for you.')
      return
    }
    
    try {
      setCompleting(true)
      
      // Complete the habit
      await completeHabit(
        habitTemplate.id,
        rating,
        notes.trim() || undefined,
        timeElapsed > 0 ? Math.floor(timeElapsed / 60) : undefined
      )
      
      // Show success animation
      setShowSuccess(true)
      setCurrentStep(3)
      
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.goBack()
      })
      
    } catch (error) {
      console.error('Error completing habit:', error)
      Alert.alert(
        'Error',
        'Failed to complete habit. Please try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setCompleting(false)
    }
  }
  
  const renderPreparation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🎯 Get Ready</Text>
      <Text style={styles.stepDescription}>
        Prepare for your {habitTemplate.title} session
      </Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>{habitTemplate.instructions}</Text>
      </View>
      
      {habitTemplate.tips && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips:</Text>
          <Text style={styles.tipsText}>{habitTemplate.tips}</Text>
        </View>
      )}
      
      <View style={styles.habitMetaContainer}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Duration:</Text>
          <Text style={styles.metaValue}>{habitTemplate.estimated_duration} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Reward:</Text>
          <Text style={styles.xpValue}>+{habitTemplate.xp_reward} XP</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Level:</Text>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(habitTemplate.level) }]}>
            <Text style={styles.levelText}>{getLevelName(habitTemplate.level)}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartTimer}
      >
        <Text style={styles.startButtonText}>Start Habit</Text>
      </TouchableOpacity>
    </View>
  )
  
  const renderActivity = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏃‍♂️ {habitTemplate.title}</Text>
      <Text style={styles.stepDescription}>
        You're doing great! Complete your habit at your own pace.
      </Text>
      
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
        <Text style={styles.timerLabel}>
          Estimated: {habitTemplate.estimated_duration} minutes
        </Text>
      </View>
      
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationText}>
          {timeElapsed < 60 && "Just getting started! Take your time."}
          {timeElapsed >= 60 && timeElapsed < 300 && "You're in the flow! Keep going."}
          {timeElapsed >= 300 && timeElapsed < 600 && "Great progress! You're doing amazing."}
          {timeElapsed >= 600 && "Wow! You're really committed today!"}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.completeActivityButton}
        onPress={handleStopTimer}
      >
        <Text style={styles.completeActivityButtonText}>I'm Done!</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.pauseButton}
        onPress={() => setTimerRunning(!timerRunning)}
      >
        <Text style={styles.pauseButtonText}>
          {timerRunning ? '⏸️ Pause' : '▶️ Resume'}
        </Text>
      </TouchableOpacity>
    </View>
  )
  
  const renderCompletion = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🎉 Well Done!</Text>
      <Text style={styles.stepDescription}>
        You completed {habitTemplate.title} in {formatTime(timeElapsed)}
      </Text>
      
      <View style={styles.completionStatsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
          <Text style={styles.statLabel}>Time Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValueXP}>+{habitTemplate.xp_reward}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{habitProgress.current_streak + 1}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => setCurrentStep(3)}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  )
  
  const renderFeedback = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>💭 How did it feel?</Text>
      <Text style={styles.stepDescription}>
        Your feedback helps us personalize your experience
      </Text>
      
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingTitle}>Rate this session:</Text>
        <View style={styles.ratingButtons}>
          <TouchableOpacity 
            style={[styles.ratingButton, rating === 1 && styles.ratingButtonSelected]}
            onPress={() => setRating(1)}
          >
            <Text style={[styles.ratingEmoji, rating === 1 && styles.ratingEmojiSelected]}>😫</Text>
            <Text style={[styles.ratingLabel, rating === 1 && styles.ratingLabelSelected]}>Hard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ratingButton, rating === 2 && styles.ratingButtonSelected]}
            onPress={() => setRating(2)}
          >
            <Text style={[styles.ratingEmoji, rating === 2 && styles.ratingEmojiSelected]}>😐</Text>
            <Text style={[styles.ratingLabel, rating === 2 && styles.ratingLabelSelected]}>Okay</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ratingButton, rating === 3 && styles.ratingButtonSelected]}
            onPress={() => setRating(3)}
          >
            <Text style={[styles.ratingEmoji, rating === 3 && styles.ratingEmojiSelected]}>😊</Text>
            <Text style={[styles.ratingLabel, rating === 3 && styles.ratingLabelSelected]}>Great</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.finishButton, !rating && styles.finishButtonDisabled]}
        onPress={handleComplete}
        disabled={completing || !rating}
      >
        <Text style={[styles.finishButtonText, !rating && styles.finishButtonTextDisabled]}>
          {completing ? 'Completing...' : 'Complete Habit'}
        </Text>
      </TouchableOpacity>
    </View>
  )
  
  const renderSuccess = () => (
    <Animated.View 
      style={[
        styles.successContainer,
        {
          opacity: successAnim,
          transform: [
            {
              scale: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        }
      ]}
    >
      <Text style={styles.successEmoji}>🎉</Text>
      <Text style={styles.successTitle}>Habit Complete!</Text>
      <Text style={styles.successDescription}>
        +{habitTemplate.xp_reward} XP earned
      </Text>
      <Text style={styles.successStreak}>
        🔥 {habitProgress.current_streak + 1}-day streak!
      </Text>
    </Animated.View>
  )
  
  if (showSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderSuccess()}
      </View>
    )
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{habitTemplate.title}</Text>
        
        <View style={styles.headerRight}>
          <Text style={styles.stepCounter}>{currentStep + 1}/{steps.length}</Text>
        </View>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }
          ]} 
        />
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && renderPreparation()}
        {currentStep === 1 && renderActivity()}
        {currentStep === 2 && renderCompletion()}
        {currentStep === 3 && renderFeedback()}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  stepCounter: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  habitMetaContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1F2937',
    fontFamily: 'System',
  },
  timerLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  motivationContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
  completeActivityButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeActivityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  pauseButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pauseButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  completionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
  },
  statValueXP: {
    fontSize: 24,
    fontWeight: '900',
    color: '#7C3AED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  ratingContainer: {
    marginBottom: 32,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ratingButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  ratingButtonSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F0FF',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  ratingEmojiSelected: {
    transform: [{ scale: 1.1 }],
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  ratingLabelSelected: {
    color: '#7C3AED',
  },
  finishButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  finishButtonTextDisabled: {
    color: '#9CA3AF',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 18,
    color: '#7C3AED',
    fontWeight: '700',
    marginBottom: 8,
  },
  successStreak: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
})
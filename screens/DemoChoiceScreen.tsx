import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

interface DemoChoiceScreenProps {
  navigation: any
  totalXP: number
  completedHabits: number
  onSaveProgress: () => void
  onContinueAsGuest: () => void
}

export const DemoChoiceScreen: React.FC<DemoChoiceScreenProps> = ({
  navigation,
  totalXP,
  completedHabits,
  onSaveProgress,
  onContinueAsGuest,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Amazing Progress! 🎉</Text>
      </View>

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{totalXP}</Text>
              <Text style={styles.progressLabel}>XP Earned</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>{completedHabits}</Text>
              <Text style={styles.progressLabel}>Habits Completed</Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={styles.progressNumber}>🔥</Text>
              <Text style={styles.progressLabel}>Streak Started</Text>
            </View>
          </View>
          
          <Text style={styles.progressMessage}>
            You've just experienced the power of habit building! 💪
          </Text>
        </View>
      </View>

      {/* Choice Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Ready to build your habit journey?</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to continue your habit-building experience
        </Text>

        {/* Save Progress Option */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onSaveProgress}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.primaryButtonTitle}>Save Progress & Unlock More</Text>
            <Text style={styles.primaryButtonSubtitle}>
              • Keep your {totalXP} XP and streak
            </Text>
            <Text style={styles.primaryButtonSubtitle}>
              • Access hundreds of habits
            </Text>
            <Text style={styles.primaryButtonSubtitle}>
              • Get personalized recommendations
            </Text>
            <Text style={styles.primaryButtonSubtitle}>
              • Track your progress over time
            </Text>
          </View>
        </TouchableOpacity>

        {/* Continue as Guest Option */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onContinueAsGuest}
        >
          <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
          <Text style={styles.secondaryButtonSubtext}>
            Limited features • Progress won't be saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Benefits */}
      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>
          Join thousands of users building better habits every day! 🌟
        </Text>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressMessage: {
    fontSize: 16,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    alignItems: 'center',
  },
  primaryButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  primaryButtonSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  bottomContainer: {
    padding: 20,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
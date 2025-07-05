import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

interface WelcomeScreenProps {
  navigation: any
  totalXP: number
  completedHabits: number
  onGetStarted: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  navigation,
  totalXP,
  completedHabits,
  onGetStarted,
}) => {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#7C3AED" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome, {getUserName()}! 🎉</Text>
        <Text style={styles.headerSubtitle}>Your habit journey starts now</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Demo Progress Card */}
        {totalXP > 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Demo Progress</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>{totalXP}</Text>
                <Text style={styles.progressLabel}>XP Earned</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>{completedHabits}</Text>
                <Text style={styles.progressLabel}>Habits Tried</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>🔥</Text>
                <Text style={styles.progressLabel}>Ready to Start</Text>
              </View>
            </View>
            <Text style={styles.progressMessage}>
              Great job! Your progress has been saved and your streak is ready to begin! 💪
            </Text>
          </View>
        )}

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeEmoji}>🚀</Text>
          <Text style={styles.welcomeTitle}>You're All Set!</Text>
          <Text style={styles.welcomeMessage}>
            Welcome to Goals - your personal habit-building companion! 
            You now have access to hundreds of personalized habits, 
            progress tracking, and achievement rewards.
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's waiting for you:</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Personalized Goals</Text>
              <Text style={styles.featureDesc}>Set and track goals that matter to you</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Progress Analytics</Text>
              <Text style={styles.featureDesc}>See your habits improve over time</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🏆</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Achievements & Streaks</Text>
              <Text style={styles.featureDesc}>Earn rewards and build momentum</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>💡</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Reminders</Text>
              <Text style={styles.featureDesc}>Get motivated at the right moments</Text>
            </View>
          </View>
        </View>

        {/* Motivation Section */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            "The journey of a thousand miles begins with one step. You've already taken yours!" 
          </Text>
          <Text style={styles.motivationAuthor}>- Lao Tzu</Text>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Pro Tips:</Text>
          <Text style={styles.tipItem}>• Start with 2-3 small habits</Text>
          <Text style={styles.tipItem}>• Be consistent, not perfect</Text>
          <Text style={styles.tipItem}>• Celebrate small wins</Text>
          <Text style={styles.tipItem}>• Use reminders to build routine</Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={onGetStarted}
        >
          <Text style={styles.getStartedText}>Let's Build Great Habits! 🚀</Text>
        </TouchableOpacity>
        
        <Text style={styles.bottomNote}>
          You can always adjust your goals and preferences in Settings
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
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
    fontSize: 28,
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
    lineHeight: 24,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  motivationCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  motivationText: {
    fontSize: 16,
    color: '#1F2937',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 8,
  },
  motivationAuthor: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  getStartedButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
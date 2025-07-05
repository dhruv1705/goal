import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHabits } from '../contexts/HabitsContext'
import { useXP } from '../contexts/XPContext'
import { useAuth } from '../contexts/AuthContext'
import { useGoalJourney } from '../contexts/GoalJourneyContext'
import { XPDisplay } from '../components/XPDisplay'
import { HabitCard } from '../components/HabitCard'
import { DailyHabitSummary } from '../types/habits'

interface LearnScreenProps {
  navigation: any
}

export const LearnScreen: React.FC<LearnScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { 
    dailyHabits, 
    habitTemplates,
    activeGoal: habitsActiveGoal,
    loading: habitsLoading, 
    error: habitsError,
    refreshData: refreshHabits,
    completeHabit
  } = useHabits()
  const {
    currentGoal: activeGoal,
    goalProgress,
    refreshProgress: refreshGoalProgress
  } = useGoalJourney()
  const { 
    currentLevel, 
    totalXP, 
    dailyXPGoal, 
    currentStreak,
    loading: xpLoading,
    refreshXPData
  } = useXP()
  
  const [refreshing, setRefreshing] = useState(false)
  
  // Calculate today's XP progress
  const todayEarnedXP = dailyHabits
    .filter(h => h.today_completed)
    .reduce((sum, h) => sum + h.habit_template.xp_reward, 0)
  const dailyProgress = Math.round((todayEarnedXP / dailyXPGoal) * 100)
  
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refreshHabits(), refreshXPData(), refreshGoalProgress()])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
    setRefreshing(false)
  }
  
  const handleHabitPress = (habitSummary: DailyHabitSummary) => {
    if (!habitSummary.habit_template) {
      Alert.alert('Error', 'Habit data is not available')
      return
    }
    
    if (habitSummary.today_completed) {
      Alert.alert(
        'Habit Complete! 🎉',
        `You've already completed "${habitSummary.habit_template.title}" today. Great job maintaining your streak!`,
        [{ text: 'OK' }]
      )
      return
    }
    
    if (!habitSummary.can_complete_today) {
      Alert.alert(
        'Habit Not Available',
        `"${habitSummary.habit_template.title}" is not available for completion right now.`,
        [{ text: 'OK' }]
      )
      return
    }
    
    // Navigate to habit completion screen
    navigation.navigate('HabitCompletion', {
      habitTemplate: habitSummary.habit_template,
      habitProgress: habitSummary.progress
    })
  }
  
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }
  
  const renderNoActiveGoal = () => (
    <View style={styles.noGoalContainer}>
      <Text style={styles.noGoalTitle}>Ready to Start Your Journey? 🚀</Text>
      <Text style={styles.noGoalDescription}>
        Choose a goal to begin building healthy habits and earning XP!
      </Text>
      <TouchableOpacity 
        style={styles.selectGoalButton}
        onPress={() => navigation.navigate('Journey')}
      >
        <Text style={styles.selectGoalButtonText}>Select Your Goal</Text>
      </TouchableOpacity>
    </View>
  )
  
  const renderActiveGoal = () => (
    <View style={styles.goalContainer}>
      <View style={styles.goalHeader}>
        <TouchableOpacity 
          style={styles.goalTitleContainer}
          onPress={() => {
            // Show debug info about available habits
            console.log('Active goal (Journey):', activeGoal)
            console.log('Active goal (Habits):', habitsActiveGoal)
            console.log('Goal ID mismatch:', activeGoal?.id !== habitsActiveGoal?.id)
            console.log('Daily habits:', dailyHabits)
            console.log('Habit templates:', habitTemplates)
            
            if (dailyHabits && dailyHabits.length > 0) {
              Alert.alert(
                `${habitsActiveGoal?.goal_template?.title} Habits`,
                `Found ${dailyHabits.length} available habits for today!`,
                [
                  { text: 'View Progress', onPress: () => navigation.navigate('Journey') },
                  { text: 'OK', style: 'cancel' }
                ]
              )
            } else {
              Alert.alert(
                `${habitsActiveGoal?.goal_template?.title} Habits`,
                'No habits available today. This might be a data loading issue.',
                [
                  { text: 'View Progress', onPress: () => navigation.navigate('Journey') },
                  { text: 'Refresh', onPress: () => handleRefresh() },
                  { text: 'OK', style: 'cancel' }
                ]
              )
            }
          }}
        >
          <Text style={styles.goalTitle}>🎯 {habitsActiveGoal?.goal_template?.title}</Text>
          <Text style={styles.goalSubtitle}>Tap to view habits</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Journey')}>
          <Text style={styles.viewProgressLink}>View Progress →</Text>
        </TouchableOpacity>
      </View>
      
      {goalProgress && (
        <View style={styles.goalProgressContainer}>
          <Text style={styles.goalProgressText}>
            Day {goalProgress.days_active} • {goalProgress.overall_completion_percentage}% Complete
          </Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${goalProgress.overall_completion_percentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.goalStatsText}>
            Level {goalProgress.current_level} of {goalProgress.total_levels} • 
            {goalProgress.total_xp_earned} XP earned
          </Text>
        </View>
      )}
    </View>
  )
  
  const renderDailyGoal = () => (
    <View style={styles.dailyGoalContainer}>
      <Text style={styles.dailyGoalTitle}>🎯 Today's Goal: Earn {dailyXPGoal} XP</Text>
      <View style={styles.dailyProgressContainer}>
        <View style={styles.dailyProgressBar}>
          <View 
            style={[
              styles.dailyProgressFill, 
              { width: `${Math.min(dailyProgress, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.dailyProgressText}>
          {todayEarnedXP}/{dailyXPGoal} XP ({dailyProgress}%)
        </Text>
      </View>
      {dailyProgress >= 100 && (
        <Text style={styles.goalCompleteText}>🎉 Daily goal complete! Amazing work!</Text>
      )}
    </View>
  )
  
  const renderTodaysHabits = () => {
    console.log('LearnScreen: renderTodaysHabits called with:', {
      dailyHabitsLength: dailyHabits.length,
      dailyHabits: dailyHabits.map(h => ({
        title: h.habit_template?.title,
        status: h.progress?.status
      }))
    })
    
    if (dailyHabits.length === 0) {
      return (
        <View style={styles.noHabitsContainer}>
          <Text style={styles.noHabitsTitle}>No habits available today</Text>
          <Text style={styles.noHabitsDescription}>
            Select a goal to get started with your daily habits!
          </Text>
        </View>
      )
    }
    
    return (
      <View style={styles.habitsContainer}>
        <Text style={styles.habitsTitle}>📚 Today's Habits</Text>
        <Text style={styles.habitsSubtitle}>
          Complete your daily habits to earn XP and maintain your streak!
        </Text>
        
        {dailyHabits
          .filter(habitSummary => habitSummary.habit_template && habitSummary.habit_template.title)
          .map((habitSummary, index) => (
            <HabitCard
              key={`${habitSummary.habit_template.id || `habit-${index}`}-${index}`}
              habitSummary={habitSummary}
              onPress={() => handleHabitPress(habitSummary)}
              variant="daily"
            />
          ))}
      </View>
    )
  }
  
  
  if (habitsLoading || xpLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      </View>
    )
  }
  
  if (habitsError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading habits: {habitsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with XP Display */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.email?.split('@')[0] || 'User'}! ☀️
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <XPDisplay 
          variant="header" 
          showLevel={true} 
          showProgress={true} 
          showStreak={currentStreak > 0} 
        />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Active Goal Section - Use habits context for consistency */}
        {habitsActiveGoal ? renderActiveGoal() : renderNoActiveGoal()}
        
        {/* Daily Goal Progress */}
        {habitsActiveGoal && renderDailyGoal()}
        
        {/* Today's Habits */}
        {habitsActiveGoal && renderTodaysHabits()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greetingContainer: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  noGoalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noGoalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  noGoalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  selectGoalButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectGoalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  goalContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewProgressLink: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
  },
  goalProgressContainer: {
    marginTop: 8,
  },
  goalProgressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  goalStatsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dailyGoalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dailyGoalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  dailyProgressContainer: {
    marginBottom: 8,
  },
  dailyProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
  },
  dailyProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  dailyProgressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  goalCompleteText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
  },
  habitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  habitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  habitsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  noHabitsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  noHabitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noHabitsDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
})
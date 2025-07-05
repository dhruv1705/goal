import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useXP } from '../contexts/XPContext'
import { useGoalJourney } from '../contexts/GoalJourneyContext'
import { XPDisplay } from '../components/XPDisplay'

interface ProgressScreenProps {
  navigation: any
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { 
    currentLevel, 
    totalXP, 
    currentStreak, 
    bestStreak,
    achievements,
    getAvailableAchievements,
    getUnlockedAchievements
  } = useXP()
  const { goalProgress } = useGoalJourney()
  
  const allAchievements = getAvailableAchievements()
  const unlockedAchievements = getUnlockedAchievements()
  
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
        <Text style={styles.headerTitle}>Your Progress</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* XP Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Level Progress</Text>
          <XPDisplay 
            variant="detailed" 
            showLevel={true} 
            showProgress={true} 
            showStreak={true} 
          />
        </View>
        
        {/* Streak Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Streak Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
          </View>
        </View>
        
        {/* Goal Progress */}
        {goalProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Goal Progress</Text>
            <View style={styles.goalProgressCard}>
              <Text style={styles.goalProgressTitle}>
                {goalProgress.goal_template?.title || 'Your Goal'}
              </Text>
              <Text style={styles.goalProgressStats}>
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
              <Text style={styles.goalProgressDetails}>
                Level {goalProgress.current_level} of {goalProgress.total_levels} • 
                {goalProgress.total_xp_earned} XP earned
              </Text>
            </View>
          </View>
        )}
        
        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <Text style={styles.achievementsSummary}>
            {unlockedAchievements.length} of {allAchievements.length} unlocked
          </Text>
          
          <View style={styles.achievementsGrid}>
            {allAchievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.some(ua => ua.achievement_id === achievement.id)
              return (
                <View 
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !isUnlocked && styles.achievementCardLocked
                  ]}
                >
                  <Text style={[
                    styles.achievementIcon,
                    !isUnlocked && styles.achievementIconLocked
                  ]}>
                    {achievement.icon}
                  </Text>
                  <Text style={[
                    styles.achievementName,
                    !isUnlocked && styles.achievementNameLocked
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !isUnlocked && styles.achievementDescriptionLocked
                  ]}>
                    {achievement.description}
                  </Text>
                  {isUnlocked && (
                    <Text style={styles.achievementXP}>+{achievement.xp_reward} XP</Text>
                  )}
                </View>
              )
            })}
          </View>
        </View>
        
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
  },
  headerRight: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  goalProgressCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalProgressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  goalProgressStats: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
  goalProgressDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  achievementsSummary: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
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
  achievementCardLocked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescriptionLocked: {
    color: '#9CA3AF',
  },
  achievementXP: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
})
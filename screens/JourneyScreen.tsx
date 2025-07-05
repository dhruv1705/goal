import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGoalJourney } from '../contexts/GoalJourneyContext'

interface JourneyScreenProps {
  navigation: any
}

export const JourneyScreen: React.FC<JourneyScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { 
    categories,
    availableGoals: goalTemplates,
    currentGoal: activeGoal,
    goalProgress,
    selectGoal,
    loading,
    error
  } = useGoalJourney()
  
  const handleGoalSelect = async (goalTemplateId: string) => {
    try {
      // For now, default to moderate time commitment
      // In a full implementation, you'd show a selection modal
      await selectGoal(goalTemplateId, 'moderate')
      Alert.alert(
        'Goal Selected! 🎯',
        'Your new goal has been activated. Start building habits on the Learn screen!',
        [
          {
            text: 'Start Learning',
            onPress: () => navigation.navigate('Learn')
          }
        ]
      )
    } catch (error) {
      console.error('Error selecting goal:', error)
      Alert.alert('Error', 'Failed to select goal. Please try again.')
    }
  }
  
  const renderGoalsByCategory = (categoryName: string) => {
    // For now, we'll need to filter by category through the category relationship
    // In a full implementation, you'd join the category data or filter differently
    const categoryGoals = goalTemplates.filter(goal => 
      goal.category?.name === categoryName || 
      // Fallback if category isn't joined
      (categoryName === 'Physical Health' && goal.name.toLowerCase().includes('health')) ||
      (categoryName === 'Mental Health' && goal.name.toLowerCase().includes('mental')) ||
      (categoryName === 'Finance' && goal.name.toLowerCase().includes('finance')) ||
      (categoryName === 'Social' && goal.name.toLowerCase().includes('social'))
    )
    
    if (categoryGoals.length === 0) return null
    
    return (
      <View key={categoryName} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>
          {categoryName === 'Physical Health' && '💪 '}
          {categoryName === 'Mental Health' && '🧠 '}
          {categoryName === 'Finance' && '💰 '}
          {categoryName === 'Social' && '👥 '}
          {categoryName}
        </Text>
        
        {categoryGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalCard,
              activeGoal?.goal_template_id === goal.id && styles.activeGoalCard
            ]}
            onPress={() => handleGoalSelect(goal.id)}
            disabled={activeGoal?.goal_template_id === goal.id}
          >
            <View style={styles.goalHeader}>
              <Text style={[
                styles.goalTitle,
                activeGoal?.goal_template_id === goal.id && styles.activeGoalTitle
              ]}>
                {goal.title}
              </Text>
              {activeGoal?.goal_template_id === goal.id && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.goalDescription}>{goal.description}</Text>
            
            <View style={styles.goalMeta}>
              <Text style={styles.goalMetaText}>
                Duration: {goal.estimated_duration}
              </Text>
              <Text style={styles.goalMetaText}>
                Difficulty: {goal.difficulty}
              </Text>
            </View>
            
            {activeGoal?.goal_template_id === goal.id && goalProgress && (
              <View style={styles.progressSection}>
                <Text style={styles.progressText}>
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
              </View>
            )}
            
            {activeGoal?.goal_template_id !== goal.id && (
              <Text style={styles.selectText}>Tap to select this goal</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    )
  }
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      </View>
    )
  }
  
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading goals: {error}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Your Journey</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>🚀 Choose Your Path</Text>
          <Text style={styles.introDescription}>
            Select a goal to start building healthy habits. Each goal contains carefully crafted 
            habits that will help you achieve your objectives through progressive levels.
          </Text>
        </View>
        
        {activeGoal && (
          <View style={styles.currentGoalSection}>
            <Text style={styles.currentGoalTitle}>🎯 Current Goal</Text>
            <Text style={styles.currentGoalSubtitle}>
              You're currently working on this goal. Complete it to unlock new goals!
            </Text>
          </View>
        )}
        
        {categories.map(category => renderGoalsByCategory(category.name))}
        
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
  intro: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
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
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  currentGoalSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  currentGoalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  currentGoalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  activeGoalCard: {
    borderLeftColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  activeGoalTitle: {
    color: '#059669',
  },
  activeBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  selectText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
})
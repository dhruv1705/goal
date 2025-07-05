import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { DailyHabitSummary, HabitTemplate, UserHabitProgress } from '../types/habits'

interface HabitCardProps {
  habitSummary?: DailyHabitSummary
  habitTemplate?: HabitTemplate
  habitProgress?: UserHabitProgress
  onPress?: () => void
  variant?: 'daily' | 'template' | 'progress'
  disabled?: boolean
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habitSummary,
  habitTemplate,
  habitProgress,
  onPress,
  variant = 'daily',
  disabled = false
}) => {
  // Determine which data to use based on variant
  const habit = habitSummary?.habit_template || habitTemplate
  const progress = habitSummary?.progress || habitProgress
  const isCompleted = variant === 'daily' ? habitSummary?.today_completed : progress?.status === 'completed'
  const canComplete = variant === 'daily' ? habitSummary?.can_complete_today : true
  const streak = habitSummary?.streak_count || progress?.current_streak || 0
  
  // More thorough validation
  if (!habit) {
    console.warn('HabitCard: No habit data provided', { habit, habitSummary, habitTemplate })
    return null
  }
  
  // Log habit data for debugging
  console.log('HabitCard: Rendering habit:', {
    title: habit.title,
    description: habit.description,
    hasTitle: !!habit.title,
    hasDescription: !!habit.description
  })
  
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#10B981' // Foundation - Green
      case 2: return '#3B82F6' // Building - Blue
      case 3: return '#8B5CF6' // Power - Purple
      case 4: return '#F59E0B' // Mastery - Orange
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
  
  const getStatusIcon = () => {
    if (isCompleted) return '✅'
    if (!canComplete && variant === 'daily') return '⏰'
    if (progress?.status === 'locked') return '🔒'
    if (progress?.status === 'available') return '▶️'
    if (progress?.status === 'in_progress') return '🔄'
    return '▶️'
  }
  
  const getStatusText = () => {
    if (isCompleted) return 'COMPLETE'
    if (!canComplete && variant === 'daily') return 'SCHEDULED'
    if (progress?.status === 'locked') return 'LOCKED'
    if (progress?.status === 'available') return 'Ready to start'
    if (progress?.status === 'in_progress') return 'In progress'
    return 'Ready to start'
  }
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
        disabled && styles.disabledContainer
      ]}
      onPress={onPress}
      disabled={disabled || (progress?.status === 'locked')}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isCompleted && styles.completedTitle]}>
              {String(habit.title || 'Habit Title')}
            </Text>
            <Text style={styles.description}>{String(habit.description || 'Habit Description')}</Text>
          </View>
        </View>
        
        <View style={styles.metaContainer}>
          <View style={[styles.levelBadge, { backgroundColor: getLevelColor(habit.level || 1) }]}>
            <Text style={styles.levelText}>{getLevelName(habit.level || 1)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{String(habit.estimated_duration || 0)} min</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reward:</Text>
          <Text style={styles.xpValue}>+{String(habit.xp_reward || 0)} XP</Text>
        </View>
        
        {streak > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Streak:</Text>
            <Text style={styles.streakValue}>🔥 {String(streak)} days</Text>
          </View>
        )}
        
        {progress?.completed_count && progress.completed_count > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed:</Text>
            <Text style={styles.detailValue}>{String(progress.completed_count)} times</Text>
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={[
          styles.statusText,
          isCompleted && styles.completedStatusText,
          progress?.status === 'locked' && styles.lockedStatusText
        ]}>
          {getStatusText()}
        </Text>
        
        {habit.tips && !isCompleted && (
          <Text style={styles.tip}>💡 {String(habit.tips)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
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
  completedContainer: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: '#10B981',
  },
  disabledContainer: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#059669',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  metaContainer: {
    alignItems: 'flex-end',
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
  details: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  xpValue: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '700',
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  completedStatusText: {
    color: '#059669',
  },
  lockedStatusText: {
    color: '#6B7280',
  },
  tip: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 16,
  },
})
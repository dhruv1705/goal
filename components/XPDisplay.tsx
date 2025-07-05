import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useXP } from '../contexts/XPContext'

interface XPDisplayProps {
  variant?: 'header' | 'compact' | 'detailed'
  showLevel?: boolean
  showProgress?: boolean
  showStreak?: boolean
}

export const XPDisplay: React.FC<XPDisplayProps> = ({
  variant = 'header',
  showLevel = true,
  showProgress = false,
  showStreak = false
}) => {
  const { currentLevel, totalXP, xpToNextLevel, levelProgress, currentStreak } = useXP()
  
  if (variant === 'header') {
    return (
      <View style={styles.headerContainer}>
        {showLevel && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {currentLevel}</Text>
          </View>
        )}
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{totalXP.toLocaleString()} XP</Text>
          {showProgress && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${levelProgress}%` }]} />
              <Text style={styles.progressText}>{xpToNextLevel} to next level</Text>
            </View>
          )}
        </View>
        {showStreak && currentStreak > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakText}>🔥 {currentStreak}</Text>
          </View>
        )}
      </View>
    )
  }
  
  if (variant === 'compact') {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactText}>
          Level {currentLevel} • {totalXP.toLocaleString()} XP
          {currentStreak > 0 && ` • 🔥 ${currentStreak}`}
        </Text>
      </View>
    )
  }
  
  if (variant === 'detailed') {
    return (
      <View style={styles.detailedContainer}>
        <View style={styles.detailedHeader}>
          <View style={styles.levelBadgeDetailed}>
            <Text style={styles.levelTextDetailed}>Level {currentLevel}</Text>
          </View>
          <Text style={styles.xpTextDetailed}>{totalXP.toLocaleString()} XP</Text>
        </View>
        
        {showProgress && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainerDetailed}>
              <View style={[styles.progressBarDetailed, { width: `${levelProgress}%` }]} />
            </View>
            <Text style={styles.progressTextDetailed}>
              {xpToNextLevel} XP to Level {currentLevel + 1}
            </Text>
          </View>
        )}
        
        {showStreak && (
          <View style={styles.streakSection}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakValue}>🔥 {currentStreak} days</Text>
          </View>
        )}
      </View>
    )
  }
  
  return null
}

const styles = StyleSheet.create({
  // Header variant
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  levelBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  xpContainer: {
    flex: 1,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  streakContainer: {
    marginLeft: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Compact variant
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Detailed variant
  detailedContainer: {
    padding: 20,
    backgroundColor: 'white',
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
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelBadgeDetailed: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  levelTextDetailed: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  xpTextDetailed: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainerDetailed: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarDetailed: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressTextDetailed: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  streakSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '700',
  },
})
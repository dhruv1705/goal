import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGoalJourney } from '../contexts/GoalJourneyContext'
import { GoalTemplate, TimeCommitment } from '../types/habits'

interface EnhancedJourneyScreenProps {
  navigation: any
}

type ViewMode = 'discover' | 'categories' | 'recommendations' | 'search'
type FilterType = 'all' | 'beginner' | 'intermediate' | 'advanced'

export const EnhancedJourneyScreen: React.FC<EnhancedJourneyScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { 
    categories,
    availableGoals,
    currentGoal,
    completedGoals,
    goalProgress,
    recommendedGoals,
    journeyStats,
    selectGoal,
    getRecommendedGoals,
    getGoalsByCategory,
    searchGoals,
    getCompletionPrediction,
    loading,
    error
  } = useGoalJourney()
  
  const [viewMode, setViewMode] = useState<ViewMode>('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [difficultyFilter, setDifficultyFilter] = useState<FilterType>('all')
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<GoalTemplate | null>(null)
  const [selectedCommitment, setSelectedCommitment] = useState<TimeCommitment>(TimeCommitment.Moderate)
  
  useEffect(() => {
    getRecommendedGoals()
  }, [])
  
  const handleGoalSelect = async () => {
    if (!selectedGoal) return
    
    try {
      await selectGoal(selectedGoal.id, selectedCommitment)
      setShowGoalModal(false)
      Alert.alert(
        'Goal Selected! 🎯',
        `You've started working on "${selectedGoal.title}". Check out your daily habits on the Learn screen!`,
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
  
  const openGoalModal = (goal: GoalTemplate) => {
    setSelectedGoal(goal)
    setShowGoalModal(true)
  }
  
  const getFilteredGoals = () => {
    let goals = availableGoals
    
    // Filter by category if selected
    if (selectedCategory) {
      goals = getGoalsByCategory(selectedCategory)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      goals = searchGoals(searchQuery.trim())
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      goals = goals.filter(goal => goal.difficulty === difficultyFilter)
    }
    
    // Remove already completed goals
    const completedGoalIds = completedGoals.map(g => g.goal_template_id)
    goals = goals.filter(goal => !completedGoalIds.includes(goal.id))
    
    // Remove currently active goal
    if (currentGoal) {
      goals = goals.filter(goal => goal.id !== currentGoal.goal_template_id)
    }
    
    return goals
  }
  
  const renderGoalCard = ({ item: goal }: { item: GoalTemplate }) => {
    const isCompleted = completedGoals.some(cg => cg.goal_template_id === goal.id)
    const isActive = currentGoal?.goal_template_id === goal.id
    
    return (
      <TouchableOpacity
        style={[
          styles.goalCard,
          isActive && styles.activeGoalCard,
          isCompleted && styles.completedGoalCard
        ]}
        onPress={() => openGoalModal(goal)}
        disabled={isActive || isCompleted}
      >
        <View style={styles.goalHeader}>
          <Text style={[
            styles.goalTitle,
            isActive && styles.activeGoalTitle,
            isCompleted && styles.completedGoalTitle
          ]}>
            {goal.title}
          </Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ COMPLETED</Text>
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
          <Text style={styles.goalMetaText}>
            Category: {goal.category?.name}
          </Text>
        </View>
        
        {!isActive && !isCompleted && (
          <Text style={styles.selectText}>Tap to start this goal</Text>
        )}
      </TouchableOpacity>
    )
  }
  
  const renderRecommendationCard = ({ item }: { item: typeof recommendedGoals[0] }) => (
    <TouchableOpacity
      style={[styles.goalCard, styles.recommendedCard]}
      onPress={() => openGoalModal(item.goal)}
    >
      <View style={styles.recommendationHeader}>
        <Text style={styles.goalTitle}>{item.goal.title}</Text>
        <View style={[styles.difficultyBadge, styles[`${item.difficulty}Badge`]]}>
          <Text style={styles.difficultyBadgeText}>
            {item.difficulty === 'perfect_match' && '🎯 Perfect Match'}
            {item.difficulty === 'slight_challenge' && '⚡ Good Challenge'}
            {item.difficulty === 'big_challenge' && '🚀 Big Challenge'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.goalDescription}>{item.goal.description}</Text>
      <Text style={styles.recommendationReason}>💡 {item.reason}</Text>
      
      <View style={styles.goalMeta}>
        <Text style={styles.goalMetaText}>
          Est. {item.estimatedTimeToComplete} weeks
        </Text>
        <Text style={styles.goalMetaText}>
          Score: {item.score}/100
        </Text>
      </View>
    </TouchableOpacity>
  )
  
  const renderDiscoverView = () => (
    <View style={styles.discoverContainer}>
      {/* Current Goal Status */}
      {currentGoal && goalProgress && (
        <View style={styles.currentGoalSection}>
          <Text style={styles.sectionTitle}>🎯 Your Current Journey</Text>
          <View style={styles.currentGoalCard}>
            <Text style={styles.currentGoalTitle}>{currentGoal.goal_template?.title}</Text>
            <Text style={styles.currentGoalProgress}>
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
            
            {(() => {
              const prediction = getCompletionPrediction()
              return prediction ? (
                <Text style={styles.predictionText}>
                  🔮 Estimated completion: {prediction.estimatedCompletionDate.toLocaleDateString()} 
                  ({prediction.confidence}% confidence)
                </Text>
              ) : null
            })()}
            
            <TouchableOpacity 
              style={styles.viewProgressButton}
              onPress={() => navigation.navigate('Progress')}
            >
              <Text style={styles.viewProgressButtonText}>View Detailed Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Journey Stats */}
      {journeyStats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 Your Journey Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journeyStats.totalGoalsCompleted}</Text>
              <Text style={styles.statLabel}>Goals Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journeyStats.totalDaysActive}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journeyStats.categoriesExplored.length}</Text>
              <Text style={styles.statLabel}>Areas Explored</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Recommendations */}
      {recommendedGoals.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>✨ Recommended for You</Text>
          <FlatList
            data={recommendedGoals.slice(0, 3)}
            renderItem={renderRecommendationCard}
            keyExtractor={(item) => item.goal.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      
      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>🚀 Explore Goals</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setViewMode('categories')}
          >
            <Text style={styles.quickActionIcon}>📂</Text>
            <Text style={styles.quickActionText}>Browse Categories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setViewMode('recommendations')}
          >
            <Text style={styles.quickActionIcon}>⭐</Text>
            <Text style={styles.quickActionText}>All Recommendations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setViewMode('search')}
          >
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={styles.quickActionText}>Search Goals</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
  
  const renderGoalModal = () => (
    <Modal
      visible={showGoalModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowGoalModal(false)}
          >
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Start New Goal</Text>
          <View style={styles.modalHeaderRight} />
        </View>
        
        {selectedGoal && (
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalGoalTitle}>{selectedGoal.title}</Text>
            <Text style={styles.modalGoalDescription}>{selectedGoal.description}</Text>
            
            <View style={styles.modalGoalDetails}>
              <Text style={styles.modalDetailLabel}>Category:</Text>
              <Text style={styles.modalDetailValue}>{selectedGoal.category?.name}</Text>
            </View>
            
            <View style={styles.modalGoalDetails}>
              <Text style={styles.modalDetailLabel}>Difficulty:</Text>
              <Text style={styles.modalDetailValue}>{selectedGoal.difficulty}</Text>
            </View>
            
            <View style={styles.modalGoalDetails}>
              <Text style={styles.modalDetailLabel}>Duration:</Text>
              <Text style={styles.modalDetailValue}>{selectedGoal.estimated_duration}</Text>
            </View>
            
            <Text style={styles.commitmentTitle}>Time Commitment</Text>
            <Text style={styles.commitmentSubtitle}>
              How much time can you dedicate to this goal daily?
            </Text>
            
            <View style={styles.commitmentOptions}>
              {(['light', 'moderate', 'intensive'] as TimeCommitment[]).map((commitment) => (
                <TouchableOpacity
                  key={commitment}
                  style={[
                    styles.commitmentOption,
                    selectedCommitment === commitment && styles.commitmentOptionSelected
                  ]}
                  onPress={() => setSelectedCommitment(commitment)}
                >
                  <Text style={[
                    styles.commitmentOptionText,
                    selectedCommitment === commitment && styles.commitmentOptionTextSelected
                  ]}>
                    {commitment === 'light' && '🌱 Light (5-15 min/day)'}
                    {commitment === 'moderate' && '⚡ Moderate (15-30 min/day)'}
                    {commitment === 'intensive' && '🔥 Intensive (30+ min/day)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.startGoalButton}
              onPress={handleGoalSelect}
            >
              <Text style={styles.startGoalButtonText}>Start This Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  )
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
      </View>
    )
  }
  
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading journey: {error}</Text>
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
      
      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'discover' && styles.activeTab]}
          onPress={() => setViewMode('discover')}
        >
          <Text style={[styles.tabText, viewMode === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'categories' && styles.activeTab]}
          onPress={() => setViewMode('categories')}
        >
          <Text style={[styles.tabText, viewMode === 'categories' && styles.activeTabText]}>
            Categories
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'search' && styles.activeTab]}
          onPress={() => setViewMode('search')}
        >
          <Text style={[styles.tabText, viewMode === 'search' && styles.activeTabText]}>
            Search
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'discover' && renderDiscoverView()}
        
        {viewMode === 'categories' && (
          <View style={styles.categoriesContainer}>
            {/* Category Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilter}
            >
              <TouchableOpacity
                style={[styles.categoryButton, !selectedCategory && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryButtonText, !selectedCategory && styles.categoryButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton, 
                    selectedCategory === category.name && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category.name && styles.categoryButtonTextActive
                  ]}>
                    {category.icon} {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Difficulty Filter */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.difficultyFilter}
            >
              {(['all', 'beginner', 'intermediate', 'advanced'] as FilterType[]).map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.difficultyButton,
                    difficultyFilter === difficulty && styles.difficultyButtonActive
                  ]}
                  onPress={() => setDifficultyFilter(difficulty)}
                >
                  <Text style={[
                    styles.difficultyButtonText,
                    difficultyFilter === difficulty && styles.difficultyButtonTextActive
                  ]}>
                    {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <FlatList
              data={getFilteredGoals()}
              renderItem={renderGoalCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              numColumns={1}
            />
          </View>
        )}
        
        {viewMode === 'search' && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search goals by name, description, or category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            
            <FlatList
              data={getFilteredGoals()}
              renderItem={renderGoalCard}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
        
        {viewMode === 'recommendations' && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>⭐ Personalized Recommendations</Text>
            <Text style={styles.sectionSubtitle}>
              Based on your level, interests, and progress
            </Text>
            
            <FlatList
              data={recommendedGoals}
              renderItem={renderRecommendationCard}
              keyExtractor={(item) => item.goal.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderGoalModal()}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  discoverContainer: {
    padding: 20,
  },
  currentGoalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  currentGoalCard: {
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
  currentGoalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  currentGoalProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  predictionText: {
    fontSize: 12,
    color: '#7C3AED',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  viewProgressButton: {
    backgroundColor: '#F3F0FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewProgressButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 24,
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
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  categoriesContainer: {
    padding: 20,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  difficultyFilter: {
    marginBottom: 20,
  },
  difficultyButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  difficultyButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationsContainer: {
    padding: 20,
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
  recommendedCard: {
    borderLeftColor: '#7C3AED',
  },
  activeGoalCard: {
    borderLeftColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  completedGoalCard: {
    borderLeftColor: '#6B7280',
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationHeader: {
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
  completedGoalTitle: {
    color: '#6B7280',
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
  completedBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  perfect_matchBadge: {
    backgroundColor: '#10B981',
  },
  slight_challengeBadge: {
    backgroundColor: '#F59E0B',
  },
  big_challengeBadge: {
    backgroundColor: '#EF4444',
  },
  difficultyBadgeText: {
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
  recommendationReason: {
    fontSize: 14,
    color: '#7C3AED',
    fontStyle: 'italic',
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
  selectText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalHeaderRight: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalGoalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalGoalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalGoalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  commitmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  commitmentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  commitmentOptions: {
    marginBottom: 32,
  },
  commitmentOption: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  commitmentOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3F0FF',
  },
  commitmentOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  commitmentOptionTextSelected: {
    color: '#7C3AED',
  },
  startGoalButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startGoalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
})
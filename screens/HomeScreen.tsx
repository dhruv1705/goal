import React, { useState, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
  SafeAreaView,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'
import IMAGES from '../assets'


type Goal = Tables<'goals'>
type Schedule = Tables<'schedules'>

interface HomeScreenProps {
  navigation: any
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const { categoryPriorities, getOrderedCategories, primaryCategory } = usePreferences()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [todayTasks, setTodayTasks] = useState<Schedule[]>([])
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [goalProgress, setGoalProgress] = useState<{[key: string]: number}>({})
  const [goalCategoryCache, setGoalCategoryCache] = useState<{[key: string]: string}>({})
  const [stats, setStats] = useState({
    completedToday: 0,
    totalToday: 0,
    activeGoalsCount: 0,
    weeklyCompletion: 85,
    currentStreak: 5
  })

  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      fetchDashboardData()
    }, [])
  )

  const fetchDashboardData = async () => {
    try {
      // Fetch data in parallel to reduce loading time
      const [tasksResult, goalsResult] = await Promise.all([
        fetchTodayTasks(),
        fetchActiveGoals()
      ])
      
      // Calculate stats after we have the data
      await calculateStats()
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user?.id)
        .eq('schedule_date', today)
        .order('schedule_time', { ascending: true })
        .limit(5)

      if (error) throw error

      // Fetch goal categories separately for tasks that have goal_id (with caching)
      const tasksWithCategories = await Promise.all(
        (data || []).map(async (task) => {
          if (task.goal_id) {
            // Check cache first
            if (goalCategoryCache[task.goal_id]) {
              return { ...task, goalCategory: goalCategoryCache[task.goal_id] }
            }
            
            const { data: goalData } = await supabase
              .from('goals')
              .select('category')
              .eq('id', task.goal_id)
              .single()
            
            // Cache the result
            if (goalData?.category) {
              setGoalCategoryCache(prev => ({
                ...prev,
                [task.goal_id!]: goalData.category
              }))
            }
            
            return { ...task, goalCategory: goalData?.category }
          }
          return { ...task, goalCategory: null }
        })
      )

      setTodayTasks(tasksWithCategories)
    } catch (error) {
      console.error('Failed to fetch today tasks:', error)
      setTodayTasks([])
    }
  }

  const fetchActiveGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setActiveGoals(data || [])

      // Calculate progress for each goal
      if (data) {
        const progressMap: {[key: string]: number} = {}
        for (const goal of data) {
          const progress = await calculateGoalProgress(goal.id)
          progressMap[goal.id] = progress
        }
        setGoalProgress(progressMap)
      }
    } catch (error) {
      console.error('Failed to fetch active goals:', error)
      setActiveGoals([])
    }
  }

  const calculateStats = async () => {
    try {
      // Today's tasks stats
      const { data: todayData, error: todayError } = await supabase
        .from('schedules')
        .select('completed')
        .eq('user_id', user?.id)
        .eq('schedule_date', today)

      if (todayError) throw todayError

      const completedToday = todayData?.filter(task => task.completed).length || 0
      const totalToday = todayData?.length || 0

      // Active goals count
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'active')

      if (goalsError) throw goalsError

      // Calculate weekly completion percentage
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of this week
      const weekStartStr = weekStart.toISOString().split('T')[0]
      
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('schedules')
        .select('completed')
        .eq('user_id', user?.id)
        .gte('schedule_date', weekStartStr)
        .lte('schedule_date', today)

      const weeklyCompleted = weeklyData?.filter(task => task.completed).length || 0
      const weeklyTotal = weeklyData?.length || 0
      const weeklyCompletion = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0

      // Calculate current streak (consecutive days with at least one completed task)
      let currentStreak = 0
      const checkDate = new Date()
      
      for (let i = 0; i < 30; i++) { // Check last 30 days
        const dateStr = checkDate.toISOString().split('T')[0]
        const { data: dayData } = await supabase
          .from('schedules')
          .select('completed')
          .eq('user_id', user?.id)
          .eq('schedule_date', dateStr)

        const dayCompleted = dayData?.some(task => task.completed) || false
        
        if (dayCompleted) {
          currentStreak++
        } else if (i > 0) { // Don't break on today if no tasks
          break
        }
        
        checkDate.setDate(checkDate.getDate() - 1)
      }

      setStats({
        completedToday,
        totalToday,
        activeGoalsCount: goalsData?.length || 0,
        weeklyCompletion,
        currentStreak
      })
    } catch (error) {
      console.error('Failed to calculate stats:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning'
    if (currentHour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getProgressPercentage = () => {
    if (stats.totalToday === 0) return 0
    return Math.round((stats.completedToday / stats.totalToday) * 100)
  }

  const getMotivationalMessage = () => {
    const percentage = getProgressPercentage()
    if (percentage === 100) return 'All done! 🎉'
    if (percentage >= 75) return 'Great progress today!'
    if (percentage >= 50) return 'You\'re halfway there!'
    if (percentage >= 25) return 'Keep going!'
    return 'Let\'s get started!'
  }

  const markTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ completed: true })
        .eq('id', taskId)

      if (error) throw error

      // Update local state
      setTodayTasks(prev => 
        prev.map(task => 
          task.id === taskId ? { ...task, completed: true } : task
        )
      )

      // Update stats
      setStats(prev => ({
        ...prev,
        completedToday: prev.completedToday + 1
      }))
    } catch (error) {
      console.error('Failed to mark task complete:', error)
    }
  }

  const calculateGoalProgress = async (goalId: string) => {
    try {
      const { data: goalTasks, error } = await supabase
        .from('schedules')
        .select('completed')
        .eq('user_id', user?.id)
        .eq('goal_id', goalId)

      if (error) throw error

      const completed = goalTasks?.filter(task => task.completed).length || 0
      const total = goalTasks?.length || 0
      
      return total > 0 ? Math.round((completed / total) * 100) : 0
    } catch (error) {
      console.error('Failed to calculate goal progress:', error)
      return 0
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'Physical Health':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.physicalHealthIcon}>
              <View style={styles.dumbbellWeight} />
              <View style={styles.dumbbellBar} />
              <View style={styles.dumbbellWeight} />
            </View>
          </View>
        )
      case 'Mental Health':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.mentalHealthIcon}>
              <View style={styles.brainShape} />
              <View style={styles.brainDetail} />
            </View>
          </View>
        )
      case 'Finance':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.financeIcon}>
              <View style={styles.coinOuter} />
              <Text style={styles.coinText}>$</Text>
            </View>
          </View>
        )
      case 'Social':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.socialIcon}>
              <View style={styles.person} />
              <View style={[styles.person, { marginLeft: -8 }]} />
            </View>
          </View>
        )
      default:
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.defaultIcon}>
              <View style={styles.defaultIconCircle} />
            </View>
          </View>
        )
    }
  }

  const renderProgressRing = () => {
    const percentage = getProgressPercentage()
    const circumference = 2 * Math.PI * 50
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <View style={styles.progressRingContainer}>
        <View style={styles.progressRing}>
          <View style={styles.progressRingBackground} />
          <View 
            style={[
              styles.progressRingFill,
              { 
                transform: [
                  { rotate: `${(percentage / 100) * 360}deg` }
                ]
              }
            ]} 
          />
          <View style={styles.progressRingCenter}>
            <Text style={styles.progressPercentage}>{percentage}%</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateEmoji}>🎯</Text>
      <Text style={styles.emptyStateTitle}>Welcome to Your Dashboard!</Text>
      <Text style={styles.emptyStateSubtext}>
        Get started by creating your first goal or adding a task for today.
      </Text>
      <View style={styles.emptyStateActions}>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('AddEditGoal')}
        >
          <Text style={styles.emptyStateButtonText}>Create Your First Goal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyStateButton, styles.emptyStateButtonSecondary]}
          onPress={() => navigation.navigate('AddEdit')}
        >
          <Text style={[styles.emptyStateButtonText, styles.emptyStateButtonTextSecondary]}>
            Add Today's Task
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.emptyStateTip}>
        💡 Tip: Goals help organize your tasks and track long-term progress
      </Text>
    </View>
  )

  // Show loading state while fetching data
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>

  
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Show empty state for completely new users */}
        {stats.totalToday === 0 && stats.activeGoalsCount === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Greeting Section */}
            <View style={styles.greetingSection}>
              <Text style={styles.greetingText}>
                {getGreeting()}, {user?.email?.split('@')[0] || 'there'}!
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              {primaryCategory && (
                <Text style={styles.focusText}>
                  🎯 Focusing on {primaryCategory}
                </Text>
              )}
            </View>

            {/* Your Focus Areas */}
            <View style={styles.focusAreasSection}>
              <Text style={styles.sectionTitle}>Your Focus Areas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContainer}>
                {getOrderedCategories().map((category, index) => (
                  <TouchableOpacity
                    key={category.category}
                    style={[
                      styles.categoryQuickCard,
                      category.is_primary && styles.categoryQuickCardPrimary,
                      index === 0 && styles.categoryQuickCardFirst
                    ]}
                    onPress={() => navigation.navigate('Goals', { categoryFilter: category.category })}
                  >
                    <View style={[styles.categoryQuickIcon, { backgroundColor: category.color }]}>
                      <Text style={styles.categoryQuickEmoji}>{category.icon}</Text>
                    </View>
                    <Text style={[
                      styles.categoryQuickName,
                      category.is_primary && styles.categoryQuickNamePrimary
                    ]}>
                      {category.category}
                    </Text>
                    {category.is_primary && (
                      <View style={styles.primaryIndicator}>
                        <Text style={styles.primaryIndicatorText}>PRIMARY</Text>
                      </View>
                    )}
                    {!category.is_primary && category.priority_score > 25 && (
                      <View style={styles.secondaryIndicator}>
                        <Text style={styles.secondaryIndicatorText}>FOCUS</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

        {/* Progress Overview */}
        {stats.totalToday > 0 && (
          <View style={styles.progressSection}>
            <TouchableOpacity 
              style={styles.progressCard}
              onPress={() => navigation.navigate('Schedule')}
            >
              {renderProgressRing()}
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>Today's Progress</Text>
                <Text style={styles.progressSubtitle}>
                  {stats.completedToday} of {stats.totalToday} tasks complete
                </Text>
                <Text style={styles.motivationalText}>
                  {getMotivationalMessage()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Goals')}
            >
              <Text style={styles.statNumber}>{stats.activeGoalsCount}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={styles.statNumber}>{stats.totalToday}</Text>
              <Text style={styles.statLabel}>Today's Tasks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.weeklyCompletion}%</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Today's Priorities */}
        {todayTasks.length > 0 && (
          <View style={styles.prioritiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {todayTasks.slice(0, 3).map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTime}>{formatTime(task.schedule_time)}</Text>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskCategory}>{(task as any).goalCategory || 'General'}</Text>
                  </View>
                </View>
                {!task.completed && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markTaskComplete(task.id)}
                  >
                    <View style={styles.checkIcon} />
                  </TouchableOpacity>
                )}
                {task.completed && (
                  <View style={styles.completedBadge}>
                    <View style={styles.checkIconCompleted} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Active Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {activeGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalItem}
                onPress={() => navigation.navigate('GoalDetail', { goal })}
              >
                <View style={styles.goalIcon}>
                  {getCategoryIcon(goal.category)}
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalCategory}>{goal.category || 'General'}</Text>
                  {goal.target_date && (
                    <Text style={styles.goalTarget}>
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <View style={styles.goalProgress}>
                  <View style={styles.miniProgressRing}>
                    <View style={styles.miniProgressBackground} />
                    <View style={[
                      styles.miniProgressFill,
                      { 
                        transform: [
                          { rotate: `${((goalProgress[goal.id] || 0) / 100) * 270}deg` }
                        ]
                      }
                    ]} />
                    <Text style={styles.miniProgressText}>{goalProgress[goal.id] || 0}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={() => navigation.navigate('AddEdit')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.plusIcon} />
                <View style={styles.plusIconVertical} />
              </View>
              <Text style={styles.actionTextPrimary}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('AddEditGoal')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.goalActionIcon}>
                  <View style={styles.goalActionTarget} />
                  <View style={styles.goalActionCenter} />
                </View>
              </View>
              <Text style={styles.actionText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Schedule')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.calendarActionIcon}>
                  <View style={styles.calendarActionTop} />
                  <View style={styles.calendarActionBody} />
                </View>
              </View>
              <Text style={styles.actionText}>View Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Feedback')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.feedbackActionIcon}>
                  <View style={styles.feedbackActionBubble} />
                  <View style={styles.feedbackActionTail} />
                </View>
              </View>
              <Text style={styles.actionText}>Quick Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>🔥</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{stats.currentStreak}-day completion streak!</Text>
              <Text style={styles.insightSubtext}>Keep up the great work!</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>📊</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>You completed {stats.weeklyCompletion}% of tasks this week</Text>
              <Text style={styles.insightSubtext}>Above your average!</Text>
            </View>
          </View>
        </View>

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor="#7C3AED" />
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor="#808080" />
          <Text style={styles.navLabel}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor="#808080" />
          <Text style={styles.navLabel}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor="#808080" />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Image source={IMAGES.ACCOUNT} style={styles.navIcon} resizeMode="contain" tintColor="#808080" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  navItemActive: {},
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navLabelActive: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  focusText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 8,
  },
  focusAreasSection: {
    paddingVertical: 16,
    marginBottom: 8,
  },
  categoryScrollContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    gap: 12,
  },
  categoryQuickCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  categoryQuickCardPrimary: {
    backgroundColor: '#F3F4F6',
    borderColor: '#7C3AED',
    borderWidth: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryQuickCardFirst: {
    marginLeft: 0,
  },
  categoryQuickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryQuickEmoji: {
    fontSize: 20,
  },
  categoryQuickName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryQuickNamePrimary: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  primaryIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryIndicatorText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  secondaryIndicatorText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressRingContainer: {
    marginRight: 20,
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#F3F4F6',
  },
  progressRingFill: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#7C3AED',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  prioritiesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionLink: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    width: 70,
  },
  taskContent: {
    flex: 1,
    marginLeft: 16,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#7C3AED',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
    marginLeft: 1,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconCompleted: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'white',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
    marginLeft: 1,
  },
  goalsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  goalItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 4,
  },
  goalTarget: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalProgress: {
    marginLeft: 16,
  },
  miniProgressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniProgressBackground: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  miniProgressFill: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#7C3AED',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '270deg' }],
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardPrimary: {
    backgroundColor: '#7C3AED',
  },
  actionIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  plusIcon: {
    width: 20,
    height: 3,
    backgroundColor: 'white',
    borderRadius: 1.5,
    position: 'absolute',
  },
  plusIconVertical: {
    width: 3,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 1.5,
    position: 'absolute',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  actionTextPrimary: {
    color: 'white',
  },
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  insightSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomPadding: {
    height: 100,
  },

  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderTopColor: '#7C3AED',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateActions: {
    width: '100%',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  emptyStateButtonTextSecondary: {
    color: '#7C3AED',
  },
  emptyStateTip: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Category Icon Styles (copied from other screens)
  categoryIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Health Icon - Heart
  healthIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  healthIconHeart: {
    width: 14,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    top: 3,
    left: 3,
  },
  healthIconPulse: {
    width: 5,
    height: 5,
    backgroundColor: '#EF4444',
    borderRadius: 2.5,
    position: 'absolute',
    top: 1,
    right: 2,
  },

  // Career Icon - Briefcase
  careerIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  careerIconBag: {
    width: 16,
    height: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 2,
  },
  careerIconHandle: {
    width: 8,
    height: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 2,
    left: 6,
  },

  // Personal Icon - Star
  personalIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  personalIconStar: {
    width: 16,
    height: 16,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 2,
    left: 2,
  },
  personalIconCenter: {
    width: 8,
    height: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    left: 6,
  },

  // Learning Icon - Book
  learningIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  learningIconBook: {
    width: 14,
    height: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 3,
    top: 2,
  },
  learningIconPages: {
    width: 10,
    height: 1.5,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 8,
    left: 5,
  },

  // Finance Icon - Dollar
  financeIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  financeIconCircle: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 8,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  financeIconDollar: {
    width: 2,
    height: 10,
    backgroundColor: '#8B5CF6',
    position: 'absolute',
    top: 5,
    left: 9,
  },

  // Other Icon - Target
  otherIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  otherIconTarget: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 8,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  otherIconCenter: {
    width: 6,
    height: 6,
    backgroundColor: '#6B7280',
    borderRadius: 3,
    position: 'absolute',
    top: 7,
    left: 7,
  },
})
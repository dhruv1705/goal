import React, { useState, useEffect,useContext } from 'react'
import { useFocusEffect, useTheme } from '@react-navigation/native'
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
  Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'
import IMAGES from '../assets'
import { AppContext } from '../theme/AppContext'

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
  const{isDarkTheme,setIsDarkTheme} = useContext(AppContext)
  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()
  const { colors } = useTheme()

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
      const [tasksResult, goalsResult] = await Promise.all([
        fetchTodayTasks(),
        fetchActiveGoals()
      ])

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
      const tasksWithCategories = await Promise.all(
        (data || []).map(async (task) => {
          if (task.goal_id) {
            if (goalCategoryCache[task.goal_id]) {
              return { ...task, goalCategory: goalCategoryCache[task.goal_id] }
            }
            
            const { data: goalData } = await supabase
              .from('goals')
              .select('category')
              .eq('id', task.goal_id)
              .single()

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        {/* Header */}
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background }]}> 
          <Text style={[styles.headerTitle, { color: colors.text }]}>Home</Text>
          <Switch value={isDarkTheme} onValueChange={(newValue) => setIsDarkTheme(newValue)} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={[styles.logoutButtonText, { color: colors.primary }]}>Logout</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, marginLeft: 10 }]}>Home</Text>
        </View>
        <Switch value={isDarkTheme} onValueChange={(newValue) => setIsDarkTheme(newValue)} />
      </View>
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: colors.background }]} 
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
            <View style={[styles.greetingSection, { backgroundColor: colors.background }]}> 
              <Text style={[styles.greetingText, { color: colors.text }]}> 
                {getGreeting()}, {user?.email?.split('@')[0] || 'there'}!
              </Text>
              <Text style={[styles.dateText, { color: colors.text }]}>
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
                      { backgroundColor: colors.card, borderColor: colors.border },
                      category.is_primary && { },
                      index === 0 && styles.categoryQuickCardFirst
                    ]}
                    onPress={() => navigation.navigate('Goals', { categoryFilter: category.category })}
                  >
                    <View style={[styles.categoryQuickIcon, { backgroundColor: category.color }]}>
                      <Text style={styles.categoryQuickEmoji}>{category.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.categoryQuickName,
                        category.is_primary && styles.categoryQuickNamePrimary,
                        { color: colors.text }
                      ]}
                    >
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
              style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Schedule')}
            >
              {renderProgressRing()}
              <View style={styles.progressInfo}>
                <Text style={[styles.progressTitle, { color: colors.text }]}>Today's Progress</Text>
                <Text style={[styles.progressSubtitle, { color: colors.text }]}>
                  {stats.completedToday} of {stats.totalToday} tasks complete
                </Text>
                <Text style={[styles.motivationalText, { color: colors.primary }]}>
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
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Goals')}
            >
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.activeGoalsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Active Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.totalToday}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Today's Tasks</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.weeklyCompletion}%</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>This Week</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>Day Streak</Text>
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
              <View key={task.id} style={[styles.taskItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Active Goals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {activeGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[styles.goalItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('GoalDetail', { goal })}
              >
                <View style={styles.goalIcon}>
                  {getCategoryIcon(goal.category)}
                </View>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                  <Text style={[styles.goalCategory, { color: colors.primary }]}>{goal.category || 'General'}</Text>
                  {goal.target_date && (
                    <Text style={[styles.goalTarget, { color: colors.text }]}> 
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
              style={[styles.actionCard, styles.actionCardPrimary, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddEdit')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.plusIcon} />
                <View style={styles.plusIconVertical} />
              </View>
              <Text style={[styles.actionTextPrimary, { color: '#fff' }]}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddEditGoal')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.goalActionIcon}>
                  <View style={styles.goalActionTarget} />
                  <View style={styles.goalActionCenter} />
                </View>
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Schedule')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.calendarActionIcon}>
                  <View style={styles.calendarActionTop} />
                  <View style={styles.calendarActionBody} />
                </View>
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>View Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Feedback')}
            >
              <View style={styles.actionIcon}>
                <View style={styles.feedbackActionIcon}>
                  <View style={styles.feedbackActionBubble} />
                  <View style={styles.feedbackActionTail} />
                </View>
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Quick Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={styles.insightEmoji}>🔥</Text>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>{stats.currentStreak}-day completion streak!</Text>
              <Text style={[styles.insightSubtext, { color: colors.text }]}>Keep up the great work!</Text>
            </View>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={styles.insightEmoji}>📊</Text>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>You completed {stats.weeklyCompletion}% of tasks this week</Text>
              <Text style={[styles.insightSubtext, { color: colors.text }]}>Above your average!</Text>
            </View>
          </View>
        </View>

            <View style={styles.bottomPadding} />
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, paddingBottom: Math.max(8, insets.bottom) }]}> 
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor={colors.primary} />
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.navLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.navLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.navLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Talk')}>
          <Image source={IMAGES.TALK} style={styles.navIcon} resizeMode="contain" tintColor={isDarkTheme ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.navLabel, { color: isDarkTheme ? '#9CA3AF' : '#6B7280' }]}>Talk</Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  physicalHealthIcon: {
    width: 30,
    height: 15,
    backgroundColor: '#FFD700', 
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dumbbellWeight: {
    width: 10,
    height: 20,
    backgroundColor: '#8B4513', 
    borderRadius: 3,
  },
  dumbbellBar: {
    width: 15,
    height: 5,
    backgroundColor: '#A9A9A9', 
  },
  mentalHealthIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#87CEEB', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainShape: {
    width: 20,
    height: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderColor: '#4682B4',
    borderWidth: 2,
    position: 'relative',
  },
  brainDetail: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: '#4682B4',
    left: '50%',
    top: 2,
    marginLeft: -1,
  },
  financeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#32CD32', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    color: '#FFD700', 
    fontSize: 12,
    fontWeight: 'bold',
  },
  socialIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6347', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  person: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  defaultIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goalActionIcon: {
    width: 20,
    height: 20,
    tintColor: '#7C3AED',
  },
  logoutButton: {
    marginRight: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
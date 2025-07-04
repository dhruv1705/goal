import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  StatusBar,
  ScrollView,
  Modal,
  Image
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'
import IMAGES from '../assets'
type Schedule = Tables<'schedules'>

interface ScheduleScreenProps {
  navigation: any
  route?: {
    params?: {
      categoryFilter?: string
    }
  }
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation, route }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [weeklySchedules, setWeeklySchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month'>('Day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeekDay, setSelectedWeekDay] = useState(new Date())
  const [monthlySchedules, setMonthlySchedules] = useState<Schedule[]>([])
  const [selectedMonthDay, setSelectedMonthDay] = useState(new Date())
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Schedule | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(route?.params?.categoryFilter || null)
  const { colors } = useTheme()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (activeTab === 'Day') {
      fetchSchedules()
    } else if (activeTab === 'Week') {
      fetchWeeklySchedules()
    } else if (activeTab === 'Month') {
      fetchMonthlySchedules()
    }
  }, [activeTab, currentDate, selectedWeekDay, selectedMonthDay, categoryFilter])

  useEffect(() => {
    // Initialize selectedWeekDay to today when switching to Week view
    if (activeTab === 'Week') {
      setSelectedWeekDay(new Date())
    }
  }, [activeTab])

  useEffect(() => {
    // Handle category filter changes from route params
    if (route?.params?.categoryFilter !== undefined) {
      setCategoryFilter(route.params.categoryFilter)
    }
  }, [route?.params?.categoryFilter])

  const fetchSchedules = async () => {
    try {
      const targetDate = activeTab === 'Day' ? currentDate.toISOString().split('T')[0] : selectedWeekDay.toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user?.id)
        .eq('schedule_date', targetDate)
        .order('schedule_time', { ascending: true })

      if (error) throw error

      // Fetch goal categories separately for tasks that have goal_id
      const schedulesWithCategories = await Promise.all(
        (data || []).map(async (schedule) => {
          if (schedule.goal_id) {
            const { data: goalData } = await supabase
              .from('goals')
              .select('category')
              .eq('id', schedule.goal_id)
              .single()
            
            return { ...schedule, goalCategory: goalData?.category }
          }
          return { ...schedule, goalCategory: null }
        })
      )

      // Apply category filter if set
      const filteredSchedules = categoryFilter 
        ? schedulesWithCategories.filter(schedule => 
            schedule.goalCategory === categoryFilter
          )
        : schedulesWithCategories

      setSchedules(filteredSchedules)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklySchedules = async () => {
    try {
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user?.id)
        .gte('schedule_date', weekStart.toISOString().split('T')[0])
        .lte('schedule_date', weekEnd.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true })
        .order('schedule_time', { ascending: true })

      if (error) throw error

      // Fetch goal categories separately for tasks that have goal_id
      const schedulesWithCategories = await Promise.all(
        (data || []).map(async (schedule) => {
          if (schedule.goal_id) {
            const { data: goalData } = await supabase
              .from('goals')
              .select('category')
              .eq('id', schedule.goal_id)
              .single()
            
            return { ...schedule, goalCategory: goalData?.category }
          }
          return { ...schedule, goalCategory: null }
        })
      )

      // Apply category filter if set
      const filteredWeeklySchedules = categoryFilter 
        ? schedulesWithCategories.filter(schedule => 
            schedule.goalCategory === categoryFilter
          )
        : schedulesWithCategories

      setWeeklySchedules(filteredWeeklySchedules)
      
      // Filter schedules for selected day
      const selectedDateStr = selectedWeekDay.toISOString().split('T')[0]
      const daySchedules = filteredWeeklySchedules.filter(s => s.schedule_date === selectedDateStr)
      setSchedules(daySchedules)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch weekly schedules')
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlySchedules = async () => {
    try {
      const monthStart = getMonthStart(currentDate)
      const monthEnd = getMonthEnd(currentDate)
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user?.id)
        .gte('schedule_date', monthStart.toISOString().split('T')[0])
        .lte('schedule_date', monthEnd.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true })
        .order('schedule_time', { ascending: true })

      if (error) throw error

      // Fetch goal categories separately for tasks that have goal_id
      const schedulesWithCategories = await Promise.all(
        (data || []).map(async (schedule) => {
          if (schedule.goal_id) {
            const { data: goalData } = await supabase
              .from('goals')
              .select('category')
              .eq('id', schedule.goal_id)
              .single()
            
            return { ...schedule, goalCategory: goalData?.category }
          }
          return { ...schedule, goalCategory: null }
        })
      )

      // Apply category filter if set
      const filteredMonthlySchedules = categoryFilter 
        ? schedulesWithCategories.filter(schedule => 
            schedule.goalCategory === categoryFilter
          )
        : schedulesWithCategories

      setMonthlySchedules(filteredMonthlySchedules)
      
      // Filter schedules for selected day
      const selectedDateStr = selectedMonthDay.toISOString().split('T')[0]
      const daySchedules = filteredMonthlySchedules.filter(s => s.schedule_date === selectedDateStr)
      setSchedules(daySchedules)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch monthly schedules')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    if (activeTab === 'Day') {
      await fetchSchedules()
    } else if (activeTab === 'Week') {
      await fetchWeeklySchedules()
    } else if (activeTab === 'Month') {
      await fetchMonthlySchedules()
    }
    setRefreshing(false)
  }

  const toggleTaskCompletion = async (task: Schedule) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          completed: !task.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      // Update local state
      if (activeTab === 'Day') {
        setSchedules(schedules.map(s => 
          s.id === task.id ? { ...s, completed: !s.completed } : s
        ))
      } else if (activeTab === 'Week') {
        setWeeklySchedules(weeklySchedules.map(s => 
          s.id === task.id ? { ...s, completed: !s.completed } : s
        ))
        // Also update the day schedules if it's visible
        setSchedules(schedules.map(s => 
          s.id === task.id ? { ...s, completed: !s.completed } : s
        ))
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update task completion')
    }
  }

  const showTaskActions = (task: Schedule) => {
    setSelectedTask(task)
    setShowActionSheet(true)
  }

  const handleMarkComplete = async () => {
    if (selectedTask) {
      await toggleTaskCompletion(selectedTask)
      setShowActionSheet(false)
      setSelectedTask(null)
    }
  }

  const handleViewEdit = () => {
    if (selectedTask) {
      setShowActionSheet(false)
      navigation.navigate('AddEdit', { schedule: selectedTask })
      setSelectedTask(null)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out')
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    return `${hour.toString().padStart(2, '0')}:${minutes}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatWeekDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
    return new Date(d.setDate(diff))
  }

  const getWeekEnd = (date: Date) => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return weekEnd
  }

  const getWeekDays = (date: Date) => {
    const weekStart = getWeekStart(date)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const getMonthDays = (date: Date) => {
    const monthStart = getMonthStart(date)
    const monthEnd = getMonthEnd(date)
    const days = []
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = monthStart.getDay()
    const startDate = new Date(monthStart)
    startDate.setDate(startDate.getDate() - firstDayOfWeek)
    
    // Generate 42 days (6 weeks × 7 days) for complete calendar grid
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    
    return days
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    if (activeTab === 'Day') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
      setCurrentDate(newDate)
    } else if (activeTab === 'Week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
      setCurrentDate(newDate)
    } else if (activeTab === 'Month') {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
      setCurrentDate(newDate)
    }
  }

  const selectWeekDay = (date: Date) => {
    setSelectedWeekDay(date)
    const selectedDateStr = date.toISOString().split('T')[0]
    const daySchedules = weeklySchedules.filter(s => s.schedule_date === selectedDateStr)
    setSchedules(daySchedules)
  }

  const selectMonthDay = (date: Date) => {
    setSelectedMonthDay(date)
    const selectedDateStr = date.toISOString().split('T')[0]
    const daySchedules = monthlySchedules.filter(s => s.schedule_date === selectedDateStr)
    setSchedules(daySchedules)
  }

  const completedTasks = activeTab === 'Week' 
    ? weeklySchedules.filter(s => s.completed).length 
    : activeTab === 'Month'
    ? monthlySchedules.filter(s => s.completed).length
    : schedules.filter(s => s.completed).length

  const totalTasks = activeTab === 'Week' 
    ? weeklySchedules.length 
    : activeTab === 'Month'
    ? monthlySchedules.length
    : schedules.length

  const hasTasksOnDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    if (activeTab === 'Week') {
      return weeklySchedules.some(s => s.schedule_date === dateStr)
    } else if (activeTab === 'Month') {
      return monthlySchedules.some(s => s.schedule_date === dateStr)
    }
    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDay = (date: Date) => {
    if (activeTab === 'Week') {
      return date.toDateString() === selectedWeekDay.toDateString()
    } else if (activeTab === 'Month') {
      return date.toDateString() === selectedMonthDay.toDateString()
    }
    return false
  }

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={[
        styles.taskItem, 
        { backgroundColor: colors.card, borderColor: colors.border },
        item.completed && styles.taskItemCompleted
      ]}
      onPress={() => showTaskActions(item)}
    >
      <View style={styles.taskContent}>
        <View style={styles.timeSection}>
          <Text style={[
            styles.taskTime, 
            { color: colors.text },
            item.completed && styles.taskTimeCompleted
          ]}>
            {formatTime(item.schedule_time)}
          </Text>
        </View>
        <View style={styles.taskAccent} />
        <View style={styles.taskDetails}>
          <View style={styles.taskTitleRow}>
            <Text style={[
              styles.taskTitle, 
              { color: colors.text },
              item.completed && styles.taskTitleCompleted
            ]}>
              {item.title}
            </Text>
            {item.is_recurring && (
              <View style={[styles.recurringBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.recurringBadgeText}>🔄</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.taskCategory, 
            { color: colors.text },
            item.completed && styles.taskCategoryCompleted
          ]}>
            {(item as any).goalCategory || 'General'}
            {item.is_recurring && ` • ${item.recurrence_type}`}
            {item.parent_task_id && item.parent_task_id !== item.id && ' • Part of series'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule</Text>
      </View>

      <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {(['Day', 'Week', 'Month'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton, 
                { backgroundColor: colors.card, borderColor: colors.border },
                activeTab === tab && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                { color: colors.text },
                activeTab === tab && { color: '#fff' }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter */}
        <View style={[styles.categoryFilterContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.categoryFilterTab, 
              { borderColor: colors.border },
              !categoryFilter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[
              styles.categoryFilterText, 
              { color: colors.text },
              !categoryFilter && { color: '#fff' }
            ]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {(['Physical Health', 'Mental Health', 'Finance', 'Social'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterTab, 
                { borderColor: colors.border },
                categoryFilter === category && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setCategoryFilter(category)}
            >
              <Text style={[
                styles.categoryFilterText, 
                { color: colors.text },
                categoryFilter === category && { color: '#fff' }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        {activeTab === 'Day' ? (
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navArrow}>
              <Text style={[styles.navArrowText, { color: colors.text }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.dateSection}>
              <Text style={[styles.currentDate, { color: colors.primary }]}>{formatDate(currentDate)}</Text>
              <TouchableOpacity 
                style={[styles.todayButton, { borderColor: colors.primary }]}
                onPress={() => setCurrentDate(new Date())}
              >
                <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navArrow}>
              <Text style={[styles.navArrowText, { color: colors.text }]}>›</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'Week' ? (
          <>
            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
              <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navArrow}>
                <Text style={[styles.navArrowText, { color: colors.text }]}>‹</Text>
              </TouchableOpacity>
              <View style={styles.dateSection}>
                <Text style={[styles.weekRange, { color: colors.text }]}>
                  {formatWeekDate(getWeekStart(currentDate))} - {formatWeekDate(getWeekEnd(currentDate))}
                </Text>
                <TouchableOpacity 
                  style={[styles.todayButton, { borderColor: colors.primary }]}
                  onPress={() => setCurrentDate(new Date())}
                >
                  <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navArrow}>
                <Text style={[styles.navArrowText, { color: colors.text }]}>›</Text>
              </TouchableOpacity>
            </View>
            
            {/* Week Selector */}
            <View style={styles.weekSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekDaysContainer}>
                {getWeekDays(currentDate).map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.weekDayItem,
                      { backgroundColor: colors.card },
                      isSelectedDay(day) && { backgroundColor: colors.primary },
                      isToday(day) && !isSelectedDay(day) && { borderWidth: 2, borderColor: colors.primary }
                    ]}
                    onPress={() => selectWeekDay(day)}
                  >
                    <Text style={[
                      styles.weekDayName,
                      { color: colors.text },
                      isToday(day) && !isSelectedDay(day) && { color: colors.primary, fontWeight: '600' },
                      isSelectedDay(day) && { color: 'white' }
                    ]}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.weekDayNumber,
                      { color: colors.text },
                      isToday(day) && !isSelectedDay(day) && { color: colors.primary },
                      isSelectedDay(day) && { color: 'white' }
                    ]}>
                      {day.getDate()}
                    </Text>
                    {hasTasksOnDate(day) && (
                      <View style={styles.taskIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        ) : activeTab === 'Month' ? (
          <>
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navArrow}>
                <Text style={[styles.navArrowText, { color: colors.text }]}>‹</Text>
              </TouchableOpacity>
              <View style={styles.dateSection}>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity 
                  style={[styles.todayButton, { borderColor: colors.primary }]}
                  onPress={() => setCurrentDate(new Date())}
                >
                  <Text style={[styles.todayButtonText, { color: colors.text }]}>Today</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navArrow}>
                <Text style={[styles.navArrowText, { color: colors.text }]}>›</Text>
              </TouchableOpacity>
            </View>
            
            {/* Month Calendar */}
            <View style={styles.monthCalendar}>
              {/* Week Headers */}
              <View style={styles.weekHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={[styles.weekHeader, { color: colors.text }]}>{day}</Text>
                ))}
              </View>
              
              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {getMonthDays(currentDate).map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      !isCurrentMonth(day) && styles.calendarDayOtherMonth,
                      isSelectedDay(day) && { backgroundColor: colors.primary, borderRadius: 8 },
                      isToday(day) && !isSelectedDay(day) && { borderWidth: 2, borderColor: colors.primary, borderRadius: 8 }
                    ]}
                    onPress={() => selectMonthDay(day)}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: colors.text },
                      !isCurrentMonth(day) && { color: colors.text + '50' },
                      isToday(day) && !isSelectedDay(day) && { color: colors.primary, fontWeight: '700' },
                      isSelectedDay(day) && { color: 'white', fontWeight: '700' }
                    ]}>
                      {day.getDate()}
                    </Text>
                    {hasTasksOnDate(day) && (
                      <View style={styles.calendarTaskIndicator} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Selected Day Info */}
            <View style={styles.selectedDayInfo}>
              <Text style={[styles.selectedDayTitle, { color: colors.text }]}>
                {selectedMonthDay.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </>
        ) : null}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{totalTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              {activeTab === 'Week' ? 'Weekly Tasks' : activeTab === 'Month' ? 'Monthly Tasks' : 'Total Tasks'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{completedTasks}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Completed</Text>
          </View>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          {schedules.length > 0 ? (
            schedules.map((item) => (
              <View key={item.id}>
                {renderScheduleItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No schedules for today</Text>
              <Text style={[styles.emptySubtext, { color: colors.text }]}>
                Tap the + button to add your first schedule
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEdit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Task Action Sheet */}
      <Modal
        visible={showActionSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={[styles.actionSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.actionSheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
                {selectedTask?.title}
              </Text>
              <Text style={[styles.actionSheetSubtitle, { color: colors.text + '80' }]}>
                {selectedTask && formatTime(selectedTask.schedule_time)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionSheetOption, { borderBottomColor: colors.border }]}
              onPress={handleMarkComplete}
            >
              <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>
                {selectedTask?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionSheetOption, { borderBottomColor: colors.border }]}
              onPress={handleViewEdit}
            >
              <Text style={[styles.actionSheetOptionText, { color: colors.text }]}>
                View/Edit Details
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionSheetOption, styles.actionSheetCancel, { borderTopColor: colors.border }]}
              onPress={() => setShowActionSheet(false)}
            >
              <Text style={[styles.actionSheetOptionText, styles.actionSheetCancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor={colors.primary}/>
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Talk')}>
          <Image source={IMAGES.TALK} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Talk</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateSection: {
    alignItems: 'center',
    flex: 1,
  },
  navArrow: {
    padding: 8,
  },
  navArrowText: {
    fontSize: 18,
    color: '#666',
  },
  currentDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  todayButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginRight: 12,
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
  },
  taskList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  timeSection: {
    width: 60,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  taskTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginHorizontal: 16,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
  },
  
  // Completed task styles
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskTimeCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskCategoryCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recurringBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  recurringBadgeText: {
    fontSize: 12,
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navItemActive: {},
  navIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  navLabelActive: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // LifeTracker Style Icons
  // Home Icon
  homeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  homeIconRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#9CA3AF',
    position: 'absolute',
    top: 1,
  },
  homeIconBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderTopWidth: 0,
    position: 'absolute',
    top: 8,
  },
  
  // Goals Icon - Flag
  goalsIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 3,
    position: 'relative',
  },
  goalsFlagPole: {
    width: 1.5,
    height: 18,
    backgroundColor: '#9CA3AF',
    position: 'absolute',
    left: 4,
  },
  goalsFlagBody: {
    width: 12,
    height: 8,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderLeftWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 5.5,
    top: 3,
  },
  
  // Schedule Icon - Calendar (Active)
  scheduleIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scheduleCalendarBody: {
    width: 18,
    height: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 2,
    position: 'absolute',
    top: 4,
  },
  scheduleCalendarTop: {
    width: 20,
    height: 3,
    backgroundColor: '#7C3AED',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    top: 1,
  },
  scheduleGridContainer: {
    width: 14,
    height: 10,
    position: 'absolute',
    top: 7,
    justifyContent: 'space-between',
  },
  scheduleGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 3,
  },
  scheduleGridDot: {
    width: 2.5,
    height: 2.5,
    backgroundColor: 'white',
    borderRadius: 0.5,
  },
  
  // Feedback Icon - Speech Bubble
  feedbackIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  feedbackBubble: {
    width: 18,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    borderRadius: 8,
    position: 'absolute',
    top: 2,
  },
  feedbackTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#9CA3AF',
    position: 'absolute',
    bottom: 5,
    left: 6,
  },
  
  // Profile Icon - Simple User
  profileIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    position: 'absolute',
    top: 3,
  },
  profileBody: {
    width: 16,
    height: 10,
    backgroundColor: '#9CA3AF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    position: 'absolute',
    bottom: 3,
  },
  // Week View Styles
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  weekSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weekDaysContainer: {
    paddingHorizontal: 4,
  },
  weekDayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 60,
    position: 'relative',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  taskIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  
  // Action Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  actionSheetHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 14,
  },
  actionSheetOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  actionSheetOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionSheetCancel: {
    borderBottomWidth: 0,
    marginTop: 8,
    borderTopWidth: 1,
  },
  actionSheetCancelText: {
    color: '#EF4444',
    fontWeight: '500',
  },

  // Month View Styles
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  monthCalendar: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weekHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarTaskIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  selectedDayInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  // Category Filter Styles
  categoryFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  categoryFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryFilterTabActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Categories Icon - 2x2 Grid
  categoriesIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  categoriesGrid: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoriesSquare: {
    width: 6,
    height: 6,
    borderRadius: 1,
    marginBottom: 2,
  },
})
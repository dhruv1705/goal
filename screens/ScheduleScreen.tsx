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
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'

type Schedule = Tables<'schedules'>

interface ScheduleScreenProps {
  navigation: any
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [weeklySchedules, setWeeklySchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month'>('Day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedWeekDay, setSelectedWeekDay] = useState(new Date())
  const { user, signOut } = useAuth()

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (activeTab === 'Day') {
      fetchSchedules()
    } else if (activeTab === 'Week') {
      fetchWeeklySchedules()
    }
  }, [activeTab, currentDate, selectedWeekDay])

  useEffect(() => {
    // Initialize selectedWeekDay to today when switching to Week view
    if (activeTab === 'Week') {
      setSelectedWeekDay(new Date())
    }
  }, [activeTab])

  const fetchSchedules = async () => {
    try {
      const targetDate = activeTab === 'Day' ? today : selectedWeekDay.toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('schedule_date', targetDate)
        .order('schedule_time', { ascending: true })

      if (error) throw error
      setSchedules(data || [])
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
        .gte('schedule_date', weekStart.toISOString().split('T')[0])
        .lte('schedule_date', weekEnd.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true })
        .order('schedule_time', { ascending: true })

      if (error) throw error
      setWeeklySchedules(data || [])
      
      // Filter schedules for selected day
      const selectedDateStr = selectedWeekDay.toISOString().split('T')[0]
      const daySchedules = (data || []).filter(s => s.schedule_date === selectedDateStr)
      setSchedules(daySchedules)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch weekly schedules')
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
    }
    setRefreshing(false)
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

  const navigateDate = (direction: 'prev' | 'next') => {
    if (activeTab === 'Day') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
      setCurrentDate(newDate)
    } else if (activeTab === 'Week') {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
      setCurrentDate(newDate)
    }
  }

  const selectWeekDay = (date: Date) => {
    setSelectedWeekDay(date)
    const selectedDateStr = date.toISOString().split('T')[0]
    const daySchedules = weeklySchedules.filter(s => s.schedule_date === selectedDateStr)
    setSchedules(daySchedules)
  }

  const completedTasks = activeTab === 'Week' 
    ? weeklySchedules.filter(s => s.completed).length 
    : schedules.filter(s => s.completed).length

  const totalTasks = activeTab === 'Week' ? weeklySchedules.length : schedules.length

  const hasTasksOnDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return weeklySchedules.some(s => s.schedule_date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDay = (date: Date) => {
    return date.toDateString() === selectedWeekDay.toDateString()
  }

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.taskItem}
      onPress={() => navigation.navigate('AddEdit', { schedule: item })}
    >
      <Text style={styles.taskTime}>{formatTime(item.schedule_time)}</Text>
      <View style={styles.taskContent}>
        <View style={styles.taskAccent} />
        <View style={styles.taskDetails}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.taskCategory}>Physical</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {(['Day', 'Week', 'Month'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Navigation */}
        {activeTab === 'Day' ? (
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navArrow}>
              <Text style={styles.navArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.currentDate}>{formatDate(currentDate)}</Text>
            <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navArrow}>
              <Text style={styles.navArrowText}>›</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'Week' ? (
          <>
            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
              <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navArrow}>
                <Text style={styles.navArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.weekRange}>
                {formatWeekDate(getWeekStart(currentDate))} - {formatWeekDate(getWeekEnd(currentDate))}
              </Text>
              <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navArrow}>
                <Text style={styles.navArrowText}>›</Text>
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
                      isSelectedDay(day) && styles.weekDayItemSelected,
                      isToday(day) && styles.weekDayItemToday
                    ]}
                    onPress={() => selectWeekDay(day)}
                  >
                    <Text style={[
                      styles.weekDayName,
                      isToday(day) && !isSelectedDay(day) && styles.weekDayNameToday,
                      isSelectedDay(day) && styles.weekDayNameSelected
                    ]}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.weekDayNumber,
                      isToday(day) && !isSelectedDay(day) && styles.weekDayNumberToday,
                      isSelectedDay(day) && styles.weekDayNumberSelected
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
        ) : null}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalTasks}</Text>
            <Text style={styles.statLabel}>
              {activeTab === 'Week' ? 'Weekly Tasks' : 'Total Tasks'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
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
              <Text style={styles.emptyText}>No schedules for today</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first schedule
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEdit')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Bottom Navigation - LifeTracker Style */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <View style={styles.homeIcon}>
              <View style={styles.homeIconRoof} />
              <View style={styles.homeIconBody} />
            </View>
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
          <View style={styles.navIconContainer}>
            <View style={styles.goalsIcon}>
              <View style={styles.goalsFlagPole} />
              <View style={styles.goalsFlagBody} />
            </View>
          </View>
          <Text style={styles.navLabel}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.navIconContainer}>
            <View style={styles.scheduleIcon}>
              <View style={styles.scheduleCalendarBody} />
              <View style={styles.scheduleCalendarTop} />
              <View style={styles.scheduleGridContainer}>
                <View style={styles.scheduleGridRow}>
                  <View style={styles.scheduleGridDot} />
                  <View style={styles.scheduleGridDot} />
                  <View style={styles.scheduleGridDot} />
                </View>
                <View style={styles.scheduleGridRow}>
                  <View style={styles.scheduleGridDot} />
                  <View style={styles.scheduleGridDot} />
                  <View style={styles.scheduleGridDot} />
                </View>
              </View>
            </View>
          </View>
          <Text style={styles.navLabelActive}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <View style={styles.feedbackIcon}>
              <View style={styles.feedbackBubble} />
              <View style={styles.feedbackTail} />
            </View>
          </View>
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.navIconContainer}>
            <View style={styles.profileIcon}>
              <View style={styles.profileHead} />
              <View style={styles.profileBody} />
            </View>
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
    marginHorizontal: 20,
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
  taskTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 60,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  taskAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginRight: 16,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
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
    paddingBottom: 8,
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
    marginHorizontal: 20,
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
    backgroundColor: '#f8f9fa',
    minWidth: 60,
    position: 'relative',
  },
  weekDayItemSelected: {
    backgroundColor: '#7C3AED',
  },
  weekDayItemToday: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  weekDayNameSelected: {
    color: 'white',
  },
  weekDayNameToday: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  weekDayNumberSelected: {
    color: 'white',
  },
  weekDayNumberToday: {
    color: '#7C3AED',
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
})
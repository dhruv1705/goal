import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'

type Goal = Tables<'goals'>
type Schedule = Tables<'schedules'>

interface GoalDetailScreenProps {
  navigation: any
  route: {
    params: {
      goal: Goal
    }
  }
}

export const GoalDetailScreen: React.FC<GoalDetailScreenProps> = ({ navigation, route }) => {
  const { goal } = route.params
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [tasks, setTasks] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Schedule | null>(null)
  
  // Add task form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDate, setNewTaskDate] = useState(new Date())
  const [newTaskTime, setNewTaskTime] = useState(new Date())
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null)
  const [savingTask, setSavingTask] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('goal_id', goal.id)
        .order('schedule_date', { ascending: true })
        .order('schedule_time', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTasks()
    setRefreshing(false)
  }

  const generateRecurringTasks = (baseDate: Date, endDate: Date | null, type: string, interval: number) => {
    const tasks = []
    const currentDate = new Date(baseDate)
    const maxDate = endDate || new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000) // Default: 1 year
    
    while (currentDate <= maxDate && tasks.length < 52) { // Max 52 instances
      tasks.push(currentDate.toISOString().split('T')[0])
      
      switch (type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval)
          break
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + interval)
          break
      }
    }
    
    return tasks
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }

    setSavingTask(true)
    try {
      // Format date and time
      const scheduleTime = `${newTaskTime.getHours().toString().padStart(2, '0')}:${newTaskTime.getMinutes().toString().padStart(2, '0')}`

      const baseTaskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        schedule_time: scheduleTime,
        priority: newTaskPriority,
        goal_id: goal.id,
        user_id: user?.id!,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Temporarily disable recurring functionality until migration is applied
      const useRecurring = false; // Set to true after applying migration

      // Only add recurring fields if the database supports them
      if (isRecurring && useRecurring) {
        Object.assign(baseTaskData, {
          is_recurring: true,
          recurrence_type: recurrenceType,
          recurrence_interval: recurrenceInterval,
          recurrence_end_date: recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
        })
      }

      if (isRecurring && useRecurring) {
        // Generate recurring task dates
        const recurringDates = generateRecurringTasks(
          newTaskDate,
          recurrenceEndDate,
          recurrenceType,
          recurrenceInterval
        )

        // Create tasks for each date
        const tasksToInsert = recurringDates.map(date => ({
          ...baseTaskData,
          schedule_date: date,
        }))

        console.log('Inserting recurring tasks:', tasksToInsert)
        const { data, error } = await supabase
          .from('schedules')
          .insert(tasksToInsert)
          .select()

        if (error) {
          console.error('Recurring task insert error:', error)
          throw error
        }
        console.log('Successfully created recurring tasks:', data)
        Alert.alert('Success', `Created ${recurringDates.length} recurring tasks!`)
      } else {
        // Create single task
        const taskToInsert = {
          ...baseTaskData,
          schedule_date: newTaskDate.toISOString().split('T')[0],
        }
        
        console.log('Inserting single task:', taskToInsert)
        const { data, error } = await supabase
          .from('schedules')
          .insert([taskToInsert])
          .select()

        if (error) {
          console.error('Single task insert error:', error)
          throw error
        }
        console.log('Successfully created task:', data)
        Alert.alert('Success', 'Task added successfully!')
      }

      // Reset form
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskDate(new Date())
      setNewTaskTime(new Date())
      setNewTaskPriority('medium')
      setIsRecurring(false)
      setRecurrenceType('daily')
      setRecurrenceInterval(1)
      setRecurrenceEndDate(null)
      setShowAddTaskModal(false)
      
      // Refresh tasks
      await fetchTasks()
    } catch (error: any) {
      console.error('Add task error:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error occurred'
      Alert.alert('Error', `Failed to add task: ${errorMessage}`)
    } finally {
      setSavingTask(false)
    }
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
      await fetchTasks()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', taskId)

              if (error) throw error
              await fetchTasks()
              Alert.alert('Success', 'Task deleted successfully!')
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete task')
            }
          },
        },
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981'
      case 'completed':
        return '#7C3AED'
      case 'paused':
        return '#F59E0B'
      default:
        return '#9CA3AF'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444'
      case 'medium':
        return '#F59E0B'
      case 'low':
        return '#10B981'
      default:
        return '#9CA3AF'
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    return `${hour.toString().padStart(2, '0')}:${minutes}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'Health':
        return '💪'
      case 'Career':
        return '💼'
      case 'Personal':
        return '🌟'
      case 'Learning':
        return '📚'
      case 'Finance':
        return '💰'
      default:
        return '🎯'
    }
  }

  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Date/Time picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setNewTaskDate(selectedDate)
    }
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      setNewTaskTime(selectedTime)
    }
  }

  // Quick time slot presets
  const setQuickTimeSlot = (hour: number, minute: number = 0) => {
    const newTime = new Date()
    newTime.setHours(hour, minute, 0, 0)
    setNewTaskTime(newTime)
  }

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTimeDisplay = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const viewTaskDetails = (task: Schedule) => {
    setSelectedTask(task)
    setShowTaskDetailModal(true)
  }

  const renderTaskItem = (task: Schedule) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.taskItem, task.completed && styles.taskItemCompleted]}
      onPress={() => viewTaskDetails(task)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskLeft}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted
            ]}
            onPress={(e) => {
              e.stopPropagation()
              toggleTaskCompletion(task)
            }}
          >
            {task.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <Text style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted
            ]}>
              {task.title}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskDate}>
                {formatDate(task.schedule_date)} at {formatTime(task.schedule_time)}
              </Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(task.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            {task.description && (
              <Text style={[
                styles.taskDescription,
                task.completed && styles.taskDescriptionCompleted
              ]}>
                {task.description}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteTaskButton}
          onPress={() => deleteTask(task.id)}
        >
          <Text style={styles.deleteTaskText}>×</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditGoal', { goal })}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Goal Header */}
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={styles.goalEmoji}>{getCategoryIcon(goal.category)}</Text>
            <View style={styles.goalTitleText}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              {goal.category && (
                <Text style={styles.goalCategory}>{goal.category}</Text>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) }]}>
              <Text style={styles.statusText}>{goal.status.toUpperCase()}</Text>
            </View>
          </View>
          
          {goal.description && (
            <Text style={styles.goalDescription}>{goal.description}</Text>
          )}
          
          {goal.target_date && (
            <Text style={styles.targetDate}>
              Target: {new Date(goal.target_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress</Text>
            <Text style={styles.progressStats}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
          </View>
          <View style={styles.progressVisualContainer}>
            {/* Circular Progress Ring */}
            <View style={styles.progressRingContainer}>
              <View style={styles.progressRingBackground} />
              <View style={[
                styles.progressRingFill,
                {
                  transform: [
                    { rotate: `${-90 + (progressPercentage * 3.6)}deg` }
                  ]
                }
              ]} />
              <View style={styles.progressRingCenter}>
                <Text style={styles.progressPercentageText}>
                  {Math.round(progressPercentage)}%
                </Text>
                <Text style={styles.progressCompleteText}>Complete</Text>
              </View>
            </View>
            
            {/* Progress Stats */}
            <View style={styles.progressStatsContainer}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatNumber}>{totalTasks}</Text>
                <Text style={styles.progressStatLabel}>Total Tasks</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatNumber, { color: '#10B981' }]}>{completedTasks}</Text>
                <Text style={styles.progressStatLabel}>Completed</Text>
              </View>
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatNumber, { color: '#F59E0B' }]}>{totalTasks - completedTasks}</Text>
                <Text style={styles.progressStatLabel}>Remaining</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksHeader}>
            <Text style={styles.tasksTitle}>Tasks</Text>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => setShowAddTaskModal(true)}
            >
              <Text style={styles.addTaskButtonText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.length > 0 ? (
            <View style={styles.tasksList}>
              {tasks.map(renderTaskItem)}
            </View>
          ) : (
            <View style={styles.emptyTasks}>
              <Text style={styles.emptyTasksEmoji}>📝</Text>
              <Text style={styles.emptyTasksTitle}>No Tasks Yet</Text>
              <Text style={styles.emptyTasksSubtext}>
                Add tasks to break down your goal into actionable steps
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddTaskModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TouchableOpacity
              onPress={handleAddTask}
              style={[styles.modalSaveButton, savingTask && styles.modalSaveButtonDisabled]}
              disabled={savingTask}
            >
              <Text style={styles.modalSaveText}>
                {savingTask ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Task Title *</Text>
              <TextInput
                style={styles.modalInput}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="What needs to be done?"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                placeholder="Add more details..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  {formatDateDisplay(newTaskDate)}
                </Text>
                <Text style={styles.dateTimeButtonIcon}>📅</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeButtonText}>
                  {formatTimeDisplay(newTaskTime)}
                </Text>
                <Text style={styles.dateTimeButtonIcon}>🕐</Text>
              </TouchableOpacity>
              
              {/* Quick Time Presets */}
              <View style={styles.quickTimeContainer}>
                <Text style={styles.quickTimeLabel}>Quick times:</Text>
                <View style={styles.quickTimeButtons}>
                  <TouchableOpacity
                    style={styles.quickTimeButton}
                    onPress={() => setQuickTimeSlot(9, 0)}
                  >
                    <Text style={styles.quickTimeButtonText}>9 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickTimeButton}
                    onPress={() => setQuickTimeSlot(14, 0)}
                  >
                    <Text style={styles.quickTimeButtonText}>2 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickTimeButton}
                    onPress={() => setQuickTimeSlot(18, 0)}
                  >
                    <Text style={styles.quickTimeButtonText}>6 PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Temporarily hide recurring task options until migration is applied */}
            {false && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Recurring Task</Text>
                <TouchableOpacity
                  style={[styles.recurringToggle, isRecurring && styles.recurringToggleActive]}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <Text style={[styles.recurringToggleText, isRecurring && styles.recurringToggleTextActive]}>
                    {isRecurring ? 'Recurring Enabled' : 'Make Recurring'}
                  </Text>
                </TouchableOpacity>
                
                {isRecurring && (
                  <View style={styles.recurringOptions}>
                    <Text style={styles.recurringLabel}>Repeat every:</Text>
                    <View style={styles.recurringControls}>
                      <TextInput
                        style={styles.intervalInput}
                        value={recurrenceInterval.toString()}
                        onChangeText={(text) => setRecurrenceInterval(Math.max(1, parseInt(text) || 1))}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <View style={styles.recurrenceTypeGrid}>
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.recurrenceTypeItem,
                              recurrenceType === type && styles.recurrenceTypeItemActive
                            ]}
                            onPress={() => setRecurrenceType(type)}
                          >
                            <Text style={[
                              styles.recurrenceTypeText,
                              recurrenceType === type && styles.recurrenceTypeTextActive
                            ]}>
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Priority</Text>
              <View style={styles.priorityGrid}>
                {(['high', 'medium', 'low'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityItem,
                      newTaskPriority === priority && styles.priorityItemActive,
                      { borderColor: getPriorityColor(priority) }
                    ]}
                    onPress={() => setNewTaskPriority(priority)}
                  >
                    <Text style={[
                      styles.priorityItemText,
                      newTaskPriority === priority && styles.priorityItemTextActive
                    ]}>
                      {priority.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        visible={showTaskDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowTaskDetailModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Task Details</Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedTask) {
                  toggleTaskCompletion(selectedTask)
                  setShowTaskDetailModal(false)
                }
              }}
              style={styles.modalActionButton}
            >
              <Text style={styles.modalActionText}>
                {selectedTask?.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {selectedTask && (
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.taskDetailContainer}>
                <Text style={styles.taskDetailTitle}>{selectedTask.title}</Text>
                
                <View style={styles.taskDetailMeta}>
                  <Text style={styles.taskDetailLabel}>Date & Time:</Text>
                  <Text style={styles.taskDetailValue}>
                    {formatDate(selectedTask.schedule_date)} at {formatTime(selectedTask.schedule_time)}
                  </Text>
                </View>
                
                <View style={styles.taskDetailMeta}>
                  <Text style={styles.taskDetailLabel}>Priority:</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(selectedTask.priority) }
                  ]}>
                    <Text style={styles.priorityText}>
                      {selectedTask.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                {selectedTask.description && (
                  <View style={styles.taskDetailMeta}>
                    <Text style={styles.taskDetailLabel}>Description:</Text>
                    <Text style={styles.taskDetailDescription}>
                      {selectedTask.description}
                    </Text>
                  </View>
                )}
                
                <View style={styles.taskDetailMeta}>
                  <Text style={styles.taskDetailLabel}>Status:</Text>
                  <Text style={[
                    styles.taskDetailValue,
                    { color: selectedTask.completed ? '#10B981' : '#F59E0B' }
                  ]}>
                    {selectedTask.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={newTaskDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={newTaskTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.navIconContainer}>
            <View style={styles.homeIcon}>
              <View style={styles.homeIconRoof} />
              <View style={styles.homeIconBody} />
            </View>
          </View>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={() => navigation.navigate('Goals')}>
          <View style={styles.navIconContainer}>
            <View style={styles.goalsIconActive}>
              <View style={styles.goalsFlagPoleActive} />
              <View style={styles.goalsFlagBodyActive} />
            </View>
          </View>
          <Text style={styles.navLabelActive}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
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
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feedback')}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 28,
    color: '#7C3AED',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  goalHeader: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  goalTitleText: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  goalDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  targetDate: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  progressSection: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressStats: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressVisualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Circular Progress Ring
  progressRingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#E5E7EB',
    position: 'absolute',
  },
  progressRingFill: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#7C3AED',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    transformOrigin: 'center',
  },
  progressRingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
  },
  progressCompleteText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Progress Stats
  progressStatsContainer: {
    flex: 1,
    paddingLeft: 24,
  },
  progressStatItem: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tasksSection: {
    padding: 20,
    paddingBottom: 120, // Extra padding for bottom navigation
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addTaskButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  taskItemCompleted: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7C3AED',
    opacity: 0.8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    textDecorationLine: 'line-through',
  },
  deleteTaskButton: {
    padding: 4,
  },
  deleteTaskText: {
    fontSize: 20,
    color: '#EF4444',
    fontWeight: '300',
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalSaveButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalTextArea: {
    height: 80,
    paddingTop: 12,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  priorityItemActive: {
    backgroundColor: '#F0F9FF',
  },
  priorityItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  priorityItemTextActive: {
    color: '#1F2937',
  },
  
  // Date/Time Picker Styles
  dateTimeButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dateTimeButtonIcon: {
    fontSize: 18,
  },
  
  // Quick Time Presets
  quickTimeContainer: {
    marginTop: 12,
  },
  quickTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickTimeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTimeButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickTimeButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  
  // Bottom Navigation Styles
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
  
  // Navigation Icon Styles (same as other screens)
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
  goalsIconActive: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 3,
    position: 'relative',
  },
  goalsFlagPoleActive: {
    width: 1.5,
    height: 18,
    backgroundColor: '#7C3AED',
    position: 'absolute',
    left: 4,
  },
  goalsFlagBodyActive: {
    width: 12,
    height: 8,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderLeftWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 5.5,
    top: 3,
  },
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
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
    position: 'absolute',
    top: 4,
  },
  scheduleCalendarTop: {
    width: 20,
    height: 3,
    backgroundColor: '#9CA3AF',
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

  // Task Detail Modal Styles
  modalActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  modalActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  taskDetailContainer: {
    padding: 20,
  },
  taskDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  taskDetailMeta: {
    marginBottom: 16,
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  taskDetailValue: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  taskDetailDescription: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
})
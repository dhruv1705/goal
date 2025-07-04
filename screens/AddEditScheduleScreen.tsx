import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native'
import { useTheme } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'

type Schedule = Tables<'schedules'>

interface AddEditScheduleScreenProps {
  navigation: any
  route: {
    params?: {
      schedule?: Schedule
    }
  }
}

export const AddEditScheduleScreen: React.FC<AddEditScheduleScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme()
  const { user } = useAuth()
  const schedule = route.params?.schedule
  const isEditing = !!schedule

  const [title, setTitle] = useState(schedule?.title || '')
  const [description, setDescription] = useState(schedule?.description || '')
  const [date, setDate] = useState(
    schedule?.schedule_date ? new Date(schedule.schedule_date) : new Date()
  )
  const [time, setTime] = useState(
    schedule?.schedule_time
      ? (() => {
          const [hours, minutes] = schedule.schedule_time.split(':')
          const timeDate = new Date()
          timeDate.setHours(parseInt(hours), parseInt(minutes))
          return timeDate
        })()
      : new Date()
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Recurring task state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null)
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false)
  
  // Advanced recurring options
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])
  const [customMonthDay, setCustomMonthDay] = useState<number>(1)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // Initialize advanced options based on selected date
  useEffect(() => {
    if (isRecurring) {
      // Set default weekday based on selected date
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const selectedWeekday = weekdays[date.getDay()]
      if (recurrenceType === 'weekly' && !selectedWeekdays.includes(selectedWeekday)) {
        setSelectedWeekdays([selectedWeekday])
      }
      
      // Set default month day based on selected date
      if (recurrenceType === 'monthly') {
        setCustomMonthDay(date.getDate())
      }
      
      // Show advanced options for weekly and monthly
      setShowAdvancedOptions(recurrenceType === 'weekly' || recurrenceType === 'monthly')
    } else {
      setShowAdvancedOptions(false)
    }
  }, [isRecurring, recurrenceType, date])

  const generateRecurringTasks = (baseDate: Date, endDate: Date | null, type: string, interval: number) => {
    const tasks = []
    const maxDate = endDate || new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000) // Default: 1 year
    
    if (type === 'weekly' && selectedWeekdays.length > 0) {
      // Generate tasks for specific weekdays
      return generateWeeklyTasks(baseDate, maxDate, selectedWeekdays)
    } else if (type === 'monthly') {
      // Generate tasks for specific day of month
      return generateMonthlyTasks(baseDate, maxDate, customMonthDay)
    } else {
      // Original simple recurring logic for daily/yearly
      const currentDate = new Date(baseDate)
      while (currentDate <= maxDate && tasks.length < 52) {
        tasks.push(currentDate.toISOString().split('T')[0])
        
        switch (type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval)
            break
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + interval)
            break
        }
      }
    }
    
    return tasks
  }

  const generateWeeklyTasks = (startDate: Date, endDate: Date, weekdays: string[]) => {
    const tasks = []
    const weekdayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    }
    
    // Start from the beginning of the week containing startDate
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Go to Sunday
    
    while (currentDate <= endDate && tasks.length < 100) { // Max 100 for multiple days
      // Check each day of the week
      for (const weekday of weekdays) {
        const dayOfWeek = weekdayMap[weekday as keyof typeof weekdayMap]
        const taskDate = new Date(currentDate)
        taskDate.setDate(currentDate.getDate() + dayOfWeek)
        
        // Only add if within range and not before start date
        if (taskDate >= startDate && taskDate <= endDate) {
          tasks.push(taskDate.toISOString().split('T')[0])
        }
      }
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7)
    }
    
    return tasks.sort() // Sort chronologically
  }

  const generateMonthlyTasks = (startDate: Date, endDate: Date, dayOfMonth: number) => {
    const tasks = []
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), dayOfMonth)
    
    // If the custom day is before the start date in the first month, move to next month
    if (currentDate < startDate) {
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    while (currentDate <= endDate && tasks.length < 52) {
      // Handle months that don't have the specified day (e.g., Feb 31st)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
      const actualDay = Math.min(dayOfMonth, lastDayOfMonth)
      
      const taskDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), actualDay)
      if (taskDate >= startDate && taskDate <= endDate) {
        tasks.push(taskDate.toISOString().split('T')[0])
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return tasks
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    // Validate recurring settings
    if (isRecurring && !recurrenceEndDate) {
      Alert.alert('Error', 'Please select an end date for recurring task')
      return
    }
    
    if (isRecurring && recurrenceType === 'weekly' && selectedWeekdays.length === 0) {
      Alert.alert('Error', 'Please select at least one day of the week')
      return
    }

    setLoading(true)

    try {
      const baseScheduleData = {
        title: title.trim(),
        description: description.trim() || null,
        schedule_date: date.toISOString().split('T')[0],
        schedule_time: time.toTimeString().split(' ')[0].substring(0, 5),
        user_id: user.id,
      }

      if (isEditing) {
        // For editing, we don't change recurring settings
        const { error } = await supabase
          .from('schedules')
          .update(baseScheduleData)
          .eq('id', schedule.id)

        if (error) throw error
        Alert.alert('Success', 'Schedule updated successfully')
      } else {
        // For new schedules, handle recurring or single task
        if (isRecurring) {
          // Generate recurring task dates
          const recurringDates = generateRecurringTasks(
            date,
            recurrenceEndDate,
            recurrenceType,
            recurrenceInterval
          )

          // Determine recurrence pattern and additional data
          let recurrencePattern = 'simple'
          let recurrenceDaysOfWeek = null
          let recurrenceDayOfMonth = null
          
          if (recurrenceType === 'weekly' && selectedWeekdays.length > 0) {
            recurrencePattern = 'days_of_week'
            recurrenceDaysOfWeek = selectedWeekdays
          } else if (recurrenceType === 'monthly') {
            recurrencePattern = 'day_of_month'
            recurrenceDayOfMonth = customMonthDay
          }

          // Create tasks for each date
          const tasksToInsert = recurringDates.map(scheduleDate => ({
            ...baseScheduleData,
            schedule_date: scheduleDate,
            is_recurring: true,
            recurrence_type: recurrenceType,
            recurrence_interval: recurrenceInterval,
            recurrence_end_date: recurrenceEndDate?.toISOString() || null,
            recurrence_pattern: recurrencePattern,
            recurrence_days_of_week: recurrenceDaysOfWeek,
            recurrence_day_of_month: recurrenceDayOfMonth,
          }))

          const { error } = await supabase
            .from('schedules')
            .insert(tasksToInsert)

          if (error) throw error
          
          // Create detailed success message
          let successMessage = `Created ${recurringDates.length} recurring tasks!`
          if (recurrenceType === 'weekly' && selectedWeekdays.length > 0) {
            const dayNames = selectedWeekdays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
            successMessage += `\n\nRepeating every: ${dayNames}`
          } else if (recurrenceType === 'monthly') {
            const dayOrdinal = customMonthDay === 1 ? '1st' : customMonthDay === 2 ? '2nd' : customMonthDay === 3 ? '3rd' : `${customMonthDay}th`
            successMessage += `\n\nRepeating on the ${dayOrdinal} of every month`
          }
          
          Alert.alert('Success! 🎉', successMessage)
        } else {
          // Single task
          const { error } = await supabase
            .from('schedules')
            .insert([baseScheduleData])

          if (error) throw error
          Alert.alert('Success', 'Schedule added successfully')
        }
      }

      navigation.goBack()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule) return

    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', schedule.id)

              if (error) throw error
              Alert.alert('Success', 'Schedule deleted successfully')
              navigation.goBack()
            } catch (error: any) {
              Alert.alert('Error', error.message)
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios')
    if (selectedTime) {
      setTime(selectedTime)
    }
  }

  const onRecurrenceEndDateChange = (event: any, selectedDate?: Date) => {
    setShowRecurrenceEndDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setRecurrenceEndDate(selectedDate)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButton, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Schedule' : 'Add Schedule'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[
            styles.saveButton, 
            { color: colors.primary },
            loading && { color: colors.text + '50' }
          ]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card, 
            borderColor: colors.border, 
            color: colors.text 
          }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter schedule title"
          placeholderTextColor={colors.text + '80'}
          multiline={false}
        />

        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, { 
            backgroundColor: colors.card, 
            borderColor: colors.border, 
            color: colors.text 
          }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description (optional)"
          placeholderTextColor={colors.text + '80'}
          multiline={true}
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: colors.text }]}>Date</Text>
        <TouchableOpacity
          style={[styles.dateTimeButton, { 
            backgroundColor: colors.card, 
            borderColor: colors.border 
          }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateTimeText, { color: colors.text }]}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.text }]}>Time</Text>
        <TouchableOpacity
          style={[styles.dateTimeButton, { 
            backgroundColor: colors.card, 
            borderColor: colors.border 
          }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={[styles.dateTimeText, { color: colors.text }]}>
            {time.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>

        {/* Recurring Task Section - Only show for new tasks */}
        {!isEditing && (
          <View style={styles.recurringSection}>
            <Text style={[styles.label, { color: colors.text }]}>Recurring Task</Text>
            <TouchableOpacity
              style={[styles.recurringToggle, { 
                backgroundColor: isRecurring ? colors.primary : colors.card, 
                borderColor: colors.border 
              }]}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <Text style={[styles.recurringToggleText, { 
                color: isRecurring ? '#fff' : colors.text 
              }]}>
                {isRecurring ? 'Recurring Enabled' : 'Make Recurring'}
              </Text>
            </TouchableOpacity>
            
            {isRecurring && (
              <View style={styles.recurringOptions}>
                <Text style={[styles.recurringLabel, { color: colors.text }]}>Repeat every:</Text>
                <View style={styles.recurrenceTypeGrid}>
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.recurrenceTypeItem,
                        { 
                          backgroundColor: recurrenceType === type ? colors.primary : colors.card,
                          borderColor: colors.border
                        }
                      ]}
                      onPress={() => setRecurrenceType(type)}
                    >
                      <Text style={[
                        styles.recurrenceTypeText,
                        { 
                          color: recurrenceType === type ? '#fff' : colors.text
                        }
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Advanced Options */}
                {showAdvancedOptions && (
                  <View style={styles.advancedOptions}>
                    {recurrenceType === 'weekly' && (
                      <View style={styles.weekdaySelection}>
                        <Text style={[styles.recurringLabel, { color: colors.text }]}>Days of the week:</Text>
                        <View style={styles.weekdayGrid}>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const dayKey = day.toLowerCase()
                            const isSelected = selectedWeekdays.includes(dayKey)
                            return (
                              <TouchableOpacity
                                key={day}
                                style={[
                                  styles.weekdayButton,
                                  { 
                                    backgroundColor: isSelected ? colors.primary : colors.card,
                                    borderColor: colors.border
                                  }
                                ]}
                                onPress={() => {
                                  if (isSelected) {
                                    setSelectedWeekdays(selectedWeekdays.filter(d => d !== dayKey))
                                  } else {
                                    setSelectedWeekdays([...selectedWeekdays, dayKey])
                                  }
                                }}
                              >
                                <Text style={[
                                  styles.weekdayButtonText,
                                  { color: isSelected ? '#fff' : colors.text }
                                ]}>
                                  {day.slice(0, 3)}
                                </Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                        <Text style={[styles.selectionPreview, { color: colors.text }]}>
                          {selectedWeekdays.length > 0 
                            ? `Selected: Every ${selectedWeekdays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
                            : 'No days selected'
                          }
                        </Text>
                      </View>
                    )}
                    
                    {recurrenceType === 'monthly' && (
                      <View style={styles.monthlySelection}>
                        <Text style={[styles.recurringLabel, { color: colors.text }]}>Day of the month:</Text>
                        <View style={styles.monthDayPicker}>
                          <TouchableOpacity
                            style={[styles.monthDayButton, { borderColor: colors.border }]}
                            onPress={() => setCustomMonthDay(Math.max(1, customMonthDay - 1))}
                          >
                            <Text style={[styles.monthDayButtonText, { color: colors.text }]}>-</Text>
                          </TouchableOpacity>
                          
                          <View style={[styles.monthDayDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.monthDayText, { color: colors.text }]}>{customMonthDay}</Text>
                          </View>
                          
                          <TouchableOpacity
                            style={[styles.monthDayButton, { borderColor: colors.border }]}
                            onPress={() => setCustomMonthDay(Math.min(31, customMonthDay + 1))}
                          >
                            <Text style={[styles.monthDayButtonText, { color: colors.text }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.selectionPreview, { color: colors.text }]}>
                          {customMonthDay === 31 
                            ? "31st of every month (or last day if month has fewer days)"
                            : `${customMonthDay}${customMonthDay === 1 ? 'st' : customMonthDay === 2 ? 'nd' : customMonthDay === 3 ? 'rd' : 'th'} of every month`
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                <Text style={[styles.recurringLabel, { color: colors.text }]}>End Date *</Text>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border 
                  }]}
                  onPress={() => setShowRecurrenceEndDatePicker(true)}
                >
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {recurrenceEndDate ? recurrenceEndDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) : 'Select end date'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete Schedule</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      {showRecurrenceEndDatePicker && (
        <DateTimePicker
          value={recurrenceEndDate || new Date()}
          mode="date"
          display="default"
          onChange={onRecurrenceEndDateChange}
          minimumDate={new Date()} // Can't select past dates
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    color: '#7C3AED',
    fontSize: 16,
  },
  saveButton: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  dateTimeText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recurringSection: {
    marginTop: 16,
  },
  recurringToggle: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  recurringOptions: {
    marginTop: 8,
  },
  recurringLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  recurrenceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  recurrenceTypeItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  recurrenceTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  advancedOptions: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  weekdaySelection: {
    marginBottom: 16,
  },
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  weekdayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  weekdayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthlySelection: {
    marginBottom: 16,
  },
  monthDayPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  monthDayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  monthDayButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthDayDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  monthDayText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionPreview: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
    textAlign: 'center',
  },
})
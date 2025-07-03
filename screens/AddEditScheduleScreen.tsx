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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setLoading(true)

    try {
      const scheduleData = {
        title: title.trim(),
        description: description.trim() || null,
        schedule_date: date.toISOString().split('T')[0],
        schedule_time: time.toTimeString().split(' ')[0].substring(0, 5),
        user_id: user.id,
      }

      if (isEditing) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', schedule.id)

        if (error) throw error
        Alert.alert('Success', 'Schedule updated successfully')
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([scheduleData])

        if (error) throw error
        Alert.alert('Success', 'Schedule added successfully')
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
    fontSize: 16,
  },
  saveButton: {
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
})
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native'
import { useTheme } from '@react-navigation/native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'

type Goal = Tables<'goals'>

interface AddEditGoalScreenProps {
  navigation: any
  route?: {
    params?: {
      goal?: Goal
    }
  }
}

const categories = ['Physical Health', 'Mental Health', 'Finance', 'Social']

export const AddEditGoalScreen: React.FC<AddEditGoalScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { primaryCategory, getOrderedCategories } = usePreferences()
  const goal = route?.params?.goal
  const isEditing = !!goal

  const getDefaultCategory = () => {
    if (goal?.category) return goal.category 
    if (primaryCategory) return primaryCategory 
    return 'Physical Health' 
  }

  useEffect(() => {
    console.log('AddEditGoalScreen - User info:', {
      userId: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user,
      primaryCategory,
      defaultCategory: getDefaultCategory()
    })
  }, [user, primaryCategory])

  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [category, setCategory] = useState(getDefaultCategory())
  const [targetDate, setTargetDate] = useState(goal?.target_date ? new Date(goal.target_date) : null)
  const [status, setStatus] = useState(goal?.status || 'active')
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title')
      return
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please sign out and sign in again.')
      return
    }

    setLoading(true)
    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        target_date: targetDate ? targetDate.toISOString() : null,
        status: status as 'active' | 'completed' | 'paused',
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      console.log('Saving goal with data:', goalData)

      if (isEditing) {
        const { data, error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goal.id)
          .select()

        if (error) {
          console.error('Update error:', error)
          throw error
        }
        
        navigation.navigate('Goals', { 
          refresh: Date.now(),
          updatedGoal: data[0] 
        })
      } else {
        const { data, error } = await supabase
          .from('goals')
          .insert([{
            ...goalData,
            created_at: new Date().toISOString(),
          }])
          .select()

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
        
        navigation.navigate('Goals', { 
          refresh: Date.now(),
          newGoal: data[0] 
        })
      }
    } catch (error: any) {
      console.error('Save goal error:', error)
      const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error occurred'
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} goal: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing) return

    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This will also remove all associated tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              await supabase
                .from('schedules')
                .delete()
                .eq('goal_id', goal.id)

              const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goal.id)

              if (error) throw error
              
              Alert.alert('Success', 'Goal deleted successfully!')
              navigation.goBack()
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete goal')
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setTargetDate(selectedDate)
    }
  }

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return 'Select target date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#ffffff' ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Goal' : 'New Goal'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Goal Title */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Goal Title *</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              color: colors.text 
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you want to achieve?"
            placeholderTextColor={colors.text + '80'}
            maxLength={100}
          />
        </View>

        {/* Goal Description */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { 
              backgroundColor: colors.card, 
              borderColor: colors.border, 
              color: colors.text 
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your goal in detail..."
            placeholderTextColor={colors.text + '80'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Category Selection */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>
            Category
            {primaryCategory && (
              <Text style={[styles.labelHint, { color: colors.text + '80' }]}> (Default: {primaryCategory})</Text>
            )}
          </Text>
          <View style={styles.categoryGrid}>
            {getOrderedCategories().map((categoryInfo) => (
              <TouchableOpacity
                key={categoryInfo.category}
                style={[
                  styles.categoryItem,
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border 
                  },
                  category === categoryInfo.category && { backgroundColor: colors.primary, borderColor: colors.primary },
                  categoryInfo.is_primary && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.card }
                ]}
                onPress={() => setCategory(categoryInfo.category)}
              >
                {getCategoryIcon(categoryInfo.category)}
                <Text style={[
                  styles.categoryText,
                  { color: colors.text },
                  category === categoryInfo.category && { color: 'white', fontWeight: '600' },
                  categoryInfo.is_primary && { color: colors.primary, fontWeight: '600' }
                ]}>
                  {categoryInfo.category}
                  {categoryInfo.is_primary && ' ⭐'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Date */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>Target Date (Optional)</Text>
          <TouchableOpacity
            style={[styles.dateButton, { 
              backgroundColor: colors.card, 
              borderColor: colors.border 
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[
              styles.dateButtonText,
              { color: colors.text },
              !targetDate && { color: colors.text + '80' }
            ]}>
              {formatDateDisplay(targetDate)}
            </Text>
            <View style={styles.datePickerIcon}>
              <View style={styles.calendarIcon}>
                <View style={[styles.calendarTop, { backgroundColor: colors.primary }]} />
                <View style={[styles.calendarBody, { borderColor: colors.primary }]} />
                <View style={styles.calendarGrid}>
                  <View style={[styles.calendarDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.calendarDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.calendarDot, { backgroundColor: colors.primary }]} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          {targetDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setTargetDate(null)}
            >
              <Text style={styles.clearDateText}>Clear Date</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status (only for editing) */}
        {isEditing && (
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <View style={styles.statusGrid}>
              {(['active', 'paused', 'completed'] as const).map((stat) => (
                <TouchableOpacity
                  key={stat}
                  style={[
                    styles.statusItem,
                    { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border 
                    },
                    status === stat && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setStatus(stat)}
                >
                  <Text style={[
                    styles.statusText,
                    { color: colors.text },
                    status === stat && { color: 'white', fontWeight: '600' }
                  ]}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              loading && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Goal' : 'Create Goal')}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Delete Goal</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={targetDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    width: 44,
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  dateButtonIcon: {
    fontSize: 18,
  },
  clearDateButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 6,
    minWidth: 100,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelHint: {
    fontSize: 12,
    fontWeight: '400',
  },
  statusGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  statusItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  bottomPadding: {
    height: 40,
  },

  // Category Icon Styles
  categoryIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  // Health Icon - Heart
  healthIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  healthIconHeart: {
    width: 12,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
    top: 2,
    left: 2,
  },
  healthIconPulse: {
    width: 4,
    height: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    position: 'absolute',
    top: 1,
    right: 3,
  },

  // Career Icon - Briefcase
  careerIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  careerIconBag: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
  },
  careerIconHandle: {
    width: 6,
    height: 3,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 2,
    left: 4,
  },

  // Personal Icon - Star
  personalIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  personalIconStar: {
    width: 14,
    height: 14,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 1,
    left: 1,
  },
  personalIconCenter: {
    width: 6,
    height: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 3,
    position: 'absolute',
    top: 5,
    left: 5,
  },

  // Learning Icon - Book
  learningIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  learningIconBook: {
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 1,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 2,
    top: 1,
  },
  learningIconPages: {
    width: 8,
    height: 1,
    backgroundColor: '#10B981',
    position: 'absolute',
    top: 6,
    left: 4,
  },

  // Finance Icon - Dollar
  financeIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  financeIconCircle: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: 7,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  financeIconDollar: {
    width: 1.5,
    height: 8,
    backgroundColor: '#8B5CF6',
    position: 'absolute',
    top: 4,
    left: 7.25,
  },

  // Other Icon - Target
  otherIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  otherIconTarget: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    borderRadius: 7,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  otherIconCenter: {
    width: 4,
    height: 4,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    position: 'absolute',
    top: 6,
    left: 6,
  },

  // Date Picker Icon Styles
  datePickerIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  calendarTop: {
    width: 16,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    top: 0,
  },
  calendarBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderRadius: 2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 3,
  },
  calendarGrid: {
    width: 12,
    height: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 6,
    left: 2,
  },
  calendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },

  physicalHealthIcon: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dumbbellWeight: {
    width: 4,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 1,
  },
  dumbbellBar: {
    width: 6,
    height: 1.5,
    backgroundColor: '#FF6B6B',
    marginHorizontal: 0.5,
  },

  mentalHealthIcon: {
    width: 16,
    height: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainShape: {
    width: 12,
    height: 10,
    backgroundColor: '#4ECDC4',
    borderRadius: 6,
  },
  brainDetail: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 6,
    height: 4,
    backgroundColor: '#FFF',
    borderRadius: 2,
  },

  coinOuter: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#45B7D1',
    borderRadius: 7,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  coinText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#45B7D1',
    position: 'absolute',
  },

  // Social Icon - People
  socialIcon: {
    width: 16,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: {
    width: 6,
    height: 6,
    backgroundColor: '#96CEB4',
    borderRadius: 3,
  },

  // Default Icon
  defaultIcon: {
    width: 16,
    height: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconCircle: {
    width: 8,
    height: 8,
    backgroundColor: '#6B7280',
    borderRadius: 4,
  },
})
import React, { useState, useEffect, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import IMAGES from '../assets'
import { AppContext } from '../theme/AppContext'

interface FeedbackScreenProps {
  navigation: any
}

const feedbackTypes = [
  { id: 'bug', label: 'Bug Report', description: 'Technical issues, crashes, errors' },
  { id: 'feature', label: 'Feature Request', description: 'New functionality suggestions' },
  { id: 'app', label: 'App Feedback', description: 'Experience, usability, design' },
  { id: 'content', label: 'Content Suggestion', description: 'Goals, categories, templates' },
  { id: 'other', label: 'Other', description: 'Anything else' },
]

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { isDarkTheme } = useContext(AppContext)
  const { colors } = useTheme()
  const [selectedType, setSelectedType] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [rating, setRating] = useState(0)
  const [wantsResponse, setWantsResponse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const subjectCharLimit = 60
  const descriptionCharLimit = 500

  const isFormValid = selectedType && subject.trim() && description.trim()

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Missing Information', 'Please fill in all required fields.')
      return
    }

    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to send feedback.')
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: user.id,
            feedback_type: selectedType,
            subject: subject.trim(),
            description: description.trim(),
            rating: rating > 0 ? rating : null,
            wants_response: wantsResponse
          }
        ])

      if (error) {
        throw error
      }

      showSuccessMessage()
      resetForm()
      fetchFeedbackHistory() 
    } catch (error) {
      console.error('Error submitting feedback:', error)
      Alert.alert(
        'Submission Failed',
        'We couldn\'t send your feedback right now. Please check your internet connection and try again.',
        [
          { text: 'OK', style: 'default' }
        ]
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedbackHistory = async () => {
    if (!user) return

    try {
      setLoadingHistory(true)
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setFeedbackHistory(data || [])
    } catch (error) {
      console.error('Error fetching feedback history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchFeedbackHistory()
    setRefreshing(false)
  }

  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchFeedbackHistory()
    }
  }, [user, activeTab])

  const handleNavigation = (screenName: string) => {
    if (loading) {
      Alert.alert('Sending Feedback', 'Please wait while we send your feedback.')
      return
    }

    const hasUnsavedChanges = selectedType || subject.trim() || description.trim() || rating > 0
    if (hasUnsavedChanges && !showSuccess) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved feedback. Discard changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.navigate(screenName)
          }
        ]
      )
    } else {
      navigation.navigate(screenName)
    }
  }

  const showSuccessMessage = () => {
    setShowSuccess(true)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSuccess(false)
      })
    }, 3000)
  }

  const resetForm = () => {
    setSelectedType('')
    setSubject('')
    setDescription('')
    setRating(0)
    setWantsResponse(false)
  }

  const getFeedbackTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'bug':
        return (
          <View style={styles.feedbackIconContainer}>
            <View style={styles.bugIcon}>
              <View style={styles.bugBody} />
              <View style={styles.bugHead} />
              <View style={styles.bugAntenna1} />
              <View style={styles.bugAntenna2} />
            </View>
          </View>
        )
      case 'feature':
        return (
          <View style={styles.feedbackIconContainer}>
            <View style={styles.featureIcon}>
              <View style={styles.featureBulb} />
              <View style={styles.featureBase} />
              <View style={styles.featureGlow} />
            </View>
          </View>
        )
      case 'app':
        return (
          <View style={styles.feedbackIconContainer}>
            <View style={styles.appIcon}>
              <View style={styles.appBubble} />
              <View style={styles.appTail} />
              <View style={styles.appDots}>
                <View style={styles.appDot} />
                <View style={styles.appDot} />
                <View style={styles.appDot} />
              </View>
            </View>
          </View>
        )
      case 'content':
        return (
          <View style={styles.feedbackIconContainer}>
            <View style={styles.contentIcon}>
              <View style={styles.contentPaper} />
              <View style={styles.contentLine1} />
              <View style={styles.contentLine2} />
              <View style={styles.contentLine3} />
            </View>
          </View>
        )
      default:
        return (
          <View style={styles.feedbackIconContainer}>
            <View style={styles.otherIcon}>
              <View style={styles.otherCircle} />
              <View style={styles.otherCenter} />
              <View style={styles.otherRing} />
            </View>
          </View>
        )
    }
  }

  const renderStarRating = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <View style={styles.starIcon}>
              <View style={[
                styles.starShape,
                star <= rating && styles.starIconFilled
              ]} />
              <View style={[styles.starCenter, star <= rating && styles.starCenterFilled]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFeedbackTypeLabel = (type: string) => {
    const typeObj = feedbackTypes.find(t => t.id === type)
    return typeObj ? typeObj.label : type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'
      case 'reviewed': return '#3B82F6'
      case 'in_progress': return '#8B5CF6'
      case 'resolved': return '#10B981'
      case 'closed': return '#6B7280'
      default: return '#9CA3AF'
    }
  }

  const renderFeedbackItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <View style={styles.historyTypeContainer}>
          {getFeedbackTypeIcon(item.feedback_type)}
          <Text style={styles.historyType}>{getFeedbackTypeLabel(item.feedback_type)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.historySubject}>{item.subject}</Text>
      <Text style={styles.historyDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.rating && (
        <View style={styles.historyRating}>
          <Text style={styles.historyRatingText}>Rating: </Text>
          {[...Array(item.rating)].map((_, i) => (
            <View key={i} style={styles.historyStar}>
              <View style={[styles.starShape, styles.starIconFilled]} />
            </View>
          ))}
        </View>
      )}
      <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
    </View>
  )

  const styles = getStyles(colors)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Success Overlay */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <View style={styles.checkmark} />
            </View>
            <Text style={styles.successTitle}>Feedback Sent!</Text>
            <Text style={styles.successMessage}>Thank you for helping us improve.</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'new' && styles.activeTab]} onPress={() => setActiveTab('new')}>
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>New Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>My History</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'new' ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            What type of feedback? <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeGrid}>
            {feedbackTypes.map((type) => (
              <TouchableOpacity key={type.id} style={[styles.typeItem,selectedType === type.id && styles.typeItemActive]} onPress={() => setSelectedType(type.id)}>
                {getFeedbackTypeIcon(type.id)}
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeLabel,selectedType === type.id && styles.typeLabelActive]}>
                    {type.label}
                  </Text>
                  <Text style={[styles.typeDescription,selectedType === type.id && styles.typeDescriptionActive]}>
                    {type.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Subject <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={styles.textInput} value={subject} onChangeText={setSubject} placeholder="What's this about?" placeholderTextColor="#9CA3AF" maxLength={subjectCharLimit}/>
          {subject.length > subjectCharLimit * 0.8 && (
            <Text style={styles.charCounter}>
              {subject.length}/{subjectCharLimit}
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput style={[styles.textInput, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Tell us more about your experience..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} textAlignVertical="top" maxLength={descriptionCharLimit}/>
          {description.length > descriptionCharLimit * 0.8 && (
            <Text style={styles.charCounter}>
              {description.length}/{descriptionCharLimit}
            </Text>
          )}
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>Rate your overall experience (optional)</Text>
          {renderStarRating()}
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && "😞 Poor"}
              {rating === 2 && "😕 Fair"}
              {rating === 3 && "😐 Good"}
              {rating === 4 && "😊 Very Good"}
              {rating === 5 && "🤩 Excellent"}
            </Text>
          )}
        </View>

        {/* Response Preference */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setWantsResponse(!wantsResponse)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>I'd like updates on this feedback</Text>
              {wantsResponse && user?.email && (
                <Text style={styles.toggleSubtext}>
                  We'll send updates to {user.email}
                </Text>
              )}
            </View>
            <View style={[styles.toggleSwitch, wantsResponse && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, wantsResponse && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            <Text style={[styles.submitButtonText, !isFormValid && styles.submitButtonTextDisabled]}>
              {loading ? 'Sending...' : 'Send Feedback'}
            </Text>
          </TouchableOpacity>

          {showSuccess && (
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={resetForm}
              >
                <Text style={styles.secondaryButtonText}>Send Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      ) : (
        <View style={styles.historyContainer}>
          {feedbackHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyIcon}>
                <View style={styles.emptyCircle} />
                <View style={styles.emptyDots}>
                  <View style={styles.emptyDot} />
                  <View style={styles.emptyDot} />
                  <View style={styles.emptyDot} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No Feedback Yet</Text>
              <Text style={styles.emptyDescription}>
                Your feedback history will appear here after you submit your first feedback.
              </Text>
            </View>
          ) : (
            <FlatList
              data={feedbackHistory}
              renderItem={renderFeedbackItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Home')}>
          <Image source={IMAGES.HOME} style={styles.navIcon} tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Goals')}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Schedule')}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavigation('Profile')}>
          <Image source={IMAGES.ACCOUNT} style={styles.navIcon} tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function getStyles(colors: any) {
  return StyleSheet.create({
    navIcon: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 15,
      backgroundColor: colors.card,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
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
      color: colors.text,
    },
    headerRight: {
      width: 44,
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: colors.card,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    required: {
      color: '#EF4444',
    },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      height: 100,
      paddingTop: 14,
    },
    charCounter: {
      fontSize: 12,
      color: '#9CA3AF',
      textAlign: 'right',
      marginTop: 8,
    },
    typeGrid: {
      gap: 12,
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
    },
    typeItemActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    typeLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    typeLabelActive: {
      color: 'white',
    },
    typeDescription: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
    },
    typeDescriptionActive: {
      color: '#E5E7EB',
    },
    starsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    starButton: {
      padding: 4,
      marginRight: 8,
    },
    starIcon: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    starShape: {
      width: 24,
      height: 24,
      backgroundColor: '#E5E7EB',
      transform: [{ rotate: '45deg' }],
      position: 'absolute',
    },
    starCenter: {
      width: 12,
      height: 12,
      backgroundColor: '#F9FAFB',
      borderRadius: 6,
      position: 'absolute',
    },
    starIconFilled: {
      backgroundColor: '#F59E0B',
    },
    starCenterFilled: {
      backgroundColor: '#FEF3C7',
    },
    ratingText: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 8,
      fontWeight: '500',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleInfo: {
      flex: 1,
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: '#374151',
    },
    toggleSubtext: {
      fontSize: 14,
      color: '#6B7280',
      marginTop: 4,
    },
    toggleSwitch: {
      width: 50,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    toggleSwitchActive: {
      backgroundColor: '#7C3AED',
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleThumbActive: {
      transform: [{ translateX: 20 }],
    },
    actionSection: {
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    submitButton: {
      backgroundColor: '#7C3AED',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#7C3AED',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    submitButtonDisabled: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    submitButtonTextDisabled: {
      color: '#D1D5DB',
    },
    successActions: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: '#F3F4F6',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#374151',
    },
    doneButton: {
      flex: 1,
      backgroundColor: '#10B981',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    bottomPadding: {
      height: 100,
    },
    successOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    successCard: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      marginHorizontal: 40,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    successIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#10B981',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkmark: {
      width: 24,
      height: 12,
      borderLeftWidth: 3,
      borderBottomWidth: 3,
      borderColor: 'white',
      transform: [{ rotate: '-45deg' }],
      marginTop: -4,
      marginLeft: 2,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: 8,
    },
    successMessage: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
    // Feedback Type Icons
    feedbackIconContainer: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Bug Icon
    bugIcon: {
      width: 20,
      height: 20,
      position: 'relative',
    },
    bugBody: {
      width: 14,
      height: 10,
      backgroundColor: '#EF4444',
      borderRadius: 7,
      position: 'absolute',
      bottom: 2,
      left: 3,
    },
    bugHead: {
      width: 8,
      height: 8,
      backgroundColor: '#EF4444',
      borderRadius: 4,
      position: 'absolute',
      top: 0,
      left: 6,
    },
    bugAntenna1: {
      width: 1,
      height: 4,
      backgroundColor: '#EF4444',
      position: 'absolute',
      top: -2,
      left: 8,
      transform: [{ rotate: '-20deg' }],
    },
    bugAntenna2: {
      width: 1,
      height: 4,
      backgroundColor: '#EF4444',
      position: 'absolute',
      top: -2,
      right: 8,
      transform: [{ rotate: '20deg' }],
    },
    // Feature Icon - Lightbulb
    featureIcon: {
      width: 20,
      height: 20,
      position: 'relative',
    },
    featureBulb: {
      width: 12,
      height: 12,
      backgroundColor: '#F59E0B',
      borderRadius: 6,
      position: 'absolute',
      top: 2,
      left: 4,
    },
    featureBase: {
      width: 8,
      height: 4,
      backgroundColor: '#F59E0B',
      borderRadius: 2,
      position: 'absolute',
      bottom: 2,
      left: 6,
    },
    featureGlow: {
      width: 4,
      height: 4,
      backgroundColor: '#FEF3C7',
      borderRadius: 2,
      position: 'absolute',
      top: 5,
      left: 8,
    },
    // App Icon - Speech Bubble
    appIcon: {
      width: 20,
      height: 20,
      position: 'relative',
    },
    appBubble: {
      width: 16,
      height: 12,
      backgroundColor: '#3B82F6',
      borderRadius: 8,
      position: 'absolute',
      top: 0,
      left: 2,
    },
    appTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderTopWidth: 4,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#3B82F6',
      position: 'absolute',
      bottom: 4,
      left: 6,
    },
    appDots: {
      flexDirection: 'row',
      position: 'absolute',
      top: 4,
      left: 6,
      gap: 2,
    },
    appDot: {
      width: 2,
      height: 2,
      backgroundColor: 'white',
      borderRadius: 1,
    },
    // Content Icon - Document
    contentIcon: {
      width: 20,
      height: 20,
      position: 'relative',
    },
    contentPaper: {
      width: 14,
      height: 18,
      backgroundColor: '#10B981',
      borderRadius: 2,
      position: 'absolute',
      top: 1,
      left: 3,
    },
    contentLine1: {
      width: 8,
      height: 1,
      backgroundColor: 'white',
      position: 'absolute',
      top: 5,
      left: 6,
    },
    contentLine2: {
      width: 8,
      height: 1,
      backgroundColor: 'white',
      position: 'absolute',
      top: 8,
      left: 6,
    },
    contentLine3: {
      width: 6,
      height: 1,
      backgroundColor: 'white',
      position: 'absolute',
      top: 11,
      left: 6,
    },
    // Other Icon - Target
    otherIcon: {
      width: 20,
      height: 20,
      position: 'relative',
    },
    otherCircle: {
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
    otherCenter: {
      width: 6,
      height: 6,
      backgroundColor: '#6B7280',
      borderRadius: 3,
      position: 'absolute',
      top: 7,
      left: 7,
    },
    otherRing: {
      width: 10,
      height: 10,
      borderWidth: 1,
      borderColor: '#6B7280',
      borderRadius: 5,
      backgroundColor: 'transparent',
      position: 'absolute',
      top: 5,
      left: 5,
    },
    // Bottom Navigation Styles
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
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
    // Navigation Icon Styles
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
    // Schedule Icon - Calendar
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
    // Feedback Icon - Speech Bubble (Active)
    feedbackIconNav: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    feedbackBubbleActive: {
      width: 18,
      height: 14,
      backgroundColor: '#7C3AED',
      borderRadius: 8,
      position: 'absolute',
      top: 2,
    },
    feedbackTailActive: {
      width: 0,
      height: 0,
      borderLeftWidth: 3,
      borderRightWidth: 3,
      borderTopWidth: 4,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#7C3AED',
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
    // Tab Navigation Styles
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      opacity: 0.5,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
      opacity: 1,
    },
    // History Styles
    historyContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    historyList: {
      padding: 16,
    },
    historyItem: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    historyTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    historyType: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
      textTransform: 'capitalize',
    },
    historySubject: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    historyDescription: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      lineHeight: 20,
      marginBottom: 8,
    },
    historyRating: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    historyRatingText: {
      fontSize: 12,
      color: '#6B7280',
      marginRight: 4,
    },
    historyStar: {
      width: 12,
      height: 12,
      marginRight: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    historyDate: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.5,
      fontWeight: '500',
    },
    // Empty History Styles
    emptyHistory: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      backgroundColor: colors.background,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      position: 'relative',
    },
    emptyCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      borderStyle: 'dashed',
    },
    emptyDots: {
      flexDirection: 'row',
      position: 'absolute',
      gap: 4,
    },
    emptyDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#9CA3AF',
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
      textAlign: 'center',
      lineHeight: 24,
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
}
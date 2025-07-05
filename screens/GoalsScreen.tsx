import React, { useState, useEffect } from 'react'
import { useFocusEffect, useTheme } from '@react-navigation/native'
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
  Image
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Tables } from '../types/supabase'
import IMAGES from '../assets'

type Goal = Tables<'goals'>

interface GoalsScreenProps {
  navigation: any
  route?: {
    params?: {
      refresh?: number
      newGoal?: Goal
      updatedGoal?: Goal
      categoryFilter?: string
    }
  }
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({ navigation, route }) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('active')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(route?.params?.categoryFilter || null)
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  useEffect(() => {
    fetchGoals()
  }, [activeFilter, categoryFilter])

  // Listen for navigation params to trigger refresh and handle optimistic updates
  useEffect(() => {
    if (route?.params?.refresh) {
      // Handle optimistic updates first for immediate UI response
      if (route.params?.newGoal) {
        setGoals(prevGoals => [route.params!.newGoal!, ...prevGoals])
      } else if (route.params?.updatedGoal) {
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal.id === route.params?.updatedGoal!.id ? route.params?.updatedGoal! : goal
          )
        )
      }
      
      // Then fetch from server to ensure consistency
      setTimeout(() => {
        fetchGoals()
      }, 100)
    }
    
    // Handle category filter changes
    if (route?.params?.categoryFilter !== undefined) {
      setCategoryFilter(route.params.categoryFilter)
    }
  }, [route?.params?.refresh, route?.params?.categoryFilter])

  // Refresh goals when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchGoals()
    }, [activeFilter])
  )

  const fetchGoals = async () => {
    try {
      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (activeFilter !== 'all') {
        query = query.eq('status', activeFilter)
      }

      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setGoals(data || [])
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchGoals()
    setRefreshing(false)
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'completed':
        return 'Completed'
      case 'paused':
        return 'Paused'
      default:
        return status
    }
  }

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'Health':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.healthIcon}>
              <View style={styles.healthIconHeart} />
              <View style={styles.healthIconPulse} />
            </View>
          </View>
        )
      case 'Career':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.careerIcon}>
              <View style={styles.careerIconBag} />
              <View style={styles.careerIconHandle} />
            </View>
          </View>
        )
      case 'Personal':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.personalIcon}>
              <View style={styles.personalIconStar} />
              <View style={styles.personalIconCenter} />
            </View>
          </View>
        )
      case 'Learning':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.learningIcon}>
              <View style={styles.learningIconBook} />
              <View style={styles.learningIconPages} />
            </View>
          </View>
        )
      case 'Finance':
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.financeIcon}>
              <View style={styles.financeIconCircle} />
              <View style={styles.financeIconDollar} />
            </View>
          </View>
        )
      default:
        return (
          <View style={styles.categoryIconContainer}>
            <View style={styles.otherIcon}>
              <View style={styles.otherIconTarget} />
              <View style={styles.otherIconCenter} />
            </View>
          </View>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderGoalItem = ({ item }: { item: Goal }) => (
    <TouchableOpacity
      style={[styles.goalItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate('GoalDetail', { goal: item })}
    >
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleContainer}>
          <View style={[styles.goalIconContainer, { backgroundColor: colors.card }]}>
            {getCategoryIcon(item.category)}
          </View>
          <View style={styles.goalTextContainer}>
            <Text style={[styles.goalTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.goalCategory, { color: colors.primary }]}>{item.category || 'General'}</Text>
            {item.target_date && (
              <Text style={[styles.goalTargetDate, { color: colors.text }]}>
                Target: {new Date(item.target_date).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.goalDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.goalFooter}>
        <View style={styles.goalFooterLeft}>
          <Text style={styles.goalDate}>
            Created {formatDate(item.created_at)}
          </Text>
          {item.target_date && (
            <Text style={styles.targetDate}>
              🎯 Target: {formatDate(item.target_date)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.goalActionButton}
          onPress={() => navigation.navigate('GoalDetail', { goal: item })}
        >
          <Text style={styles.goalActionText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🎯</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Goals Yet</Text>
      <Text style={[styles.emptySubtext, { color: colors.text }]}>
        Start by creating your first goal to organize your tasks and activities
      </Text>
      <TouchableOpacity
        style={[styles.createFirstGoalButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEditGoal')}
      >
        <Text style={styles.createFirstGoalText}>Create Your First Goal</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Goals</Text>
      </View>

      <ScrollView style={[styles.scrollContainer, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['active', 'all', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab, 
                { backgroundColor: colors.card, borderColor: colors.border },
                activeFilter === filter && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterText, 
                { color: colors.text },
                activeFilter === filter && { color: '#fff' }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
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

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {goals.length > 0 ? (
            goals.map((item) => (
              <View key={item.id}>
                {renderGoalItem({ item })}
              </View>
            ))
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddEditGoal')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor={colors.primary} />
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
          <Text style={[styles.navLabel, { color: colors.text }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Talk')}>
          <Image source={IMAGES.TALK} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  goalsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  goalItem: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
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
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  goalFooterLeft: {
    flex: 1,
  },
  goalDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  targetDate: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  goalActionButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  goalActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstGoalButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createFirstGoalText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  
  // Bottom Navigation Styles (copied from other screens)
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
  
  // Navigation Icon Styles
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
  
  // Goals Icon - Flag (Active)
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
    backgroundColor: '#7C3AED',
    position: 'absolute',
    left: 4,
  },
  goalsFlagBody: {
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

  // Category Icon Styles
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
  goalTargetDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.8,
  },
})
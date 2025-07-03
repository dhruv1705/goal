import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import IMAGES from '../assets'

const { width } = Dimensions.get('window')

interface CategoryData {
  name: string
  totalGoals: number
  activeGoals: number
  completedGoals: number
  totalSchedules: number
  completedSchedules: number
}

interface CategoriesScreenProps {
  navigation: any
}

const categories = [
  { name: 'Physical Health', color: '#FF6B6B', icon: '💪' },
  { name: 'Mental Health', color: '#4ECDC4', icon: '🧠' },
  { name: 'Finance', color: '#45B7D1', icon: '💰' },
  { name: 'Social', color: '#96CEB4', icon: '👥' },
]

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  useEffect(() => {
    fetchCategoryData()
  }, [])

  const fetchCategoryData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch goals data by category
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id, category, status')
        .eq('user_id', user.id)

      if (goalsError) {
        console.error('Error fetching goals:', goalsError)
        throw goalsError
      }

      // Fetch all schedules first
      const { data: allSchedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('completed, goal_id')
        .eq('user_id', user.id)

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError)
        throw schedulesError
      }

      // Process data for each category
      const processedData = categories.map(category => {
        // Goals stats
        const categoryGoals = goalsData?.filter(goal => goal.category === category.name) || []
        const totalGoals = categoryGoals.length
        const activeGoals = categoryGoals.filter(goal => goal.status === 'active').length
        const completedGoals = categoryGoals.filter(goal => goal.status === 'completed').length

        // Get goal IDs for this category
        const categoryGoalIds = categoryGoals.map(goal => goal.id)
        
        // Schedules stats - filter by goal IDs from this category
        const categorySchedules = allSchedules?.filter(
          schedule => schedule.goal_id && categoryGoalIds.includes(schedule.goal_id)
        ) || []
        const totalSchedules = categorySchedules.length
        const completedSchedules = categorySchedules.filter(schedule => schedule.completed).length

        return {
          name: category.name,
          totalGoals,
          activeGoals,
          completedGoals,
          totalSchedules,
          completedSchedules,
        }
      })

      setCategoryData(processedData)
    } catch (error) {
      console.error('Error fetching category data:', error)
      // Set empty data on error to prevent crashes
      setCategoryData(categories.map(category => ({
        name: category.name,
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        totalSchedules: 0,
        completedSchedules: 0,
      })))
    } finally {
      setLoading(false)
    }
  }

  const CategoryIcon = ({ categoryName }: { categoryName: string }) => {
    const getIconComponent = () => {
      switch (categoryName) {
        case 'Physical Health':
          return (
            <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B' }]}>
              <View style={styles.dumbbellIcon}>
                <View style={[styles.dumbbellWeight, { backgroundColor: '#FFF' }]} />
                <View style={[styles.dumbbellBar, { backgroundColor: '#FFF' }]} />
                <View style={[styles.dumbbellWeight, { backgroundColor: '#FFF' }]} />
              </View>
            </View>
          )
        case 'Mental Health':
          return (
            <View style={[styles.iconContainer, { backgroundColor: '#4ECDC4' }]}>
              <View style={styles.brainIcon}>
                <View style={[styles.brainShape, { backgroundColor: '#FFF' }]} />
                <View style={[styles.brainDetail, { backgroundColor: '#4ECDC4' }]} />
              </View>
            </View>
          )
        case 'Finance':
          return (
            <View style={[styles.iconContainer, { backgroundColor: '#45B7D1' }]}>
              <View style={styles.coinIcon}>
                <View style={[styles.coinOuter, { borderColor: '#FFF' }]} />
                <Text style={styles.coinText}>$</Text>
              </View>
            </View>
          )
        case 'Social':
          return (
            <View style={[styles.iconContainer, { backgroundColor: '#96CEB4' }]}>
              <View style={styles.peopleIcon}>
                <View style={[styles.person, { backgroundColor: '#FFF' }]} />
                <View style={[styles.person, { backgroundColor: '#FFF', marginLeft: -8 }]} />
              </View>
            </View>
          )
        default:
          return (
            <View style={[styles.iconContainer, { backgroundColor: '#7C3AED' }]}>
              <View style={[styles.defaultIcon, { backgroundColor: '#FFF' }]} />
            </View>
          )
      }
    }

    return getIconComponent()
  }

  const navigateToGoals = (category: string) => {
    navigation.navigate('Goals', { categoryFilter: category })
  }

  const navigateToSchedules = (category: string) => {
    navigation.navigate('Schedule', { categoryFilter: category })
  }

  const renderCategoryCard = (category: CategoryData, index: number) => {
    const categoryInfo = categories.find(cat => cat.name === category.name)
    const completionRate = category.totalGoals > 0 
      ? Math.round((category.completedGoals / category.totalGoals) * 100) 
      : 0

    return (
      <View key={category.name} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.categoryHeader}>
          <CategoryIcon categoryName={category.name} />
          <View style={styles.categoryTitleContainer}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.name}</Text>
            <Text style={[styles.completionRate, { color: colors.text }]}>{completionRate}% Complete</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigateToGoals(category.name)}
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{category.totalGoals}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Goals</Text>
            <Text style={[styles.statSubtext, { color: colors.text }]}>
              {category.activeGoals} active • {category.completedGoals} done
            </Text>
          </TouchableOpacity>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigateToSchedules(category.name)}
          >
            <Text style={[styles.statNumber, { color: colors.text }]}>{category.totalSchedules}</Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>Tasks</Text>
            <Text style={[styles.statSubtext, { color: colors.text }]}>
              {category.completedSchedules} completed
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${completionRate}%`,
                  backgroundColor: categoryInfo?.color || colors.primary
                }
              ]} 
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>Organize your goals and tasks</Text>
        </View>

        <ScrollView
          style={[styles.content, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>Loading categories...</Text>
            </View>
          ) : (
            categoryData.map((category, index) => renderCategoryCard(category, index))
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(8, insets.bottom) }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
            <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor={colors.primary} />
            <Text style={[styles.navLabelActive, { color: colors.primary }]}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
            <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
            <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <Image source={IMAGES.ACCOUNT} style={styles.navIcon} resizeMode="contain" tintColor={colors.text} />
            <Text style={[styles.navLabel, { color: colors.text }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'headerSubtitle',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  completionRate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Physical Health (Dumbbell) Icon
  dumbbellIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dumbbellWeight: {
    width: 8,
    height: 16,
    borderRadius: 2,
  },
  dumbbellBar: {
    width: 20,
    height: 3,
    marginHorizontal: 2,
  },
  // Mental Health (Brain) Icon
  brainIcon: {
    position: 'relative',
  },
  brainShape: {
    width: 24,
    height: 20,
    borderRadius: 12,
  },
  brainDetail: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  // Finance (Coin) Icon
  coinIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  // Social (People) Icon
  peopleIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  person: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Default Icon
  defaultIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
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

  // Profile Icon
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
})
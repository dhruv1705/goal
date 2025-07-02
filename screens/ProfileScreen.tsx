import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

interface ProfileScreenProps {
  navigation: any
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth()
  const insets = useSafeAreaInsets()

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out')
            }
          },
        },
      ]
    )
  }

  const menuItems = [
    {
      title: 'Account Settings',
      iconType: 'settings',
      onPress: () => Alert.alert('Coming Soon', 'Account settings will be available soon'),
    },
    {
      title: 'Notifications',
      iconType: 'notifications',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      title: 'Help & Support',
      iconType: 'help',
      onPress: () => Alert.alert('Coming Soon', 'Help & support will be available soon'),
    },
    {
      title: 'About',
      iconType: 'about',
      onPress: () => Alert.alert('About', 'Daily Schedule App v1.0'),
    },
  ]

  const renderMenuIcon = (iconType: string) => {
    switch (iconType) {
      case 'settings':
        return (
          <View style={styles.menuIconContainer}>
            <View style={styles.settingsIcon}>
              <View style={styles.settingsGear} />
              <View style={styles.settingsCenter} />
            </View>
          </View>
        )
      case 'notifications':
        return (
          <View style={styles.menuIconContainer}>
            <View style={styles.notificationsIcon}>
              <View style={styles.bellBody} />
              <View style={styles.bellTop} />
              <View style={styles.bellBottom} />
            </View>
          </View>
        )
      case 'help':
        return (
          <View style={styles.menuIconContainer}>
            <View style={styles.helpIcon}>
              <View style={styles.helpCircle} />
              <View style={styles.helpQuestion} />
            </View>
          </View>
        )
      case 'about':
        return (
          <View style={styles.menuIconContainer}>
            <View style={styles.aboutIcon}>
              <View style={styles.aboutCircle} />
              <View style={styles.aboutDot} />
              <View style={styles.aboutLine} />
            </View>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                {renderMenuIcon(item.iconType)}
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <View style={styles.navIconContainer}>
            <View style={styles.categoriesIcon}>
              <View style={styles.categoriesGrid}>
                <View style={[styles.categoriesSquare, { backgroundColor: '#FF6B6B' }]} />
                <View style={[styles.categoriesSquare, { backgroundColor: '#4ECDC4' }]} />
                <View style={[styles.categoriesSquare, { backgroundColor: '#45B7D1' }]} />
                <View style={[styles.categoriesSquare, { backgroundColor: '#96CEB4' }]} />
              </View>
            </View>
          </View>
          <Text style={styles.navLabel}>Categories</Text>
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
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.navIconContainer}>
            <View style={styles.profileIcon}>
              <View style={styles.profileHead} />
              <View style={styles.profileBody} />
            </View>
          </View>
          <Text style={styles.navLabelActive}>Profile</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  signOutSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 80, // Reduced padding for bottom nav
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  
  // Menu Icon Styles
  menuIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // Settings Icon - Gear
  settingsIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  settingsGear: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 8,
    position: 'absolute',
  },
  settingsCenter: {
    width: 6,
    height: 6,
    backgroundColor: '#6B7280',
    borderRadius: 3,
    position: 'absolute',
  },
  
  // Notifications Icon - Bell
  notificationsIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBody: {
    width: 14,
    height: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 7,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    position: 'absolute',
    top: 2,
  },
  bellTop: {
    width: 4,
    height: 3,
    backgroundColor: '#6B7280',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 8,
  },
  bellBottom: {
    width: 8,
    height: 2,
    backgroundColor: '#6B7280',
    borderRadius: 1,
    position: 'absolute',
    bottom: 2,
    left: 6,
  },
  
  // Help Icon - Question Mark
  helpIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  helpCircle: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 9,
    position: 'absolute',
  },
  helpQuestion: {
    width: 6,
    height: 8,
    backgroundColor: '#6B7280',
    borderRadius: 1,
    position: 'absolute',
  },
  
  // About Icon - Info
  aboutIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  aboutCircle: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 9,
    position: 'absolute',
  },
  aboutDot: {
    width: 3,
    height: 3,
    backgroundColor: '#6B7280',
    borderRadius: 1.5,
    position: 'absolute',
    top: 4,
  },
  aboutLine: {
    width: 2,
    height: 6,
    backgroundColor: '#6B7280',
    borderRadius: 1,
    position: 'absolute',
    bottom: 4,
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
  
  // Profile Icon - Simple User (Active)
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
    backgroundColor: '#7C3AED',
    position: 'absolute',
    top: 3,
  },
  profileBody: {
    width: 16,
    height: 10,
    backgroundColor: '#7C3AED',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    position: 'absolute',
    bottom: 3,
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
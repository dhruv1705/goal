import React, { useState,useMemo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext'
import { HabitsProvider } from './contexts/HabitsContext'
import { XPProvider } from './contexts/XPContext'
import { GoalJourneyProvider } from './contexts/GoalJourneyContext'
import { LoginScreen } from './screens/LoginScreen'
import { SignUpScreen } from './screens/SignUpScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { DemoChoiceScreen } from './screens/DemoChoiceScreen'
import { DemoScreen } from './screens/DemoScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { ScheduleScreen } from './screens/ScheduleScreen'
import { AddEditScheduleScreen } from './screens/AddEditScheduleScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { GoalsScreen } from './screens/GoalsScreen'
import { AddEditGoalScreen } from './screens/AddEditGoalScreen'
import { GoalDetailScreen } from './screens/GoalDetailScreen'
import { FeedbackScreen } from './screens/FeedbackScreen'
import { HomeScreen } from './screens/HomeScreen'
import { LearnScreen } from './screens/LearnScreen'
import { HabitCompletionScreen } from './screens/HabitCompletionScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { JourneyScreen } from './screens/JourneyScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import OtpVerificationScreen from './screens/OtpVerificationScreen' 
import { View, ActivityIndicator, StyleSheet, Text, Alert } from 'react-native'
import DarkThemes from './theme/DarkThemes'
import LightTheme from './theme/LightTheme'
import {AppContext, AppContextProvider} from './theme/AppContext'
import { RootStackParamList } from './types' 
import { usePushNotifications } from './notification/notification'
import { TalkScreen } from './screens/TalkScreen'
import { Image } from 'react-native'
import IMAGES from './assets'
const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Bottom Tab Navigator for main app screens
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconSource;
          
          if (route.name === 'Learn') {
            iconSource = IMAGES.HOME;
          } else if (route.name === 'Journey') {
            iconSource = IMAGES.GOALS;
          } else if (route.name === 'Progress') {
            iconSource = IMAGES.CATEGORIES;
          } else if (route.name === 'Schedule') {
            iconSource = IMAGES.SCHEDULES;
          } else if (route.name === 'Profile') {
            iconSource = IMAGES.ACCOUNT;
          }
          
          return (
            <Image
              source={iconSource}
              style={{
                width: size,
                height: size,
                tintColor: color,
                opacity: focused ? 1 : 0.6,
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
)

const MainStack = () => (
  <Stack.Navigator 
    initialRouteName="MainTabs"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="HabitCompletion" component={HabitCompletionScreen as any} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Categories" component={CategoriesScreen} />
    <Stack.Screen name="AddEdit" component={AddEditScheduleScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="AddEditGoal" component={AddEditGoalScreen} />
    <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
    <Stack.Screen name="Talk" component={TalkScreen} />
    <Stack.Screen 
      name="Onboarding" 
      children={(props) => (
        <OnboardingScreen 
          {...props} 
          onComplete={() => {
            props.navigation.goBack()
          }} 
        />
      )}
    />
  </Stack.Navigator>
)

const AppContent = () => {
  const { user, loading: authLoading } = useAuth()
  const { onboardingCompleted, loading: preferencesLoading, refreshPreferences, checkAndTransferGuestData } = usePreferences()
  const [forceMainApp, setForceMainApp] = React.useState(false)
  const [appPhase, setAppPhase] = React.useState<'demo' | 'choice' | 'auth' | 'welcome' | 'main'>('main')
  const [demoProgress, setDemoProgress] = React.useState({ totalXP: 0, completedHabits: 0 })
  const { isDarkTheme } = React.useContext(AppContext)

  const {expoPushToken,notification}=usePushNotifications(); 
  const data=JSON.stringify(notification,undefined,2);

  console.log('Expo Push Token:', expoPushToken); 

  const loading = authLoading || (user && preferencesLoading)
  const shouldShowOnboarding = !forceMainApp && ((user && !onboardingCompleted) || (!user && appPhase === 'main'))
  
  // Determine app phase based on user state and handle guest data transfer
  React.useEffect(() => {
    const handleAuthAndGuestData = async () => {
      if (user) {
        console.log('🔍 User authenticated, checking for guest data transfer...')
        
        try {
          // Check if we need to transfer guest data
          const guestDataTransferred = await checkAndTransferGuestData()
          
          if (guestDataTransferred) {
            console.log('✅ Guest data transferred successfully - skipping onboarding')
            // Guest data was transferred, so skip onboarding and go to main app
            setAppPhase('main')
            setForceMainApp(true) // Ensure we don't show onboarding
            
            // Show success message to user
            setTimeout(() => {
              Alert.alert(
                'Welcome Back! 🎉',
                'Your progress has been saved to your account. You can now access all your goals and habits!',
                [{ text: 'Continue' }]
              )
            }, 1000)
            return
          }
          
          // No guest data to transfer, continue with normal flow
          console.log('No guest data found, proceeding with normal auth flow')
          
        } catch (error) {
          console.error('❌ Error during guest data transfer:', error)
          // Continue with normal flow even if guest transfer fails
        }
        
        // Normal authentication flow
        if (appPhase === 'auth') {
          // User just completed authentication from auth flow
          if (demoProgress.totalXP > 0 || demoProgress.completedHabits > 0) {
            setAppPhase('welcome')
          } else {
            setAppPhase('main')
          }
        } else if (appPhase === 'demo' || appPhase === 'choice') {
          // User was in demo/choice but is now authenticated (returning user)
          setAppPhase('main')
        }
        // If already in welcome or main, don't change
      }
      // If no user and not explicitly set, stay in current phase
    }

    handleAuthAndGuestData()
  }, [user])

  // Add debug logging
  console.log('🔍 AppContent render:', {
    user: !!user,
    appPhase,
    demoProgress,
    onboardingCompleted,
    forceMainApp,
    loading,
    authLoading,
    preferencesLoading,
    shouldShowOnboarding
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  console.log(shouldShowOnboarding ? 'Showing onboarding screen' : 'Showing main app navigation')

  const handleDemoComplete = (totalXP?: number, completedHabits?: number) => {
    setDemoProgress({ totalXP: totalXP || 0, completedHabits: completedHabits || 0 })
    setAppPhase('choice')
  }
  
  const handleSaveProgress = () => {
    setAppPhase('auth')
  }
  
  const handleContinueAsGuest = () => {
    // Go directly to onboarding for guest users
    setAppPhase('main')
    setForceMainApp(false) // Ensure onboarding shows
  }
  
  const handleAuthComplete = () => {
    // The useEffect will handle the phase transition when user state changes
  }
  
  const handleWelcomeComplete = () => {
    setAppPhase('main')
  }

  const renderCurrentPhase = () => {
    switch (appPhase) {
      case 'demo':
        return (
          <Stack.Screen 
            name="Demo" 
            children={(props) => (
              <DemoScreen 
                {...props} 
                onComplete={handleDemoComplete}
              />
            )}
          />
        )
      
      case 'choice':
        return (
          <Stack.Screen 
            name="Choice" 
            children={(props) => (
              <DemoChoiceScreen 
                {...props}
                totalXP={demoProgress.totalXP}
                completedHabits={demoProgress.completedHabits}
                onSaveProgress={handleSaveProgress}
                onContinueAsGuest={handleContinueAsGuest}
              />
            )}
          />
        )
        
      case 'auth':
        return (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen 
              name="OtpVerification" 
              children={({ navigation, route }: any) => (
                <OtpVerificationScreen navigation={navigation} route={route} />
              )}
            />
          </>
        )
      
      case 'welcome':
        return (
          <Stack.Screen 
            name="Welcome" 
            children={(props) => (
              <WelcomeScreen 
                {...props}
                totalXP={demoProgress.totalXP}
                completedHabits={demoProgress.completedHabits}
                onGetStarted={handleWelcomeComplete}
              />
            )}
          />
        )
        
      case 'main':
        return shouldShowOnboarding ? (
          <Stack.Screen 
            name="Onboarding" 
            children={(props) => (
              <OnboardingScreen 
                {...props} 
                onComplete={() => {
                  console.log('🎯 Onboarding onComplete callback triggered')
                  if (user) {
                    console.log('🔄 Authenticated user - setting forceMainApp to true...')
                    setForceMainApp(true)
                    console.log('📡 Refreshing preferences...')
                    refreshPreferences()
                  } else {
                    console.log('👤 Guest user - redirecting to auth')
                    setAppPhase('auth')
                  }
                  console.log('✅ onComplete callback finished')
                }} 
              />
            )}
          />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="HabitCompletion" component={HabitCompletionScreen as any} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="AddEdit" component={AddEditScheduleScreen} />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen name="AddEditGoal" component={AddEditGoalScreen} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
            <Stack.Screen name="Feedback" component={FeedbackScreen} />
            <Stack.Screen name="Talk" component={TalkScreen} />
          </>
        )
        
      default:
        return null
    }
  }

  return (
    <NavigationContainer theme={isDarkTheme ? DarkThemes : LightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {renderCurrentPhase()}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const AppNavigator = () => {
  return (
    <AppContextProvider>
      <PreferencesProvider>
        <XPProvider>
          <HabitsProvider>
            <GoalJourneyProvider>
              <AppContent />
            </GoalJourneyProvider>
          </HabitsProvider>
        </XPProvider>
      </PreferencesProvider>
    </AppContextProvider>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  notificationDisplayContainer: { 
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
})

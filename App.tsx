import React, { useState,useMemo } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext'
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
import { CategoriesScreen } from './screens/CategoriesScreen'
import OtpVerificationScreen from './screens/OtpVerificationScreen' 
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'
import DarkThemes from './theme/DarkThemes'
import LightTheme from './theme/LightTheme'
import {AppContext, AppContextProvider} from './theme/AppContext'
import { RootStackParamList } from './types' 
import { usePushNotifications } from './notification/notification'
import { TalkScreen } from './screens/TalkScreen'
const Stack = createStackNavigator()

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
)

const MainStack = () => (
  <Stack.Navigator 
    initialRouteName="Home"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Categories" component={CategoriesScreen} />
    <Stack.Screen name="Schedule" component={ScheduleScreen} />
    <Stack.Screen name="AddEdit" component={AddEditScheduleScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="AddEditGoal" component={AddEditGoalScreen} />
    <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
    <Stack.Screen name="Feedback" component={FeedbackScreen} />
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
  const { onboardingCompleted, loading: preferencesLoading, refreshPreferences } = usePreferences()
  const [forceMainApp, setForceMainApp] = React.useState(false)
  const [appPhase, setAppPhase] = React.useState<'demo' | 'choice' | 'auth' | 'welcome' | 'main'>('demo')
  const [demoProgress, setDemoProgress] = React.useState({ totalXP: 0, completedHabits: 0 })
  const { isDarkTheme } = React.useContext(AppContext)

  const {expoPushToken,notification}=usePushNotifications(); 
  const data=JSON.stringify(notification,undefined,2);

  console.log('Expo Push Token:', expoPushToken); 

  const loading = authLoading || (user && preferencesLoading)
  const shouldShowOnboarding = user && !onboardingCompleted && !forceMainApp
  
  // Determine app phase based on user state
  React.useEffect(() => {
    if (user) {
      // When user becomes authenticated
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
    // If no user and not explicitly set, stay in demo phase
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
    // For now, go to auth - we'll implement guest mode later
    setAppPhase('auth')
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
              children={({ navigation, route }: StackScreenProps<RootStackParamList, 'OtpVerification'>) => (
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
                  console.log('🎯 Onboarding onComplete callback triggered - forcing main app')
                  console.log('🔄 Setting forceMainApp to true...')
                  setForceMainApp(true)
                  console.log('📡 Refreshing preferences...')
                  refreshPreferences()
                  console.log('✅ onComplete callback finished')
                }} 
              />
            )}
          />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="Schedule" component={ScheduleScreen} />
            <Stack.Screen name="AddEdit" component={AddEditScheduleScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen name="AddEditGoal" component={AddEditGoalScreen} />
            <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
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
        <AppContent />
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

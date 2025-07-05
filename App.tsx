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
  const { isDarkTheme } = React.useContext(AppContext)

  const {expoPushToken,notification}=usePushNotifications(); 
  const data=JSON.stringify(notification,undefined,2);

  console.log('Expo Push Token:', expoPushToken); 

  const loading = authLoading || (user && preferencesLoading)
  const shouldShowOnboarding = user && !onboardingCompleted && !forceMainApp

  // Add debug logging
  console.log('🔍 AppContent render:', {
    user: !!user,
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

  return (
    <>
      <NavigationContainer theme={isDarkTheme ? DarkThemes : LightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {shouldShowOnboarding ? (
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
          ) : user ? (
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
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen 
                name="OtpVerification" 
                children={({ navigation, route }: StackScreenProps<RootStackParamList, 'OtpVerification'>) => (
                  <OtpVerificationScreen navigation={navigation} route={route} />
                )}
              />
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

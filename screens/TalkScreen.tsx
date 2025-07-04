import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@react-navigation/native'
import { claudeService, RateLimitError } from '../lib/claude'
import { goalParser, type ParsedGoal } from '../lib/goalParser'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import IMAGES from '../assets'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface TalkScreenProps {
  navigation: any
}

export const TalkScreen: React.FC<TalkScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hi! I'm your goal-setting assistant. I'll help you create actionable goals and tasks.\n\nWhich area of your life would you like to improve?\n• Physical Health\n• Mental Health\n• Finance\n• Social",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsedGoals, setParsedGoals] = useState<ParsedGoal[]>([])
  const [showGoalConfirmation, setShowGoalConfirmation] = useState(false)
  const [rateLimitStatus, setRateLimitStatus] = useState<{ dailyRemaining: number, hourlyRemaining: number } | null>(null)

  useEffect(() => {
    loadRateLimitStatus()
  }, [])

  const loadRateLimitStatus = async () => {
    try {
      const status = await claudeService.getRateLimitStatus()
      setRateLimitStatus(status)
    } catch (error) {
      console.error('Error loading rate limit status:', error)
    }
  }

  const createGoals = async () => {
    if (!user || parsedGoals.length === 0) {
      Alert.alert('Error', 'Unable to create goals. Please try again.')
      return
    }

    setIsLoading(true)
    let createdGoalsCount = 0
    let createdTasksCount = 0

    try {
      for (const goal of parsedGoals) {
        // Insert goal into database
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            target_date: goal.targetDate || null,
            status: 'active'
          })
          .select()
          .single()

        if (goalError) {
          console.error('Error creating goal:', goalError)
          continue
        }

        createdGoalsCount++

        // Create tasks for this goal if any exist
        if (goal.tasks.length > 0) {
          console.log('🎯 AI Task Creation Debug - Goal:', goal.title)
          console.log('📋 Tasks to create:', goal.tasks)
          
          // Generate smart defaults for tasks
          const taskDefaults = goalParser.generateTaskDefaults(goal.tasks, goal.category)
          console.log('⏰ Generated task defaults:', taskDefaults)
          
          // Prepare tasks for insertion
          const tasksToInsert = taskDefaults.map(taskDefault => ({
            user_id: user.id,
            title: taskDefault.title,
            description: taskDefault.description,
            schedule_date: taskDefault.schedule_date,
            schedule_time: taskDefault.schedule_time,
            priority: taskDefault.priority,
            goal_id: goalData.id, // Link to the created goal
            completed: false
          }))

          console.log('💾 Tasks prepared for database insertion:', tasksToInsert)

          // Insert tasks
          const { data: tasksData, error: tasksError } = await supabase
            .from('schedules')
            .insert(tasksToInsert)
            .select()

          if (tasksError) {
            console.error('❌ Error creating tasks:', tasksError)
            console.error('❌ Failed task data:', tasksToInsert)
          } else {
            console.log('✅ Tasks created successfully:', tasksData)
            console.log('✅ Number of tasks created:', tasksData?.length || 0)
            createdTasksCount += tasksData?.length || 0
          }
        } else {
          console.log('⚠️ No tasks found in goal:', goal.title)
        }
      }

      // Show success message
      if (createdGoalsCount > 0) {
        // Create detailed success message
        let alertMessage = `Created ${createdGoalsCount} goal${createdGoalsCount !== 1 ? 's' : ''}`
        if (createdTasksCount > 0) {
          alertMessage += ` and ${createdTasksCount} task${createdTasksCount !== 1 ? 's' : ''}`
        }
        alertMessage += '!\n\n'
        
        if (createdTasksCount > 0) {
          alertMessage += 'Goals are in the Goals tab, and your tasks are scheduled for today in the Schedule tab.'
        } else {
          alertMessage += 'You can view them in the Goals tab.'
        }

        Alert.alert(
          'Success! 🎉',
          alertMessage,
          [
            {
              text: createdTasksCount > 0 ? 'View Schedule' : 'View Goals',
              onPress: () => {
                setShowGoalConfirmation(false)
                setParsedGoals([])
                navigation.navigate(createdTasksCount > 0 ? 'Schedule' : 'Goals')
              }
            },
            {
              text: 'Continue Chat',
              onPress: () => {
                setShowGoalConfirmation(false)
                setParsedGoals([])
              }
            }
          ]
        )

        // Add success message to chat
        let chatMessage = `Great! I've created ${createdGoalsCount} goal${createdGoalsCount !== 1 ? 's' : ''}`
        if (createdTasksCount > 0) {
          chatMessage += ` and ${createdTasksCount} task${createdTasksCount !== 1 ? 's' : ''} scheduled for today`
        }
        chatMessage += ' for you.'
        
        if (createdTasksCount > 0) {
          chatMessage += ' Check your Schedule tab to see your tasks for today!'
        } else {
          chatMessage += ' You can find them in your Goals section.'
        }
        chatMessage += ' Is there anything else you\'d like to work on?'

        const successMessage: Message = {
          id: Date.now().toString(),
          text: chatMessage,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
      } else {
        Alert.alert('Error', 'Failed to create goals. Please try again.')
      }

    } catch (error) {
      console.error('Error creating goals:', error)
      Alert.alert('Error', 'Failed to create goals. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to use AI features')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputText.trim()
    setInputText('')
    setIsLoading(true)

    try {
      // Convert messages to format expected by Claude
      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text
      }))

      const response = await claudeService.sendMessage(currentInput, conversationHistory)
      
      // Update rate limit status
      setRateLimitStatus({
        dailyRemaining: response.dailyRemaining,
        hourlyRemaining: response.hourlyRemaining
      })
      
      // Parse the AI response for goals
      console.log('🤖 Raw AI Response:', response.response)
      console.log('🤖 Response length:', response.response.length)
      const parseResult = goalParser.parseAIResponse(response.response)
      console.log('📊 Parse Result:', JSON.stringify(parseResult, null, 2))
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiResponse])

      // If goals were found, show confirmation
      if (parseResult.hasGoals && parseResult.goals.length > 0) {
        console.log('✅ Goals found, showing confirmation dialog')
        setParsedGoals(parseResult.goals)
        setShowGoalConfirmation(true)
      } else {
        console.log('⚠️ No goals found in AI response or parsing failed')
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      
      if (error instanceof RateLimitError) {
        setRateLimitStatus({
          dailyRemaining: error.dailyRemaining,
          hourlyRemaining: error.hourlyRemaining
        })
        
        Alert.alert(
          'Rate Limit Reached',
          `You've reached your usage limit. Try again later.\n\nDaily remaining: ${error.dailyRemaining}\nHourly remaining: ${error.hourlyRemaining}`
        )
      } else {
        Alert.alert('Error', 'Failed to get AI response. Please try again.')
      }
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const renderMessage = (message: Message) => (
    <View 
      key={message.id} 
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <View 
        style={[
          styles.messageBubble,
          message.isUser 
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]
        ]}
      >
        <Text 
          style={[
            styles.messageText,
            { color: message.isUser ? '#fff' : colors.text }
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              AI Assistant
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text }]}>
              Let's help you achieve your goals
            </Text>
          </View>
          {rateLimitStatus && (
            <View style={styles.rateLimitContainer}>
              <Text style={[styles.rateLimitText, { color: colors.text }]}>
                {rateLimitStatus.dailyRemaining}/50 today
              </Text>
              <Text style={[styles.rateLimitSubtext, { color: colors.text }]}>
                {rateLimitStatus.hourlyRemaining}/10 this hour
              </Text>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={[styles.flex, { paddingBottom: 80 }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Goal Confirmation */}
        {showGoalConfirmation && parsedGoals.length > 0 && (
          <View style={[styles.goalConfirmationContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.goalConfirmationTitle, { color: colors.text }]}>
              🎯 Ready to Create Goals
            </Text>
            <ScrollView style={styles.goalsPreview} showsVerticalScrollIndicator={false}>
              {parsedGoals.map((goal, index) => (
                <View key={index} style={[styles.goalPreviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.goalPreviewTitle, { color: colors.text }]}>{goal.title}</Text>
                  <Text style={[styles.goalPreviewCategory, { color: colors.primary }]}>{goal.category}</Text>
                  <Text style={[styles.goalPreviewDescription, { color: colors.text }]} numberOfLines={2}>
                    {goal.description}
                  </Text>
                  {goal.tasks.length > 0 && (
                    <View style={styles.tasksPreviewSection}>
                      <Text style={[styles.goalPreviewTasks, { color: colors.text }]}>
                        {goal.tasks.length} task{goal.tasks.length !== 1 ? 's' : ''} included:
                      </Text>
                      {(() => {
                        const taskDefaults = goalParser.generateTaskDefaults(goal.tasks, goal.category)
                        return goal.tasks.slice(0, 3).map((task, taskIndex) => (
                          <Text key={taskIndex} style={[styles.taskPreviewItem, { color: colors.text }]}>
                            • {task} ({taskDefaults[taskIndex].schedule_time})
                          </Text>
                        ))
                      })()}
                      {goal.tasks.length > 3 && (
                        <Text style={[styles.taskPreviewMore, { color: colors.text }]}>
                          ... and {goal.tasks.length - 3} more
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.goalConfirmationButtons}>
              <TouchableOpacity 
                style={[styles.goalConfirmButton, { backgroundColor: colors.primary }]}
                onPress={createGoals}
                disabled={isLoading}
              >
                <Text style={styles.goalConfirmButtonText}>
                  {isLoading ? 'Creating...' : 'Create Goals & Tasks'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.goalConfirmButton, styles.goalConfirmButtonSecondary, { borderColor: colors.border }]}
                onPress={() => setShowGoalConfirmation(false)}
              >
                <Text style={[styles.goalConfirmButtonTextSecondary, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Messages */}
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>AI is thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            placeholder={user ? "Type your message..." : "Please log in to use AI features..."}
            placeholderTextColor={colors.text + '80'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!!user && !isLoading}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { backgroundColor: (inputText.trim() && user && !isLoading) ? colors.primary : colors.border }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !user || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(8, insets.bottom) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Image source={IMAGES.HOME} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Categories')}>
          <Image source={IMAGES.CATEGORIES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Goals')}>
          <Image source={IMAGES.GOALS} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Schedule')}>
          <Image source={IMAGES.SCHEDULES} style={styles.navIcon} resizeMode="contain" tintColor={colors.text}/>
          <Text style={[styles.navLabel, { color: colors.text }]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image source={IMAGES.TALK} style={styles.navIcon} resizeMode="contain" tintColor={colors.primary}/>
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Talk</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  rateLimitContainer: {
    alignItems: 'flex-end',
  },
  rateLimitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateLimitSubtext: {
    fontSize: 10,
    opacity: 0.7,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  goalConfirmationContainer: {
    padding: 16,
    borderBottomWidth: 1,
    maxHeight: 300,
  },
  goalConfirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  goalsPreview: {
    maxHeight: 180,
    marginBottom: 16,
  },
  goalPreviewCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalPreviewCategory: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalPreviewDescription: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  goalPreviewTasks: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  goalConfirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  goalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  goalConfirmButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  goalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalConfirmButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  tasksPreviewSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.2)',
  },
  taskPreviewItem: {
    fontSize: 12,
    marginBottom: 2,
    paddingLeft: 4,
  },
  taskPreviewMore: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    paddingLeft: 4,
    marginTop: 2,
  },
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
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navItemActive: {
    // Active state styling handled via tintColor and text color
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    opacity: 0.6,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navLabelActive: {
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
    fontWeight: '600',
  },
})
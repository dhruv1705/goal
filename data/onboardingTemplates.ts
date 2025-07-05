export interface HabitTemplate {
  id: string
  title: string
  description: string
  icon: string
  frequency: 'daily' | 'weekly' | 'monthly'
  defaultTimes: number // times per frequency period
  duration?: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  xpReward: number
  category: string
}

export interface GoalTemplate {
  id: string
  title: string
  description: string
  icon: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: string // "4-8 weeks"
  benefits: string[]
  habits: HabitTemplate[]
}

export interface CategoryTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  benefits: string[]
  goals: GoalTemplate[]
}

// Habit Templates
const physicalHealthHabits: HabitTemplate[] = [
  {
    id: 'morning-run',
    title: 'Morning Run',
    description: 'Start your day with energizing cardio',
    icon: '🏃‍♂️',
    frequency: 'weekly',
    defaultTimes: 3,
    duration: 30,
    difficulty: 'intermediate',
    xpReward: 25,
    category: 'Physical Health'
  },
  {
    id: 'healthy-meal',
    title: 'Healthy Meals',
    description: 'Nutritious breakfast, lunch, or dinner',
    icon: '🥗',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 15,
    difficulty: 'beginner',
    xpReward: 15,
    category: 'Physical Health'
  },
  {
    id: 'calorie-tracking',
    title: 'Track Calories',
    description: 'Log your daily food intake',
    icon: '📱',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 10,
    category: 'Physical Health'
  },
  {
    id: 'weekly-weigh-in',
    title: 'Weekly Weigh-in',
    description: 'Track your progress weekly',
    icon: '⚖️',
    frequency: 'weekly',
    defaultTimes: 1,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 20,
    category: 'Physical Health'
  },
  {
    id: 'strength-training',
    title: 'Strength Training',
    description: 'Build muscle with resistance exercises',
    icon: '💪',
    frequency: 'weekly',
    defaultTimes: 3,
    duration: 45,
    difficulty: 'intermediate',
    xpReward: 30,
    category: 'Physical Health'
  },
  {
    id: 'stretching',
    title: 'Stretching Session',
    description: 'Improve flexibility and prevent injury',
    icon: '🤸‍♀️',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 15,
    difficulty: 'beginner',
    xpReward: 15,
    category: 'Physical Health'
  },
  {
    id: 'water-intake',
    title: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    icon: '💧',
    frequency: 'daily',
    defaultTimes: 8,
    duration: 1,
    difficulty: 'beginner',
    xpReward: 5,
    category: 'Physical Health'
  },
  {
    id: 'meal-prep',
    title: 'Meal Prep',
    description: 'Prepare healthy meals in advance',
    icon: '🍽️',
    frequency: 'weekly',
    defaultTimes: 2,
    duration: 60,
    difficulty: 'intermediate',
    xpReward: 35,
    category: 'Physical Health'
  }
]

const mentalHealthHabits: HabitTemplate[] = [
  {
    id: 'meditation',
    title: 'Meditation',
    description: 'Mindful breathing and awareness practice',
    icon: '🧘‍♀️',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 10,
    difficulty: 'beginner',
    xpReward: 20,
    category: 'Mental Health'
  },
  {
    id: 'gratitude-journal',
    title: 'Gratitude Journal',
    description: 'Write down things you\'re grateful for',
    icon: '📝',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 15,
    category: 'Mental Health'
  },
  {
    id: 'deep-breathing',
    title: 'Deep Breathing',
    description: 'Stress relief through focused breathing',
    icon: '🌬️',
    frequency: 'daily',
    defaultTimes: 3,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 10,
    category: 'Mental Health'
  },
  {
    id: 'digital-detox',
    title: 'Digital Detox',
    description: 'Phone-free time for mental clarity',
    icon: '📵',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 60,
    difficulty: 'intermediate',
    xpReward: 25,
    category: 'Mental Health'
  },
  {
    id: 'reading',
    title: 'Reading Time',
    description: 'Read books for personal growth',
    icon: '📚',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 30,
    difficulty: 'beginner',
    xpReward: 20,
    category: 'Mental Health'
  },
  {
    id: 'sleep-routine',
    title: 'Sleep Routine',
    description: 'Consistent bedtime for better rest',
    icon: '😴',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 30,
    difficulty: 'beginner',
    xpReward: 25,
    category: 'Mental Health'
  },
  {
    id: 'mood-check',
    title: 'Mood Check-in',
    description: 'Reflect on your emotional state',
    icon: '😊',
    frequency: 'daily',
    defaultTimes: 2,
    duration: 3,
    difficulty: 'beginner',
    xpReward: 10,
    category: 'Mental Health'
  }
]

const financeHabits: HabitTemplate[] = [
  {
    id: 'expense-tracking',
    title: 'Track Expenses',
    description: 'Log daily spending to stay aware',
    icon: '💰',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 15,
    category: 'Finance'
  },
  {
    id: 'savings-transfer',
    title: 'Save Money',
    description: 'Transfer money to savings account',
    icon: '🏦',
    frequency: 'weekly',
    defaultTimes: 1,
    duration: 5,
    difficulty: 'beginner',
    xpReward: 30,
    category: 'Finance'
  },
  {
    id: 'budget-review',
    title: 'Budget Review',
    description: 'Check your monthly budget progress',
    icon: '📊',
    frequency: 'weekly',
    defaultTimes: 1,
    duration: 20,
    difficulty: 'intermediate',
    xpReward: 25,
    category: 'Finance'
  },
  {
    id: 'investment-research',
    title: 'Investment Research',
    description: 'Learn about investment opportunities',
    icon: '📈',
    frequency: 'weekly',
    defaultTimes: 2,
    duration: 30,
    difficulty: 'advanced',
    xpReward: 35,
    category: 'Finance'
  },
  {
    id: 'debt-payment',
    title: 'Debt Payment',
    description: 'Make extra payment towards debt',
    icon: '💳',
    frequency: 'monthly',
    defaultTimes: 1,
    duration: 10,
    difficulty: 'intermediate',
    xpReward: 40,
    category: 'Finance'
  },
  {
    id: 'financial-education',
    title: 'Financial Learning',
    description: 'Read about personal finance',
    icon: '📖',
    frequency: 'weekly',
    defaultTimes: 3,
    duration: 20,
    difficulty: 'beginner',
    xpReward: 20,
    category: 'Finance'
  }
]

const socialHabits: HabitTemplate[] = [
  {
    id: 'family-call',
    title: 'Call Family',
    description: 'Stay connected with family members',
    icon: '👨‍👩‍👧‍👦',
    frequency: 'weekly',
    defaultTimes: 2,
    duration: 30,
    difficulty: 'beginner',
    xpReward: 25,
    category: 'Social'
  },
  {
    id: 'friend-meetup',
    title: 'Meet Friends',
    description: 'Spend quality time with friends',
    icon: '👥',
    frequency: 'weekly',
    defaultTimes: 1,
    duration: 120,
    difficulty: 'beginner',
    xpReward: 30,
    category: 'Social'
  },
  {
    id: 'networking',
    title: 'Professional Networking',
    description: 'Connect with industry professionals',
    icon: '🤝',
    frequency: 'weekly',
    defaultTimes: 1,
    duration: 45,
    difficulty: 'intermediate',
    xpReward: 35,
    category: 'Social'
  },
  {
    id: 'community-service',
    title: 'Community Service',
    description: 'Volunteer for local causes',
    icon: '🤲',
    frequency: 'monthly',
    defaultTimes: 1,
    duration: 180,
    difficulty: 'intermediate',
    xpReward: 50,
    category: 'Social'
  },
  {
    id: 'active-listening',
    title: 'Practice Active Listening',
    description: 'Focus on really hearing others',
    icon: '👂',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 15,
    difficulty: 'beginner',
    xpReward: 15,
    category: 'Social'
  },
  {
    id: 'social-media-positive',
    title: 'Positive Social Media',
    description: 'Share encouragement and positivity',
    icon: '📱',
    frequency: 'daily',
    defaultTimes: 1,
    duration: 10,
    difficulty: 'beginner',
    xpReward: 10,
    category: 'Social'
  }
]

// Goal Templates
export const goalTemplates: GoalTemplate[] = [
  // Physical Health Goals
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    description: 'Achieve sustainable weight loss through healthy habits',
    icon: '🏃‍♀️',
    category: 'Physical Health',
    difficulty: 'intermediate',
    estimatedDuration: '8-12 weeks',
    benefits: ['Improved confidence', 'Better health markers', 'Increased energy'],
    habits: [
      physicalHealthHabits.find(h => h.id === 'morning-run')!,
      physicalHealthHabits.find(h => h.id === 'healthy-meal')!,
      physicalHealthHabits.find(h => h.id === 'calorie-tracking')!,
      physicalHealthHabits.find(h => h.id === 'weekly-weigh-in')!,
      physicalHealthHabits.find(h => h.id === 'water-intake')!
    ]
  },
  {
    id: 'muscle-gain',
    title: 'Build Muscle',
    description: 'Increase muscle mass and strength',
    icon: '💪',
    category: 'Physical Health',
    difficulty: 'intermediate',
    estimatedDuration: '12-16 weeks',
    benefits: ['Increased strength', 'Better metabolism', 'Improved physique'],
    habits: [
      physicalHealthHabits.find(h => h.id === 'strength-training')!,
      physicalHealthHabits.find(h => h.id === 'meal-prep')!,
      physicalHealthHabits.find(h => h.id === 'weekly-weigh-in')!,
      physicalHealthHabits.find(h => h.id === 'water-intake')!
    ]
  },
  {
    id: 'flexibility',
    title: 'Improve Flexibility',
    description: 'Increase mobility and prevent injury',
    icon: '🤸‍♀️',
    category: 'Physical Health',
    difficulty: 'beginner',
    estimatedDuration: '6-8 weeks',
    benefits: ['Better mobility', 'Reduced pain', 'Injury prevention'],
    habits: [
      physicalHealthHabits.find(h => h.id === 'stretching')!,
      physicalHealthHabits.find(h => h.id === 'water-intake')!
    ]
  },
  {
    id: 'endurance',
    title: 'Build Endurance',
    description: 'Improve cardiovascular fitness and stamina',
    icon: '🏃‍♂️',
    category: 'Physical Health',
    difficulty: 'intermediate',
    estimatedDuration: '10-12 weeks',
    benefits: ['Better stamina', 'Heart health', 'More energy'],
    habits: [
      physicalHealthHabits.find(h => h.id === 'morning-run')!,
      physicalHealthHabits.find(h => h.id === 'healthy-meal')!,
      physicalHealthHabits.find(h => h.id === 'water-intake')!
    ]
  },
  {
    id: 'nutrition',
    title: 'Improve Nutrition',
    description: 'Develop healthy eating habits',
    icon: '🥗',
    category: 'Physical Health',
    difficulty: 'beginner',
    estimatedDuration: '4-6 weeks',
    benefits: ['More energy', 'Better health', 'Weight management'],
    habits: [
      physicalHealthHabits.find(h => h.id === 'healthy-meal')!,
      physicalHealthHabits.find(h => h.id === 'meal-prep')!,
      physicalHealthHabits.find(h => h.id === 'water-intake')!,
      physicalHealthHabits.find(h => h.id === 'calorie-tracking')!
    ]
  },

  // Mental Health Goals
  {
    id: 'stress-reduction',
    title: 'Reduce Stress',
    description: 'Manage daily stress and anxiety',
    icon: '🧘‍♀️',
    category: 'Mental Health',
    difficulty: 'beginner',
    estimatedDuration: '4-6 weeks',
    benefits: ['Better mood', 'Improved focus', 'Better sleep'],
    habits: [
      mentalHealthHabits.find(h => h.id === 'meditation')!,
      mentalHealthHabits.find(h => h.id === 'deep-breathing')!,
      mentalHealthHabits.find(h => h.id === 'mood-check')!
    ]
  },
  {
    id: 'mindfulness',
    title: 'Practice Mindfulness',
    description: 'Develop present-moment awareness',
    icon: '🌸',
    category: 'Mental Health',
    difficulty: 'beginner',
    estimatedDuration: '6-8 weeks',
    benefits: ['Greater awareness', 'Reduced anxiety', 'Better relationships'],
    habits: [
      mentalHealthHabits.find(h => h.id === 'meditation')!,
      mentalHealthHabits.find(h => h.id === 'gratitude-journal')!,
      mentalHealthHabits.find(h => h.id === 'mood-check')!
    ]
  },
  {
    id: 'sleep-quality',
    title: 'Better Sleep',
    description: 'Improve sleep quality and consistency',
    icon: '😴',
    category: 'Mental Health',
    difficulty: 'beginner',
    estimatedDuration: '3-4 weeks',
    benefits: ['More energy', 'Better mood', 'Improved focus'],
    habits: [
      mentalHealthHabits.find(h => h.id === 'sleep-routine')!,
      mentalHealthHabits.find(h => h.id === 'digital-detox')!,
      mentalHealthHabits.find(h => h.id === 'reading')!
    ]
  },
  {
    id: 'focus',
    title: 'Improve Focus',
    description: 'Enhance concentration and productivity',
    icon: '🎯',
    category: 'Mental Health',
    difficulty: 'intermediate',
    estimatedDuration: '6-8 weeks',
    benefits: ['Better productivity', 'Reduced distractions', 'Achievement of goals'],
    habits: [
      mentalHealthHabits.find(h => h.id === 'meditation')!,
      mentalHealthHabits.find(h => h.id === 'digital-detox')!,
      mentalHealthHabits.find(h => h.id === 'reading')!
    ]
  },
  {
    id: 'emotional-balance',
    title: 'Emotional Balance',
    description: 'Develop emotional intelligence and regulation',
    icon: '⚖️',
    category: 'Mental Health',
    difficulty: 'intermediate',
    estimatedDuration: '8-10 weeks',
    benefits: ['Better relationships', 'Reduced stress', 'Greater resilience'],
    habits: [
      mentalHealthHabits.find(h => h.id === 'mood-check')!,
      mentalHealthHabits.find(h => h.id === 'gratitude-journal')!,
      mentalHealthHabits.find(h => h.id === 'meditation')!
    ]
  },

  // Finance Goals
  {
    id: 'save-money',
    title: 'Save Money',
    description: 'Build an emergency fund and savings',
    icon: '🏦',
    category: 'Finance',
    difficulty: 'beginner',
    estimatedDuration: '12+ weeks',
    benefits: ['Financial security', 'Reduced stress', 'Future opportunities'],
    habits: [
      financeHabits.find(h => h.id === 'expense-tracking')!,
      financeHabits.find(h => h.id === 'savings-transfer')!,
      financeHabits.find(h => h.id === 'budget-review')!
    ]
  },
  {
    id: 'debt-reduction',
    title: 'Pay Off Debt',
    description: 'Eliminate debt and improve credit',
    icon: '💳',
    category: 'Finance',
    difficulty: 'intermediate',
    estimatedDuration: '24+ weeks',
    benefits: ['Financial freedom', 'Better credit score', 'Reduced stress'],
    habits: [
      financeHabits.find(h => h.id === 'expense-tracking')!,
      financeHabits.find(h => h.id === 'debt-payment')!,
      financeHabits.find(h => h.id === 'budget-review')!
    ]
  },
  {
    id: 'investment',
    title: 'Start Investing',
    description: 'Build wealth through investments',
    icon: '📈',
    category: 'Finance',
    difficulty: 'advanced',
    estimatedDuration: '8-12 weeks to start',
    benefits: ['Wealth building', 'Financial literacy', 'Future security'],
    habits: [
      financeHabits.find(h => h.id === 'investment-research')!,
      financeHabits.find(h => h.id === 'financial-education')!,
      financeHabits.find(h => h.id === 'budget-review')!
    ]
  },
  {
    id: 'budget-tracking',
    title: 'Budget Management',
    description: 'Create and stick to a monthly budget',
    icon: '📊',
    category: 'Finance',
    difficulty: 'beginner',
    estimatedDuration: '4-6 weeks',
    benefits: ['Spending control', 'Financial awareness', 'Goal achievement'],
    habits: [
      financeHabits.find(h => h.id === 'expense-tracking')!,
      financeHabits.find(h => h.id === 'budget-review')!,
      financeHabits.find(h => h.id === 'financial-education')!
    ]
  },
  {
    id: 'income-growth',
    title: 'Increase Income',
    description: 'Develop skills and opportunities for higher income',
    icon: '💼',
    category: 'Finance',
    difficulty: 'advanced',
    estimatedDuration: '12+ weeks',
    benefits: ['Higher income', 'Career growth', 'Financial opportunities'],
    habits: [
      financeHabits.find(h => h.id === 'financial-education')!,
      financeHabits.find(h => h.id === 'budget-review')!
    ]
  },

  // Social Goals
  {
    id: 'family-time',
    title: 'Strengthen Family Bonds',
    description: 'Improve relationships with family members',
    icon: '👨‍👩‍👧‍👦',
    category: 'Social',
    difficulty: 'beginner',
    estimatedDuration: '6-8 weeks',
    benefits: ['Stronger relationships', 'Better communication', 'Family harmony'],
    habits: [
      socialHabits.find(h => h.id === 'family-call')!,
      socialHabits.find(h => h.id === 'active-listening')!
    ]
  },
  {
    id: 'friendships',
    title: 'Build Friendships',
    description: 'Develop and maintain meaningful friendships',
    icon: '👥',
    category: 'Social',
    difficulty: 'beginner',
    estimatedDuration: '8-12 weeks',
    benefits: ['Social support', 'Better mental health', 'Fun experiences'],
    habits: [
      socialHabits.find(h => h.id === 'friend-meetup')!,
      socialHabits.find(h => h.id === 'active-listening')!,
      socialHabits.find(h => h.id === 'social-media-positive')!
    ]
  },
  {
    id: 'networking',
    title: 'Professional Networking',
    description: 'Build professional relationships and opportunities',
    icon: '🤝',
    category: 'Social',
    difficulty: 'intermediate',
    estimatedDuration: '10-12 weeks',
    benefits: ['Career opportunities', 'Professional growth', 'Industry connections'],
    habits: [
      socialHabits.find(h => h.id === 'networking')!,
      socialHabits.find(h => h.id === 'active-listening')!
    ]
  },
  {
    id: 'communication',
    title: 'Improve Communication',
    description: 'Develop better communication skills',
    icon: '💬',
    category: 'Social',
    difficulty: 'intermediate',
    estimatedDuration: '6-8 weeks',
    benefits: ['Better relationships', 'Reduced conflicts', 'Professional success'],
    habits: [
      socialHabits.find(h => h.id === 'active-listening')!,
      socialHabits.find(h => h.id === 'family-call')!,
      socialHabits.find(h => h.id === 'friend-meetup')!
    ]
  },
  {
    id: 'community',
    title: 'Community Involvement',
    description: 'Contribute to your local community',
    icon: '🤲',
    category: 'Social',
    difficulty: 'intermediate',
    estimatedDuration: '8+ weeks',
    benefits: ['Sense of purpose', 'Community impact', 'Personal fulfillment'],
    habits: [
      socialHabits.find(h => h.id === 'community-service')!,
      socialHabits.find(h => h.id === 'social-media-positive')!
    ]
  }
]

// Category Templates
export const categoryTemplates: CategoryTemplate[] = [
  {
    id: 'physical-health',
    name: 'Physical Health',
    description: 'Transform your body and boost your energy',
    icon: '💪',
    color: '#FF6B6B',
    benefits: [
      'Increased energy and vitality',
      'Better sleep and mood',
      'Improved confidence',
      'Long-term health benefits'
    ],
    goals: goalTemplates.filter(g => g.category === 'Physical Health')
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    description: 'Find peace, clarity, and emotional balance',
    icon: '🧠',
    color: '#4ECDC4',
    benefits: [
      'Reduced stress and anxiety',
      'Better emotional regulation',
      'Improved focus and clarity',
      'Enhanced relationships'
    ],
    goals: goalTemplates.filter(g => g.category === 'Mental Health')
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Build wealth and achieve financial freedom',
    icon: '💰',
    color: '#45B7D1',
    benefits: [
      'Financial security and peace of mind',
      'Debt reduction and wealth building',
      'Better spending habits',
      'Future opportunities'
    ],
    goals: goalTemplates.filter(g => g.category === 'Finance')
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Strengthen relationships and build connections',
    icon: '👥',
    color: '#96CEB4',
    benefits: [
      'Stronger personal relationships',
      'Enhanced communication skills',
      'Professional networking',
      'Community involvement'
    ],
    goals: goalTemplates.filter(g => g.category === 'Social')
  }
]

export const getGoalsByCategory = (categoryId: string): GoalTemplate[] => {
  const category = categoryTemplates.find(c => c.id === categoryId)
  return category ? category.goals : []
}

export const getHabitsByGoal = (goalId: string): HabitTemplate[] => {
  const goal = goalTemplates.find(g => g.id === goalId)
  return goal ? goal.habits : []
}
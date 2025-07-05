#!/usr/bin/env node

/**
 * Seed Test Data Script
 * Run this to populate your database with test data for GoalJourneyContext
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedCategories() {
  console.log('📂 Seeding Categories...')
  
  const categories = [
    {
      name: 'Physical Health',
      description: 'Build strength, endurance, and overall physical wellness',
      icon: '💪',
      color: '#10B981',
      order_index: 1
    },
    {
      name: 'Mental Health', 
      description: 'Develop mindfulness, emotional resilience, and mental clarity',
      icon: '🧠',
      color: '#3B82F6',
      order_index: 2
    },
    {
      name: 'Finance',
      description: 'Improve financial literacy and build wealth',
      icon: '💰',
      color: '#F59E0B', 
      order_index: 3
    },
    {
      name: 'Social',
      description: 'Strengthen relationships and build social connections',
      icon: '👥',
      color: '#8B5CF6',
      order_index: 4
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name' })
      .select()
    
    if (error) {
      console.log(`❌ Categories: ${error.message}`)
      return null
    } else {
      console.log(`✅ Categories: Seeded ${data?.length || 0} categories`)
      return data
    }
  } catch (err) {
    console.log(`❌ Categories Error: ${err.message}`)
    return null
  }
}

async function seedGoalTemplates(categories) {
  console.log('🎯 Seeding Goal Templates...')
  
  if (!categories || categories.length === 0) {
    console.log('❌ No categories available, skipping goals')
    return null
  }
  
  const physicalHealthCat = categories.find(c => c.name === 'Physical Health')
  const mentalHealthCat = categories.find(c => c.name === 'Mental Health')
  
  if (!physicalHealthCat || !mentalHealthCat) {
    console.log('❌ Required categories not found')
    return null
  }
  
  const goals = [
    {
      category_id: physicalHealthCat.id,
      name: 'lose_weight',
      title: 'Lose Weight',
      description: 'Develop sustainable habits for healthy weight loss through exercise, nutrition, and lifestyle changes.',
      difficulty: 'intermediate',
      estimated_duration: '12-16 weeks',
      total_levels: 4,
      benefits: ['Improved energy', 'Better health markers', 'Increased confidence', 'Better sleep']
    },
    {
      category_id: physicalHealthCat.id,
      name: 'build_muscle',
      title: 'Build Muscle',
      description: 'Gain lean muscle mass through progressive strength training, proper nutrition, and recovery.',
      difficulty: 'intermediate',
      estimated_duration: '16-20 weeks',
      total_levels: 4,
      benefits: ['Increased strength', 'Better metabolism', 'Improved body composition', 'Enhanced performance']
    },
    {
      category_id: mentalHealthCat.id,
      name: 'reduce_stress',
      title: 'Reduce Stress',
      description: 'Learn mindfulness techniques and stress management strategies for better mental wellbeing.',
      difficulty: 'beginner',
      estimated_duration: '8-12 weeks',
      total_levels: 4,
      benefits: ['Lower anxiety', 'Better sleep', 'Improved focus', 'Enhanced mood']
    },
    {
      category_id: mentalHealthCat.id,
      name: 'improve_focus',
      title: 'Improve Focus',
      description: 'Develop concentration skills and eliminate distractions for enhanced productivity.',
      difficulty: 'intermediate',
      estimated_duration: '10-14 weeks',
      total_levels: 4,
      benefits: ['Better productivity', 'Enhanced creativity', 'Reduced mental fatigue', 'Improved learning']
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('goal_templates')
      .upsert(goals, { onConflict: 'name' })
      .select()
    
    if (error) {
      console.log(`❌ Goal Templates: ${error.message}`)
      return null
    } else {
      console.log(`✅ Goal Templates: Seeded ${data?.length || 0} goals`)
      return data
    }
  } catch (err) {
    console.log(`❌ Goal Templates Error: ${err.message}`)
    return null
  }
}

async function seedHabitTemplates(goals) {
  console.log('📚 Seeding Habit Templates...')
  
  if (!goals || goals.length === 0) {
    console.log('❌ No goals available, skipping habits')
    return null
  }
  
  const loseWeightGoal = goals.find(g => g.name === 'lose_weight')
  const reduceStressGoal = goals.find(g => g.name === 'reduce_stress')
  
  if (!loseWeightGoal || !reduceStressGoal) {
    console.log('❌ Required goals not found')
    return null
  }
  
  const habits = [
    // Lose Weight - Level 1 (Foundation)
    {
      goal_template_id: loseWeightGoal.id,
      title: 'Daily Weigh-In',
      description: 'Track your weight every morning to build awareness',
      level: 1,
      estimated_duration: 2,
      xp_reward: 10,
      habit_type: 'foundation',
      instructions: 'Step on the scale first thing in the morning, after using the bathroom, wearing minimal clothing.',
      tips: 'Expect daily fluctuations - focus on weekly trends instead of daily changes.',
      unlock_requirements: { completed_habits: 0, required_level: 1 },
      order_index: 1
    },
    {
      goal_template_id: loseWeightGoal.id,
      title: 'Drink Water Before Meals',
      description: 'Drink a full glass of water 30 minutes before each meal',
      level: 1,
      estimated_duration: 1,
      xp_reward: 15,
      habit_type: 'foundation',
      instructions: 'Drink 16-20 oz of water 30 minutes before breakfast, lunch, and dinner.',
      tips: 'This helps with portion control and keeps you hydrated throughout the day.',
      unlock_requirements: { completed_habits: 0, required_level: 1 },
      order_index: 2
    },
    {
      goal_template_id: loseWeightGoal.id,
      title: 'Take 10,000 Steps',
      description: 'Walk at least 10,000 steps daily for increased activity',
      level: 1,
      estimated_duration: 60,
      xp_reward: 25,
      habit_type: 'foundation',
      instructions: 'Use a step counter or phone app to track your daily steps. Include walking, stairs, and regular activities.',
      tips: 'Break it up throughout the day - park farther away, take stairs, walk during calls.',
      unlock_requirements: { completed_habits: 0, required_level: 1 },
      order_index: 3
    },
    
    // Lose Weight - Level 2 (Building)
    {
      goal_template_id: loseWeightGoal.id,
      title: 'Strength Training Session',
      description: 'Complete a 30-minute strength training workout',
      level: 2,
      estimated_duration: 30,
      xp_reward: 40,
      habit_type: 'building',
      instructions: 'Perform bodyweight exercises or use weights. Focus on major muscle groups: legs, back, chest, shoulders.',
      tips: 'Start with bodyweight exercises like push-ups, squats, and planks if you\'re new to strength training.',
      unlock_requirements: { completed_habits: 5, required_level: 2 },
      order_index: 4
    },
    
    // Reduce Stress - Level 1 (Foundation)
    {
      goal_template_id: reduceStressGoal.id,
      title: '5-Minute Breathing',
      description: 'Practice deep breathing for 5 minutes to calm your mind',
      level: 1,
      estimated_duration: 5,
      xp_reward: 15,
      habit_type: 'foundation',
      instructions: 'Sit comfortably, close your eyes, and focus on your breath. Breathe in for 4 counts, hold for 4, exhale for 6.',
      tips: 'Try to do this in the same place and time each day to build consistency.',
      unlock_requirements: { completed_habits: 0, required_level: 1 },
      order_index: 1
    },
    {
      goal_template_id: reduceStressGoal.id,
      title: 'Gratitude Journal',
      description: 'Write down 3 things you\'re grateful for today',
      level: 1,
      estimated_duration: 5,
      xp_reward: 12,
      habit_type: 'foundation',
      instructions: 'Before bed, write down 3 specific things you\'re grateful for. Be specific and include why you\'re grateful.',
      tips: 'Focus on small, everyday moments rather than just big events.',
      unlock_requirements: { completed_habits: 0, required_level: 1 },
      order_index: 2
    },
    
    // Reduce Stress - Level 2 (Building)
    {
      goal_template_id: reduceStressGoal.id,
      title: '15-Minute Meditation',
      description: 'Practice guided meditation for mental clarity',
      level: 2,
      estimated_duration: 15,
      xp_reward: 25,
      habit_type: 'building',
      instructions: 'Use a meditation app or follow along with a guided session. Focus on mindfulness or loving-kindness meditation.',
      tips: 'If your mind wanders, that\'s normal! Gently bring your attention back to the meditation.',
      unlock_requirements: { completed_habits: 3, required_level: 2 },
      order_index: 3
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('habit_templates')
      .upsert(habits, { onConflict: 'goal_template_id,title' })
      .select()
    
    if (error) {
      console.log(`❌ Habit Templates: ${error.message}`)
      return null
    } else {
      console.log(`✅ Habit Templates: Seeded ${data?.length || 0} habits`)
      return data
    }
  } catch (err) {
    console.log(`❌ Habit Templates Error: ${err.message}`)
    return null
  }
}

async function runSeeding() {
  console.log('🌱 Starting Database Seeding for GoalJourneyContext\n')
  
  const categories = await seedCategories()
  if (!categories) {
    console.log('❌ Failed to seed categories, stopping')
    return
  }
  
  const goals = await seedGoalTemplates(categories)
  if (!goals) {
    console.log('❌ Failed to seed goals, stopping')
    return
  }
  
  const habits = await seedHabitTemplates(goals)
  if (!habits) {
    console.log('❌ Failed to seed habits, stopping')
    return
  }
  
  console.log('\n✨ Database Seeding Complete!')
  console.log('\n📊 Summary:')
  console.log(`- ${categories.length} categories`)
  console.log(`- ${goals.length} goal templates`)
  console.log(`- ${habits.length} habit templates`)
  
  console.log('\n🧪 You can now run: node test_implementation.js')
  console.log('📱 Or start the app and test the Journey screen!')
}

// Run the seeding
runSeeding().catch(console.error)
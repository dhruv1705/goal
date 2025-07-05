#!/usr/bin/env node

/**
 * Test Script for GoalJourneyContext Implementation
 * Run this to verify database setup and basic functionality
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseTables() {
  console.log('🔍 Testing Database Tables...')
  
  const tables = [
    'categories',
    'goal_templates', 
    'habit_templates',
    'user_active_goals',
    'user_habit_progress',
    'user_xp_progress',
    'habit_completions',
    'xp_transactions',
    'user_achievements'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`)
      } else {
        console.log(`✅ Table '${table}': OK`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`)
    }
  }
}

async function testSeedData() {
  console.log('\n📊 Testing Seed Data...')
  
  try {
    // Test categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index')
    
    if (catError) {
      console.log(`❌ Categories: ${catError.message}`)
    } else {
      console.log(`✅ Categories: Found ${categories?.length || 0} categories`)
      categories?.forEach(cat => {
        console.log(`   - ${cat.icon} ${cat.name}`)
      })
    }
    
    // Test goal templates
    const { data: goals, error: goalError } = await supabase
      .from('goal_templates')
      .select('*')
    
    if (goalError) {
      console.log(`❌ Goal Templates: ${goalError.message}`)
    } else {
      console.log(`✅ Goal Templates: Found ${goals?.length || 0} goals`)
      goals?.slice(0, 3).forEach(goal => {
        console.log(`   - ${goal.title} (${goal.difficulty})`)
      })
    }
    
    // Test habit templates
    const { data: habits, error: habitError } = await supabase
      .from('habit_templates')
      .select('*')
    
    if (habitError) {
      console.log(`❌ Habit Templates: ${habitError.message}`)
    } else {
      console.log(`✅ Habit Templates: Found ${habits?.length || 0} habits`)
      
      // Group by level
      const levelCounts = {}
      habits?.forEach(habit => {
        levelCounts[habit.level] = (levelCounts[habit.level] || 0) + 1
      })
      
      Object.keys(levelCounts).sort().forEach(level => {
        const levelName = ['Foundation', 'Building', 'Power', 'Mastery'][level - 1] || `Level ${level}`
        console.log(`   - Level ${level} (${levelName}): ${levelCounts[level]} habits`)
      })
    }
    
  } catch (err) {
    console.log(`❌ Seed Data Test Failed: ${err.message}`)
  }
}

async function testGoalWithHabits() {
  console.log('\n🎯 Testing Goal-Habit Relationships...')
  
  try {
    const { data: goalsWithHabits, error } = await supabase
      .from('goal_templates')
      .select(`
        id,
        title,
        category:categories(name),
        habits:habit_templates(
          id,
          title,
          level,
          xp_reward
        )
      `)
      .limit(2)
    
    if (error) {
      console.log(`❌ Goal-Habit Relationships: ${error.message}`)
    } else {
      console.log(`✅ Goal-Habit Relationships: Testing ${goalsWithHabits?.length || 0} goals`)
      
      goalsWithHabits?.forEach(goal => {
        console.log(`\n   Goal: ${goal.title}`)
        console.log(`   Category: ${goal.category?.name || 'Unknown'}`)
        console.log(`   Habits: ${goal.habits?.length || 0}`)
        
        goal.habits?.slice(0, 3).forEach(habit => {
          console.log(`     - Level ${habit.level}: ${habit.title} (+${habit.xp_reward} XP)`)
        })
      })
    }
  } catch (err) {
    console.log(`❌ Goal-Habit Test Failed: ${err.message}`)
  }
}

async function testUserTables() {
  console.log('\n👤 Testing User-Related Tables...')
  
  const userTables = [
    'user_active_goals',
    'user_habit_progress', 
    'user_xp_progress',
    'habit_completions',
    'xp_transactions',
    'user_achievements'
  ]
  
  for (const table of userTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ User Table '${table}': ${error.message}`)
      } else {
        console.log(`✅ User Table '${table}': Ready for user data`)
      }
    } catch (err) {
      console.log(`❌ User Table '${table}': ${err.message}`)
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting GoalJourneyContext Implementation Tests\n')
  
  await testDatabaseTables()
  await testSeedData()
  await testGoalWithHabits()
  await testUserTables()
  
  console.log('\n✨ Tests Complete!')
  console.log('\n📋 Next Steps for Manual Testing:')
  console.log('1. Start the app: npm start')
  console.log('2. Login or signup as a user')
  console.log('3. Navigate to Journey screen')
  console.log('4. Try selecting a goal')
  console.log('5. Navigate to Learn screen to see daily habits')
  console.log('6. Complete a habit to test the full flow')
  console.log('7. Check Progress screen for analytics')
}

// Run the tests
runAllTests().catch(console.error)
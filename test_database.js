// Quick database test script
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('🔍 Testing database tables...')
  
  try {
    // Test 1: Check if skills table exists and has data
    console.log('\n1. Testing skills table...')
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(5)
    
    if (skillsError) {
      console.error('❌ Skills table error:', skillsError.message)
    } else {
      console.log('✅ Skills table:', skills?.length || 0, 'records found')
      if (skills?.length > 0) {
        console.log('Sample skill:', skills[0])
      }
    }

    // Test 2: Check goal_templates table
    console.log('\n2. Testing goal_templates table...')
    const { data: goals, error: goalsError } = await supabase
      .from('goal_templates')
      .select('*')
      .limit(5)
    
    if (goalsError) {
      console.error('❌ Goal templates table error:', goalsError.message)
    } else {
      console.log('✅ Goal templates table:', goals?.length || 0, 'records found')
      if (goals?.length > 0) {
        console.log('Sample goal:', goals[0])
      }
    }

    // Test 3: Check habit_templates table
    console.log('\n3. Testing habit_templates table...')
    const { data: habits, error: habitsError } = await supabase
      .from('habit_templates')
      .select('*')
      .limit(5)
    
    if (habitsError) {
      console.error('❌ Habit templates table error:', habitsError.message)
    } else {
      console.log('✅ Habit templates table:', habits?.length || 0, 'records found')
      if (habits?.length > 0) {
        console.log('Sample habit:', habits[0])
      }
    }

    // Test 4: Test the problematic join query
    console.log('\n4. Testing problematic join query...')
    const { data: joinData, error: joinError } = await supabase
      .from('habit_templates')
      .select(`
        id,
        title,
        goal_templates (
          title,
          skills (
            name,
            color
          )
        )
      `)
      .limit(3)
    
    if (joinError) {
      console.error('❌ Join query error:', joinError.message)
      console.error('Full error:', joinError)
    } else {
      console.log('✅ Join query successful:', joinData?.length || 0, 'records')
      if (joinData?.length > 0) {
        console.log('Sample joined data:', JSON.stringify(joinData[0], null, 2))
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message)
  }
}

testDatabase().then(() => {
  console.log('\n🏁 Database test completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
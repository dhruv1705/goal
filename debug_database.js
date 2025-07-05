// Database relationship investigation script
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateDatabase() {
  console.log('🔍 Investigating Database Relationships...\n')
  
  try {
    // 1. Check skills/categories table
    console.log('1. Checking skills/categories table...')
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .limit(5)
    
    if (skillsError) {
      console.log('❌ Skills table error:', skillsError.message)
      // Try categories table instead
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .limit(5)
      
      if (categoriesError) {
        console.log('❌ Categories table error:', categoriesError.message)
      } else {
        console.log('✅ Categories table found:', categories?.length || 0, 'records')
        if (categories?.length > 0) {
          console.log('Sample category:', categories[0])
        }
      }
    } else {
      console.log('✅ Skills table found:', skills?.length || 0, 'records')
      if (skills?.length > 0) {
        console.log('Sample skill:', skills[0])
      }
    }

    // 2. Check goal_templates
    console.log('\n2. Checking goal_templates...')
    const { data: goalTemplates, error: goalError } = await supabase
      .from('goal_templates')
      .select('*')
      .limit(5)
    
    if (goalError) {
      console.log('❌ Goal templates error:', goalError.message)
    } else {
      console.log('✅ Goal templates found:', goalTemplates?.length || 0, 'records')
      if (goalTemplates?.length > 0) {
        console.log('Sample goal template:', goalTemplates[0])
        
        // Look for Build Wealth specifically
        const { data: buildWealthGoal, error: buildWealthError } = await supabase
          .from('goal_templates')
          .select('*')
          .ilike('name', '%wealth%')
        
        if (buildWealthGoal?.length > 0) {
          console.log('🎯 Build Wealth goal found:', buildWealthGoal[0])
        } else {
          console.log('⚠️ No Build Wealth goal found in goal_templates')
        }
      }
    }

    // 3. Check habit_templates
    console.log('\n3. Checking habit_templates...')
    const { data: habitTemplates, error: habitError } = await supabase
      .from('habit_templates')
      .select('*')
      .limit(5)
    
    if (habitError) {
      console.log('❌ Habit templates error:', habitError.message)
    } else {
      console.log('✅ Habit templates found:', habitTemplates?.length || 0, 'records')
      if (habitTemplates?.length > 0) {
        console.log('Sample habit template:', habitTemplates[0])
      }
    }

    // 4. Check users and their active goals
    console.log('\n4. Checking user_active_goals...')
    const { data: activeGoals, error: activeGoalsError } = await supabase
      .from('user_active_goals')
      .select('*')
      .limit(5)
    
    if (activeGoalsError) {
      console.log('❌ User active goals error:', activeGoalsError.message)
    } else {
      console.log('✅ User active goals found:', activeGoals?.length || 0, 'records')
      if (activeGoals?.length > 0) {
        console.log('Sample active goal:', activeGoals[0])
        
        // Get goal template details for active goals
        for (const goal of activeGoals) {
          const { data: goalTemplate } = await supabase
            .from('goal_templates')
            .select('name, title')
            .eq('id', goal.goal_template_id)
            .single()
          
          console.log(`User ${goal.user_id} has active goal: ${goalTemplate?.title || 'Unknown'} (${goalTemplate?.name || 'Unknown'})`)
        }
      }
    }

    // 5. Check user_habit_progress
    console.log('\n5. Checking user_habit_progress...')
    const { data: habitProgress, error: progressError } = await supabase
      .from('user_habit_progress')
      .select('*')
      .limit(5)
    
    if (progressError) {
      console.log('❌ User habit progress error:', progressError.message)
    } else {
      console.log('✅ User habit progress found:', habitProgress?.length || 0, 'records')
      if (habitProgress?.length > 0) {
        console.log('Sample habit progress:', habitProgress[0])
      }
    }

    // 6. Check specific user data (if we can identify a test user)
    console.log('\n6. Checking for test user data...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (users?.users && users.users.length > 0) {
      const testUser = users.users[0] // Use first user as test
      console.log('Test user ID:', testUser.id)
      
      // Check this user's active goals
      const { data: userGoals } = await supabase
        .from('user_active_goals')
        .select(`
          *,
          goal_template:goal_templates(*)
        `)
        .eq('user_id', testUser.id)
      
      console.log(`User ${testUser.id} active goals:`, userGoals?.length || 0)
      if (userGoals?.length > 0) {
        userGoals.forEach((goal, index) => {
          console.log(`  Goal ${index + 1}: ${goal.goal_template?.title || 'Unknown'} (Status: ${goal.status})`)
        })
      }
    }

  } catch (error) {
    console.error('💥 Investigation failed:', error)
  }
}

investigateDatabase().then(() => {
  console.log('\n🏁 Database investigation completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Investigation failed:', error)
  process.exit(1)
})
// Test authentication and data fetching
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuthAndData() {
  console.log('🔐 Testing Authentication and Data Access...\n')
  
  try {
    // 1. Check current session
    console.log('1. Checking current session...')
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('Current session:', sessionData.session ? 'Authenticated' : 'Anonymous')
    
    if (sessionData.session) {
      console.log('User ID:', sessionData.session.user.id)
      console.log('User email:', sessionData.session.user.email)
    }

    // 2. Try to fetch data without authentication first
    console.log('\n2. Trying to fetch data without authentication...')
    const { data: habitsUnauth, error: errorUnauth } = await supabase
      .from('habit_templates')
      .select('id, title, level')
      .limit(3)
    
    console.log('Unauthenticated result:', {
      count: habitsUnauth?.length || 0,
      error: errorUnauth?.message || 'none'
    })

    // 3. Try creating a temporary session for testing
    console.log('\n3. Testing with authentication...')
    
    // First, let's see if we can get any user accounts
    console.log('Checking for existing users in auth.users...')
    
    // Try a generic login (this will fail but might give us info)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })
    
    if (signInError) {
      console.log('Expected sign-in error:', signInError.message)
    } else {
      console.log('Unexpected successful sign-in!')
    }

    // 4. Try to create a test user for debugging
    console.log('\n4. Trying to create a test user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'debug@test.com',
      password: 'debugtest123'
    })
    
    if (signUpError) {
      console.log('Sign-up error:', signUpError.message)
    } else {
      console.log('Test user created:', signUpData.user?.id)
      
      // If successful, try fetching data again
      const { data: habitsAuth, error: errorAuth } = await supabase
        .from('habit_templates')
        .select('id, title, level')
        .limit(3)
      
      console.log('Authenticated result:', {
        count: habitsAuth?.length || 0,
        error: errorAuth?.message || 'none'
      })
      
      if (habitsAuth && habitsAuth.length > 0) {
        console.log('Sample habits:', habitsAuth)
      }
    }

    // 5. Check what tables actually exist and have data
    console.log('\n5. Checking table schemas...')
    
    // This should work regardless of authentication
    const { data: schemasData, error: schemasError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['habit_templates', 'goal_templates', 'skills', 'categories'])
    
    if (schemasError) {
      console.log('Schema check error:', schemasError.message)
    } else {
      console.log('Existing tables:', schemasData?.map(t => t.table_name) || [])
    }

  } catch (error) {
    console.error('💥 Auth test failed:', error)
  }
}

testAuthAndData().then(() => {
  console.log('\n🏁 Auth and data test completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Test failed:', error)
  process.exit(1)
})
// Test script to verify goals table and RLS policies
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testGoalsTable() {
  try {
    console.log('Testing goals table...')
    
    // Test 1: Check if table exists by trying to select
    const { data, error, count } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Error accessing goals table:', error)
      return
    }
    
    console.log('✅ Goals table exists')
    console.log('📊 Current goal count:', count)
    
    // Test 2: Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Current user:', user ? `${user.email} (${user.id})` : 'Not authenticated')
    
    if (!user) {
      console.log('ℹ️  To test goal creation, you need to be authenticated')
      return
    }
    
    // Test 3: Try to create a test goal
    const testGoal = {
      title: 'Test Goal',
      description: 'This is a test goal',
      category: 'Personal',
      status: 'active',
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('goals')
      .insert([testGoal])
      .select()
    
    if (insertError) {
      console.error('❌ Error creating test goal:', insertError)
      return
    }
    
    console.log('✅ Test goal created successfully:', insertData[0])
    
    // Test 4: Clean up - delete the test goal
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', insertData[0].id)
    
    if (deleteError) {
      console.error('⚠️  Warning: Could not delete test goal:', deleteError)
    } else {
      console.log('🧹 Test goal cleaned up successfully')
    }
    
    console.log('\n🎉 All tests passed! Goals table is working correctly.')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testGoalsTable()
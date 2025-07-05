// Check RLS policies and authentication
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSAndAuth() {
  console.log('🔐 Checking RLS Policies and Authentication...\n')
  
  try {
    // 1. Check current session
    const { data: session } = await supabase.auth.getSession()
    console.log('Current session:', session.session ? 'Authenticated' : 'Anonymous')
    
    // 2. Try direct SQL queries to bypass RLS temporarily
    console.log('\n2. Trying raw SQL queries...')
    
    // Check table existence with SQL
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('skills', 'categories', 'goal_templates', 'habit_templates');" })
    
    if (tablesError) {
      console.log('❌ SQL query error:', tablesError.message)
    } else {
      console.log('✅ Table existence check:', tables)
    }

    // 3. Try querying with different approaches
    console.log('\n3. Testing different query approaches...')
    
    // Try habit_templates with select *
    console.log('Trying habit_templates...')
    const { data: habits1, error: error1, count } = await supabase
      .from('habit_templates')
      .select('*', { count: 'exact' })
    
    console.log('habit_templates result:', { 
      data: habits1?.length || 0, 
      error: error1?.message || 'none',
      count: count 
    })

    // Try with specific columns
    const { data: habits2, error: error2 } = await supabase
      .from('habit_templates')
      .select('id, title, level')
      .limit(3)
    
    console.log('habit_templates (specific columns):', { 
      data: habits2?.length || 0, 
      error: error2?.message || 'none'
    })
    
    // Try goal_templates
    const { data: goals, error: goalError } = await supabase
      .from('goal_templates')
      .select('id, name, title')
      .limit(3)
    
    console.log('goal_templates result:', { 
      data: goals?.length || 0, 
      error: goalError?.message || 'none'
    })

    // 4. Check if we need authentication for these tables
    console.log('\n4. Checking if authentication is required...')
    
    // Try to create a temporary session for testing
    console.log('Attempting to create test session...')
    
    // Try signing in with a test account if possible
    // Note: This will only work if you have test credentials
    
    // 5. Check RLS policies directly
    console.log('\n5. Checking RLS status...')
    
    const rlsCheck = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, rowsecurity, policies 
          FROM pg_tables 
          LEFT JOIN (
            SELECT schemaname as policy_schema, tablename as policy_table, 
                   array_agg(policyname) as policies
            FROM pg_policies 
            GROUP BY schemaname, tablename
          ) pol ON pg_tables.schemaname = pol.policy_schema 
                AND pg_tables.tablename = pol.policy_table
          WHERE schemaname = 'public' 
          AND tablename IN ('habit_templates', 'goal_templates', 'skills', 'categories')
          ORDER BY tablename;
        `
      })
    
    if (rlsCheck.error) {
      console.log('❌ RLS check error:', rlsCheck.error.message)
    } else {
      console.log('✅ RLS status:', rlsCheck.data)
    }

  } catch (error) {
    console.error('💥 RLS check failed:', error)
  }
}

checkRLSAndAuth().then(() => {
  console.log('\n🏁 RLS and auth check completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Check failed:', error)
  process.exit(1)
})
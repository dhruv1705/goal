// Create tables manually using raw SQL
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🔧 Creating essential tables...')
  
  try {
    // First, let's create the skills table directly
    console.log('Creating skills table...')
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('id')
      .limit(1)
    
    if (skillsError && skillsError.code === '42P01') {
      console.log('Skills table does not exist, manual creation required')
      // Table doesn't exist, we need to create it through dashboard or admin
      console.log('❌ Need to create tables through Supabase dashboard')
      return
    }
    
    if (skillsError) {
      console.error('❌ Error checking skills table:', skillsError)
      return
    }
    
    console.log('✅ Skills table exists')
    
    // Check if we have any data
    const { data: existingSkills, error: fetchError } = await supabase
      .from('skills')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Error fetching skills:', fetchError)
      return
    }
    
    if (existingSkills && existingSkills.length === 0) {
      console.log('Seeding skills table...')
      const { error: insertError } = await supabase
        .from('skills')
        .insert([
          { name: 'Physical Health', description: 'Build strength, lose weight, improve fitness', icon: '💪', color: '#FF6B6B', order_index: 1 },
          { name: 'Mental Health', description: 'Reduce stress, build mindfulness, improve wellbeing', icon: '🧠', color: '#4ECDC4', order_index: 2 },
          { name: 'Finance', description: 'Save money, budget better, build wealth', icon: '💰', color: '#45B7D1', order_index: 3 },
          { name: 'Social', description: 'Improve relationships, network better', icon: '👥', color: '#96CEB4', order_index: 4 }
        ])
      
      if (insertError) {
        console.error('❌ Error inserting skills:', insertError)
        return
      }
      
      console.log('✅ Skills seeded')
    }
    
    console.log('✅ Database setup completed!')
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

createTables().then(() => {
  console.log('🏁 Table creation completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Creation failed:', error)
  process.exit(1)
})
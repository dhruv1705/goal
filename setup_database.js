// Database setup script to create tables and seed data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🔧 Setting up database...')
  
  try {
    // Create the skills table
    console.log('Creating skills table...')
    const { error: skillsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.skills (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL UNIQUE CHECK (name IN ('Physical Health', 'Mental Health', 'Finance', 'Social')),
          description TEXT,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })
    
    if (skillsError) {
      console.error('❌ Error creating skills table:', skillsError)
      return
    }
    
    // Create goal_templates table
    console.log('Creating goal_templates table...')
    const { error: goalError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.goal_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
          estimated_duration TEXT NOT NULL,
          total_levels INTEGER NOT NULL DEFAULT 4,
          benefits TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(skill_id, name)
        );
      `
    })
    
    if (goalError) {
      console.error('❌ Error creating goal_templates table:', goalError)
      return
    }
    
    // Create habit_templates table
    console.log('Creating habit_templates table...')
    const { error: habitError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.habit_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          goal_template_id UUID NOT NULL REFERENCES public.goal_templates(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
          estimated_duration INTEGER NOT NULL,
          xp_reward INTEGER NOT NULL DEFAULT 10,
          habit_type TEXT NOT NULL CHECK (habit_type IN ('foundation', 'building', 'power', 'mastery')),
          instructions TEXT,
          tips TEXT,
          unlock_requirements JSONB DEFAULT '{"completed_habits": 3, "required_level": 1}',
          order_index INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    })
    
    if (habitError) {
      console.error('❌ Error creating habit_templates table:', habitError)
      return
    }
    
    console.log('✅ Database setup completed!')
    
  } catch (error) {
    console.error('❌ General error:', error)
  }
}

setupDatabase().then(() => {
  console.log('🏁 Database setup completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Setup failed:', error)
  process.exit(1)
})
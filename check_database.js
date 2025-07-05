#!/usr/bin/env node

/**
 * Quick Database Check
 * Run this to verify database structure is working
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function quickCheck() {
  console.log('🔍 Quick Database Structure Check\n')
  
  // Check if tables exist
  const tables = ['categories', 'goal_templates', 'habit_templates']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5)
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}': Does not exist`)
        } else {
          console.log(`⚠️  Table '${table}': ${error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}': OK (${data?.length || 0} records)`)
        if (data && data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 100)}...`)
        }
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`)
    }
  }
  
  console.log('\n📋 Next Steps:')
  console.log('1. If tables don\'t exist: Run Supabase migrations')
  console.log('2. If tables exist but no data: Seed data manually in Supabase dashboard') 
  console.log('3. If everything OK: Start testing the app!')
  console.log('\n📱 To test the app: npm start')
}

quickCheck().catch(console.error)
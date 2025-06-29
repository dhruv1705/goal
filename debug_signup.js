const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  console.log('Testing signup with jacob@gmail.com...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'jacob@gmail.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.error('Signup error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } else {
      console.log('Signup successful:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function testEmailValidation() {
  console.log('\nTesting various email formats...');
  
  const testEmails = [
    'jacob@gmail.com',
    'test@example.com',
    'user@domain.co',
    'invalid.email',
    'test@',
    '@domain.com',
    'test@domain',
    'valid.email@subdomain.domain.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\nTesting: ${email}`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'testpassword123'
      });
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ Success: User created or already exists`);
      }
    } catch (err) {
      console.log(`❌ Unexpected error: ${err.message}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Run tests
testSignup().then(() => {
  return testEmailValidation();
}).catch(console.error);
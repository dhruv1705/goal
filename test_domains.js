const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ebdvpahpuefimdcfuvru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHZwYWhwdWVmaW1kY2Z1dnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMjM5NTMsImV4cCI6MjA2Njc5OTk1M30.8V52GocdThP5StIJ5ImZL3PwXPD8QWkJsj465QA2vI4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDomains() {
  console.log('Testing specific domains to identify domain blocking patterns...\n');
  
  const testDomains = [
    // Common email providers
    'gmail.com',
    'yahoo.com', 
    'hotmail.com',
    'outlook.com',
    'example.com',
    'test.com',
    
    // Less common domains
    'mycompany.com',
    'customdomain.co',
    'business.org',
    'personal.net',
    'workdomain.io',
    
    // Single word domains (which seemed to work)
    'domain',
    'company',
    'work'
  ];
  
  for (const domain of testDomains) {
    const email = `testuser@${domain}`;
    console.log(`Testing: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'testpassword123'
      });
      
      if (error) {
        console.log(`❌ Failed: ${error.message}`);
        if (error.code) {
          console.log(`   Error code: ${error.code}`);
        }
      } else {
        console.log(`✅ Success: Domain ${domain} is allowed`);
      }
    } catch (err) {
      console.log(`❌ Unexpected error: ${err.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

testDomains().catch(console.error);
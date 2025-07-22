// Test user creation after login

async function testUserCreation() {
  try {
    console.log('Testing user creation flow...\n');
    
    // First check if user is logged in
    const authResponse = await fetch('http://localhost:3000/api/check-user');
    const authData = await authResponse.json();
    
    console.log('=== Authentication Status ===');
    console.log('Logged in:', authData.isLoggedIn);
    
    if (authData.isLoggedIn && authData.user) {
      console.log('User ID:', authData.user.id);
      console.log('Email:', authData.user.email);
      console.log('Provider:', authData.user.provider);
      
      // Check if user exists in database
      console.log('\n=== Database Check ===');
      const dbResponse = await fetch('http://localhost:3000/api/test-payment-flow');
      const dbData = await dbResponse.json();
      
      console.log('User in database:', dbData.userInDB ? 'Yes' : 'No');
      
      if (dbData.userInDB) {
        console.log('Database user details:');
        console.log('- UUID:', dbData.userInDB.uuid);
        console.log('- Email:', dbData.userInDB.email);
        console.log('- Nickname:', dbData.userInDB.nickname);
        console.log('- Created at:', dbData.userInDB.created_at);
        console.log('- Provider:', dbData.userInDB.signin_provider);
      } else {
        console.log('\n⚠️  User not found in database!');
        console.log('This indicates the user was not saved after login.');
        
        if (dbData.issues && dbData.issues.length > 0) {
          console.log('\nIssues found:');
          dbData.issues.forEach(issue => console.log('- ' + issue));
        }
      }
      
      // Check user credits balance
      console.log('\n=== Credits Balance ===');
      const creditsResponse = await fetch('http://localhost:3000/api/user-credits-balance');
      const creditsData = await creditsResponse.json();
      
      if (creditsData.success) {
        console.log('Credits balance:', creditsData.balance);
      } else {
        console.log('Failed to get credits balance:', creditsData.error);
      }
      
    } else {
      console.log('\n❌ User is not logged in!');
      console.log('Please login first at: http://localhost:3000/signin');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testUserCreation();
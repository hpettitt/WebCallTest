// Setup Script - Initialize Admin User in Airtable
// Run this once to create your first admin user

require('dotenv').config();
const userService = require('../services/users');

async function setupAdmin() {
  console.log('🚀 Setting up admin user...\n');

  // Get admin details from command line or use defaults
  const email = process.argv[2] || 'admin@bloombuddies.com';
  const password = process.argv[3] || 'Admin123!';
  const name = process.argv[4] || 'Admin User';

  console.log('Creating admin user:');
  console.log(`  Email: ${email}`);
  console.log(`  Name: ${name}`);
  console.log(`  Password: ${password.replace(/./g, '*')}\n`);

  try {
    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    
    if (existingUser) {
      console.log('❌ User already exists with this email!');
      console.log('\nTo update the password, use the password reset feature.');
      process.exit(1);
    }

    // Create admin user
    const user = await userService.createUser({
      email,
      password,
      name,
      role: 'admin',
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('User Details:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Created: ${user.createdAt}\n`);

    console.log('🎉 Setup complete! You can now log in to the dashboard.\n');
    console.log('Next steps:');
    console.log('1. Go to your dashboard: /dashboard/');
    console.log('2. Log in with your credentials');
    console.log('3. (Optional) Add more users through the Airtable interface\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.message === 'User already exists') {
      console.log('\n💡 Tip: Use the password reset feature to update the password.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('Airtable')) {
      console.log('\n💡 Tip: Make sure your Airtable credentials are correct in .env file');
      console.log('   Required: AIRTABLE_API_KEY, AIRTABLE_BASE_ID');
      console.log('\n   Also ensure the "Dashboard Users" table exists in your Airtable base with these fields:');
      console.log('   - Email (Single line text)');
      console.log('   - Password Hash (Long text)');
      console.log('   - Name (Single line text)');
      console.log('   - Role (Single select: admin, user)');
      console.log('   - Reset Token (Long text)');
      console.log('   - Reset Token Expiry (Date)');
      console.log('   - Created At (Date)');
      console.log('   - Last Login (Date)');
    }
    
    process.exit(1);
  }
}

// Usage examples
if (require.main === module) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   Bloom Buddies Dashboard - Admin Setup');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Usage:');
  console.log('  node scripts/setup-admin.js [email] [password] [name]\n');
  console.log('Examples:');
  console.log('  node scripts/setup-admin.js');
  console.log('  node scripts/setup-admin.js admin@example.com MyPass123!');
  console.log('  node scripts/setup-admin.js hr@company.com SecurePass456 "HR Manager"\n');

  console.log('Password Requirements:');
  console.log('  - At least 8 characters long');
  console.log('  - Contains uppercase and lowercase letters');
  console.log('  - Contains at least one number\n');

  console.log('═══════════════════════════════════════════════════════\n');

  setupAdmin();
}

module.exports = { setupAdmin };

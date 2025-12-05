// Script to reset a user's password in Airtable
// Usage: node scripts/reset-user-password.js <email> <newPassword>

require('dotenv').config();
const bcrypt = require('bcryptjs');
const Airtable = require('airtable');

const SALT_ROUNDS = 10;

async function resetUserPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Usage: node scripts/reset-user-password.js <email> <newPassword>');
    console.log('\nExample:');
    console.log('  node scripts/reset-user-password.js admin@example.com NewPassword123!');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    // Initialize Airtable
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );

    console.log(`🔍 Looking for user: ${email}`);

    // Find user
    const records = await base('Dashboard Users')
      .select({
        filterByFormula: `LOWER({Email}) = LOWER('${email}')`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    const record = records[0];
    console.log(`✅ Found user: ${record.fields.Name || email}`);

    // Hash the new password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the user record
    console.log('💾 Updating password in Airtable...');
    await base('Dashboard Users').update(record.id, {
      'Password Hash': passwordHash,
    });

    console.log('✅ Password updated successfully!');
    console.log('\nYou can now log in with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword.replace(/./g, '*')}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetUserPassword();

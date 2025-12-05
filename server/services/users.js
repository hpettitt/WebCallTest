// User Management Service - Handles authentication and password resets
const Airtable = require('airtable');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

const USERS_TABLE = 'Dashboard Users'; // You'll need to create this table in Airtable
const SALT_ROUNDS = 10;

/**
 * Find a user by email
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} - User record or null
 */
async function findUserByEmail(email) {
  try {
    const records = await base(USERS_TABLE)
      .select({
        filterByFormula: `LOWER({Email}) = LOWER('${email}')`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    return {
      id: record.id,
      email: record.fields.Email,
      passwordHash: record.fields['Password Hash'],
      name: record.fields.Name || email,
      role: record.fields.Role || 'user',
      resetToken: record.fields['Reset Token'] || null,
      resetTokenExpiry: record.fields['Reset Token Expiry'] || null,
      createdAt: record.fields['Created At'],
      lastLogin: record.fields['Last Login'],
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
}

/**
 * Verify user credentials
 * @param {string} email - User's email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} - User object if valid, null otherwise
 */
async function verifyCredentials(email, password) {
  try {
    console.log('🔍 Looking up user:', email);
    const user = await findUserByEmail(email);
    
    if (!user) {
      console.log('❌ User not found:', email);
      return null;
    }
    
    if (!user.passwordHash) {
      console.log('❌ No password hash for user:', email);
      return null;
    }

    console.log('🔑 Comparing password for user:', email);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      console.log('❌ Password mismatch for user:', email);
      return null;
    }
    
    console.log('✅ Password verified for user:', email);

    // Update last login
    await base(USERS_TABLE).update(user.id, {
      'Last Login': new Date().toISOString(),
    });

    // Return user without password hash
    const { passwordHash, resetToken, resetTokenExpiry, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return null;
  }
}

/**
 * Create a password reset token
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} - Reset token and user info, or null
 */
async function createPasswordResetToken(email) {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 1 hour from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // Update user record with reset token
    await base(USERS_TABLE).update(user.id, {
      'Reset Token': resetToken,
      'Reset Token Expiry': expiryDate.toISOString(),
    });

    return {
      email: user.email,
      name: user.name,
      resetToken,
      expiryDate,
    };
  } catch (error) {
    console.error('Error creating password reset token:', error);
    throw error;
  }
}

/**
 * Verify a password reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} - User info if valid, null otherwise
 */
async function verifyResetToken(token) {
  try {
    const records = await base(USERS_TABLE)
      .select({
        filterByFormula: `{Reset Token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    const user = {
      id: record.id,
      email: record.fields.Email,
      resetTokenExpiry: record.fields['Reset Token Expiry'],
    };

    // Check if token has expired
    const expiryDate = new Date(user.resetTokenExpiry);
    if (expiryDate < new Date()) {
      return null; // Token expired
    }

    return user;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return null;
  }
}

/**
 * Reset user password
 * @param {string} token - Reset token
 * @param {string} newPassword - New plain text password
 * @returns {Promise<boolean>} - Success status
 */
async function resetPassword(token, newPassword) {
  try {
    const user = await verifyResetToken(token);
    
    if (!user) {
      return false;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user record
    await base(USERS_TABLE).update(user.id, {
      'Password Hash': passwordHash,
      'Reset Token': '', // Clear the token
      'Reset Token Expiry': '', // Clear the expiry
    });

    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data { email, password, name, role }
 * @returns {Promise<Object>} - Created user record
 */
async function createUser(userData) {
  try {
    const { email, password, name, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user record
    const records = await base(USERS_TABLE).create([
      {
        fields: {
          Email: email,
          'Password Hash': passwordHash,
          Name: name || email,
          Role: role,
          'Created At': new Date().toISOString(),
        },
      },
    ]);

    const record = records[0];
    return {
      id: record.id,
      email: record.fields.Email,
      name: record.fields.Name,
      role: record.fields.Role,
      createdAt: record.fields['Created At'],
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user password
 * @param {string} email - User's email
 * @param {string} newPassword - New plain text password
 * @returns {Promise<boolean>} - Success status
 */
async function updatePassword(email, newPassword) {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      return false;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user record
    await base(USERS_TABLE).update(user.id, {
      'Password Hash': passwordHash,
    });

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

/**
 * Get all users (without sensitive data)
 * @returns {Promise<Array>} - List of users
 */
async function getAllUsers() {
  try {
    const records = await base(USERS_TABLE)
      .select({
        sort: [{ field: 'Created At', direction: 'desc' }],
      })
      .all();

    return records.map(record => ({
      id: record.id,
      email: record.fields.Email,
      name: record.fields.Name,
      role: record.fields.Role,
      createdAt: record.fields['Created At'],
      lastLogin: record.fields['Last Login'],
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Update an existing user
 * @param {string} userId - User's Airtable record ID
 * @param {Object} userData - User data to update { email, password, name, role }
 * @returns {Promise<Object>} - Updated user record
 */
async function updateUser(userId, userData) {
  try {
    const { email, password, name, role } = userData;
    
    const updateFields = {};
    
    if (email) updateFields.Email = email;
    if (name) updateFields.Name = name;
    if (role) updateFields.Role = role;
    
    // Hash password if provided
    if (password) {
      updateFields['Password Hash'] = await bcrypt.hash(password, SALT_ROUNDS);
    }
    
    const record = await base(USERS_TABLE).update(userId, updateFields);
    
    return {
      id: record.id,
      email: record.fields.Email,
      name: record.fields.Name,
      role: record.fields.Role,
      createdAt: record.fields['Created At'],
      lastLogin: record.fields['Last Login'],
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user
 * @param {string} userId - User's Airtable record ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteUser(userId) {
  try {
    await base(USERS_TABLE).destroy(userId);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Find user by ID
 * @param {string} userId - User's Airtable record ID
 * @returns {Promise<Object|null>} - User record or null
 */
async function findUserById(userId) {
  try {
    const record = await base(USERS_TABLE).find(userId);
    
    return {
      id: record.id,
      email: record.fields.Email,
      name: record.fields.Name,
      role: record.fields.Role,
      createdAt: record.fields['Created At'],
      lastLogin: record.fields['Last Login'],
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

module.exports = {
  findUserByEmail,
  findUserById,
  verifyCredentials,
  createPasswordResetToken,
  verifyResetToken,
  resetPassword,
  createUser,
  updateUser,
  deleteUser,
  updatePassword,
  getAllUsers,
};

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const airtableService = require('./services/airtable');
const userService = require('./services/users');
const emailService = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Basic route - redirect to demo portal
app.get('/', (req, res) => {
  res.redirect('/demo-portal.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// Token Validation Endpoint
app.post('/api/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
    }

    // Find candidate by token
    const candidate = await airtableService.findCandidateByToken(token);

    if (!candidate) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid token - candidate not found'
      });
    }

    // Check if interview already completed or started
    if (candidate.interviewCompleted || candidate.action === 'interviewed') {
      return res.status(400).json({
        valid: false,
        error: 'Interview has already been started or completed. If there was an issue, please contact support.',
        candidate: {
          name: candidate.name,
          email: candidate.email
        }
      });
    }

    // Validate appointment time (5 min before to 30 min after)
    const timeValidation = airtableService.validateAppointmentTime(
      candidate.appointmentTime
    );

    if (!timeValidation.valid) {
      return res.status(403).json({
        valid: false,
        error: timeValidation.message,
        timeInfo: timeValidation,
        candidate: {
          name: candidate.name,
          appointmentTime: candidate.appointmentTime
        }
      });
    }

    // Token and time are valid
    res.json({
      valid: true,
      message: 'Access granted - proceed to interview',
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        appointmentTime: candidate.appointmentTime
      },
      timeInfo: timeValidation
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error during validation'
    });
  }
});

/**
 * Mark interview as started to prevent multiple calls
 */
/**
 * Check if interview was already completed
 * Prevents duplicate interviews by checking Airtable status
 */
app.get('/api/check-interview-status', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Candidates';

    // Find the record by token
    const records = await base(tableName)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const record = records[0];
    const fields = record.fields;
    
    // Check if interview was completed
    const completed = fields.InterviewCompleted === true || 
                     fields.action === 'interviewed' ||
                     fields.status === 'pending' ||
                     fields.status === 'accepted' ||
                     fields.status === 'rejected';

    res.json({ 
      success: true, 
      completed: completed,
      interviewCompleted: fields.InterviewCompleted,
      status: fields.status,
      action: fields.action
    });
  } catch (error) {
    console.error('Error checking interview status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/mark-interview-started', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Candidates';

    // Find the record by token
    const records = await base(tableName)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const record = records[0];
    const fields = record.fields;
    const callAttempts = (fields['Call Attempts'] || 0) + 1;

    // CRITICAL: Strict duplicate call prevention
    // Only allow ONE call per candidate
    if (fields.InterviewCompleted === true || fields.action === 'interviewed' || callAttempts > 1) {
      console.log(`⚠️ Duplicate call attempt detected - Call Attempts: ${fields['Call Attempts']}, Status: ${fields.action}`);
      return res.status(409).json({ 
        success: false, 
        error: 'Interview already started',
        alreadyStarted: true,
        callAttempts: callAttempts
      });
    }

    // ATOMIC UPDATE: Mark interview as started and increment call count
    // This ensures only one successful call can proceed
    try {
      await base(tableName).update(record.id, {
        'action': 'interviewed',
        'InterviewCompleted': true,
        'status': 'pending',
        'Call Attempts': callAttempts,
        'Call Started At': new Date().toISOString(),
      });

      console.log(`✅ Interview marked as started - Call Attempt #${callAttempts} for token:`, token);
      res.json({ 
        success: true, 
        message: 'Interview marked as started',
        callAttempts: callAttempts 
      });
    } catch (updateError) {
      console.error('❌ Failed to update Airtable record:', updateError);
      res.status(500).json({ success: false, error: 'Failed to mark interview as started' });
    }
  } catch (error) {
    console.error('Error marking interview started:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * Get VAPI credentials for interview
 * Returns API key and Assistant ID from environment variables
 */
app.post('/api/get-vapi-credentials', (req, res) => {
  try {
    const { sessionToken, candidateName } = req.body;
    
    // Log the request for debugging
    console.log('VAPI credentials requested for:', { sessionToken, candidateName });

    // Get credentials from environment variables
    const vapiKey = process.env.VAPI_API_KEY;
    const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;

    if (!vapiKey || !vapiAssistantId) {
      return res.status(500).json({
        error: 'VAPI credentials not configured on server'
      });
    }

    // Return credentials
    res.json({
      vapiKey: vapiKey,
      vapiAssistantId: vapiAssistantId,
      success: true
    });

  } catch (error) {
    console.error('Error getting VAPI credentials:', error);
    res.status(500).json({
      error: 'Server error getting VAPI credentials'
    });
  }
});

/**
 * Dashboard Configuration Endpoint
 * Returns Airtable credentials and auth settings from environment variables
 */
app.get('/api/dashboard-config', (req, res) => {
  try {
    const airtableToken = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!airtableToken || !baseId || !tableName) {
      return res.status(500).json({
        error: 'Dashboard configuration not available'
      });
    }

    // Parse dashboard credentials from environment variable
    // Format: email1:password1,email2:password2
    const dashboardAuth = {};
    const authString = process.env.DASHBOARD_AUTH || 'admin@bloombuddies.com:secure123,hr@bloombuddies.com:hr2023!';
    
    authString.split(',').forEach(pair => {
      const [email, password] = pair.trim().split(':');
      if (email && password) {
        dashboardAuth[email.trim()] = password.trim();
      }
    });

    res.json({
      airtable: {
        personalAccessToken: airtableToken,
        baseId: baseId,
        tableName: tableName,
        baseUrl: 'https://api.airtable.com/v0'
      },
      auth: {
        validCredentials: dashboardAuth,
        sessionTimeout: 3600000
      }
    });
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    res.status(500).json({ error: 'Server error getting dashboard config' });
  }
});

/**
 * User Authentication Endpoint
 * Verifies user credentials against Airtable
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const user = await userService.verifyCredentials(email, password);

    if (!user) {
      console.log('❌ Login failed for:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    console.log('✅ Login successful for:', email);

    // Generate JWT token
    try {
      const jwt = require('jsonwebtoken');
      console.log('📝 Generating JWT token...');
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
      );
      console.log('✅ JWT token generated');

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (jwtError) {
      console.error('❌ JWT generation failed:', jwtError.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authentication token',
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
});

/**
 * Request Password Reset Endpoint
 * Generates a reset token and sends email
 */
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Create reset token
    const resetData = await userService.createPasswordResetToken(email);

    if (!resetData) {
      // Don't reveal if user exists - security best practice
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    // Get base URL from request or environment
    let baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else if (process.env.RAILWAY_STATIC_URL) {
        baseUrl = process.env.RAILWAY_STATIC_URL;
      } else {
        baseUrl = `${req.protocol}://${req.get('host')}`;
      }
    }

    // Send reset email with retry logic
    const emailResult = await emailService.sendPasswordResetEmail({
      email: resetData.email,
      name: resetData.name,
      resetToken: resetData.resetToken,
      resetUrl: baseUrl,
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send reset email to:', email, 'Error:', emailResult.error);
    }

    // Always return success (security - don't reveal if user exists)
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing password reset request',
    });
  }
});

/**
 * Verify Reset Token Endpoint
 * Checks if a reset token is valid
 */
app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await userService.verifyResetToken(token);

    if (!user) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid or expired reset token',
      });
    }

    res.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error verifying token',
    });
  }
});

/**
 * Reset Password Endpoint
 * Changes user password using reset token
 */
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
    }

    // Get user info before resetting
    const user = await userService.verifyResetToken(token);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    // Reset password
    const success = await userService.resetPassword(token, newPassword);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to reset password',
      });
    }

    // Send confirmation email
    await emailService.sendPasswordChangedEmail({
      email: user.email,
      name: user.name || user.email,
    });

    res.json({
      success: true,
      message: 'Password successfully reset',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: 'Server error resetting password',
    });
  }
});

/**
 * Middleware to verify JWT token and admin role
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Get all users (admin only)
 */
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
    });
  }
});

/**
 * Create a new user (admin only)
 */
app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }
    
    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }
    
    const user = await userService.createUser({ email, password, name, role: role || 'user' });
    
    res.json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
    });
  }
});

/**
 * Update a user (admin only)
 */
app.put('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, role } = req.body;
    
    // Validate password if provided
    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }
    
    const userData = {};
    if (email) userData.email = email;
    if (name) userData.name = name;
    if (role) userData.role = role;
    if (password) userData.password = password;
    
    const user = await userService.updateUser(id, userData);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

/**
 * Delete a user (admin only)
 */
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }
    
    await userService.deleteUser(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

// Get candidate info (for dashboard)
app.get('/api/candidates', async (req, res) => {
  try {
    const { status } = req.query;
    const candidates = await airtableService.getAllCandidates({ status });
    res.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Update candidate status (accept/reject)
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedCandidate = await airtableService.updateCandidate(id, updates);
    res.json({ 
      success: true, 
      candidate: updatedCandidate 
    });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

/**
 * Get candidate info for scheduling page
 */
app.get('/api/candidate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Verify token matches candidate
    const candidate = await airtableService.getCandidateById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    // Simple token verification (you can enhance this with actual token generation/validation)
    const expectedToken = Buffer.from(candidate.email).toString('base64').substring(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
      });
    }

    res.json({
      success: true,
      candidate: {
        name: candidate.name,
        email: candidate.email,
      },
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

/**
 * Register candidate and schedule interview
 * This is the main entry point for new candidates
 */
app.post('/api/register-candidate', async (req, res) => {
  console.log('=== REGISTER CANDIDATE REQUEST ===');
  console.log('Request body:', req.body);
  
  try {
    const { name, email, phone, interviewDate, interviewTime } = req.body;

    if (!name || !email || !phone || !interviewDate || !interviewTime) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }
    
    console.log('All fields present, proceeding with registration...');

    // Generate a unique token for this candidate
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');

    // Combine date and time - store as UTC to avoid timezone issues
    const interviewDateTime = `${interviewDate}T${interviewTime}:00.000Z`;

    // Create candidate record in Airtable
    console.log('Creating Airtable record...');
    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Candidates';

    const record = await base(tableName).create({
      'Candidate Name': name,
      'Email': email,
      'Phone': phone,
      'Interview Time': interviewDateTime,
      'token': token,
      'status': 'scheduled',
    });

    console.log('Airtable record created:', record.id);

    // Generate interview link
    // Try to auto-detect Railway URL or use environment variable
    let baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      // Check for Railway environment
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else if (process.env.RAILWAY_STATIC_URL) {
        baseUrl = process.env.RAILWAY_STATIC_URL;
      } else {
        baseUrl = `http://localhost:${PORT}`;
      }
    }
    const interviewLink = `${baseUrl}/interview-validation.html?token=${token}`;
    console.log('Interview link:', interviewLink);

    // Send confirmation email with interview link
    console.log('Sending confirmation email to:', email);
    
    // Format date and time for email
    const dateObj = new Date(interviewDateTime);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) + ' CET';
    
    // Send email with retry logic
    const emailResult = await emailService.sendInterviewConfirmation({
      email: email,
      name: name,
      interviewDate: formattedDate,
      interviewTime: formattedTime,
      interviewLink: interviewLink,
    });
    
    // Update Airtable with email status
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      await base(tableName).update(record.id, {
        'emailSent': true,
        'emailSentAt': new Date().toISOString(),
        'emailMessageId': emailResult.messageId
      });
    } else {
      console.error('🚫 Email failed after all retries. Recording failure in Airtable.');
      await base(tableName).update(record.id, {
        'emailSent': false,
        'emailError': emailResult.error,
        'emailAttempts': emailResult.attempts,
        'notes': `Email delivery failed: ${emailResult.error}. Interview link: ${interviewLink}`
      });
    }

    res.json({
      success: true,
      message: 'Registration successful',
      candidateId: record.id,
      emailSent: emailResult.success,
      emailWarning: !emailResult.success ? 'Email delivery failed but registration complete. Please contact support.' : null
    });
    
    console.log('=== REGISTRATION COMPLETE ===');
  } catch (error) {
    console.error('❌ Error registering candidate:', error);
    
    // Check if this is an email-only error after successful Airtable creation
    if (error.message && error.message.includes('email')) {
      console.error('⚠️ Registration succeeded but email failed');
      return res.status(200).json({
        success: true,
        message: 'Registration successful',
        emailSent: false,
        emailWarning: 'Registration complete but email delivery failed. Please check your spam folder or contact support for your interview link.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error registering candidate',
      details: error.message,
    });
  }
});

/**
 * Schedule interview endpoint (legacy - kept for compatibility)
 */
app.post('/api/schedule-interview', async (req, res) => {
  try {
    const { candidateId, token, interviewDate, interviewTime } = req.body;

    if (!candidateId || !token || !interviewDate || !interviewTime) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    // Verify token
    const candidate = await airtableService.getCandidateById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found',
      });
    }

    const expectedToken = Buffer.from(candidate.email).toString('base64').substring(0, 16);
    
    if (token !== expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Combine date and time
    const interviewDateTime = `${interviewDate}T${interviewTime}:00`;

    // Generate unique management token (secure random string)
    const managementToken = crypto.randomBytes(32).toString('hex');

    // Update candidate in Airtable
    const updated = await airtableService.updateCandidate(candidateId, {
      'Interview Time': interviewDateTime,
      'Status': 'Scheduled',
      'Management Token': managementToken,
    });

    // Create management link
    const baseUrl = process.env.BASE_URL || 'https://bloombuddies.up.railway.app';
    const managementLink = `${baseUrl}/manage-interview.html?token=${managementToken}`;

    // Create interview link
    const interviewLink = `${baseUrl}/interview.html?token=${token}`;

    // Send confirmation email
    const emailResult = await emailService.sendInterviewConfirmation({
      email: candidate.email,
      name: candidate.name,
      interviewDate: interviewDate,
      interviewTime: interviewTime,
      interviewLink: interviewLink,
      managementLink: managementLink,
    });

    // Check if email was actually sent
    if (!emailResult.success) {
      console.error('⚠️ Email failed to send for scheduled interview:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Interview scheduled but confirmation email failed to send. Please check your email or contact support.',
        emailError: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      emailMessageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      error: 'Server error scheduling interview',
    });
  }
});

// Resend Interview Confirmation Email
app.post('/api/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find candidate by email
    const Airtable = require('airtable');
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
      process.env.AIRTABLE_BASE_ID
    );
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Candidates';

    const records = await base(tableName)
      .select({
        filterByFormula: `{email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interview found for this email address',
      });
    }

    const candidate = records[0].fields;
    
    // Check if interview is scheduled
    if (!candidate['Interview Time'] || !candidate.token) {
      return res.status(400).json({
        success: false,
        error: 'Interview is not scheduled yet',
      });
    }

    // Parse interview date/time
    const dt = new Date(candidate['Interview Time']);
    const formattedDate = dt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = dt.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Create interview link
    const baseUrl = process.env.BASE_URL || 'https://bloombuddies.up.railway.app';
    const interviewLink = `${baseUrl}/interview.html?token=${candidate.token}`;
    const managementLink = candidate['Management Token'] 
      ? `${baseUrl}/manage-interview.html?token=${candidate['Management Token']}`
      : null;

    // Resend confirmation email
    const emailResult = await emailService.sendInterviewConfirmation({
      email: candidate.email,
      name: candidate.name,
      interviewDate: formattedDate,
      interviewTime: formattedTime,
      interviewLink: interviewLink,
      managementLink: managementLink,
    });

    if (!emailResult.success) {
      console.error('⚠️ Failed to resend confirmation email:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send confirmation email. Please try again later.',
        emailError: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: 'Confirmation email resent successfully',
      emailMessageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    res.status(500).json({
      success: false,
      error: 'Server error resending email',
    });
  }
});

// Test Email Configuration
app.get('/api/test-email-config', (req, res) => {
  const config = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'Not set',
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'Not set',
    EMAIL_USER: process.env.EMAIL_USER ? '***SET***' : 'NOT SET',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET',
    EMAIL_FROM: process.env.EMAIL_FROM || 'Not set',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '***SET***' : 'NOT SET',
    SMTP_HOST: process.env.SMTP_HOST || 'Not set',
    SMTP_USER: process.env.SMTP_USER || 'Not set',
  };

  res.json({
    success: true,
    config: config,
    message: '✓ Set means the environment variable is configured'
  });
});

// Interview Management - Verify Token
app.get('/api/interview/verify-token', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Find candidate by management token
    const candidate = await airtableService.getCandidateByManagementToken(token);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found or link has expired',
      });
    }

    // Check if token is expired (24 hours after interview)
    if (candidate.interviewDateTime) {
      const interviewDate = new Date(candidate.interviewDateTime);
      const expiryDate = new Date(interviewDate.getTime() + 24 * 60 * 60 * 1000);
      
      if (new Date() > expiryDate) {
        return res.status(410).json({
          success: false,
          error: 'This management link has expired',
        });
      }
    }

    // Create interview link
    const baseUrl = process.env.BASE_URL || 'https://bloombuddies.up.railway.app';
    const interviewLink = candidate.token ? `${baseUrl}/interview.html?token=${candidate.token}` : null;

    res.json({
      success: true,
      interview: {
        name: candidate.name,
        email: candidate.email,
        interviewDateTime: candidate.interviewDateTime,
        status: candidate.status || 'scheduled',
        interviewLink: interviewLink,
      },
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      error: 'Server error verifying token',
    });
  }
});

// Interview Management - Reschedule
app.post('/api/interview/reschedule', async (req, res) => {
  try {
    const { token, newDateTime } = req.body;

    if (!token || !newDateTime) {
      return res.status(400).json({
        success: false,
        error: 'Token and new date/time are required',
      });
    }

    // Find candidate
    const candidate = await airtableService.getCandidateByManagementToken(token);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
    }

    // Check if already cancelled
    if (candidate.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reschedule a cancelled interview',
      });
    }

    // Update interview date/time
    await airtableService.updateCandidateByManagementToken(token, {
      'Interview Time': newDateTime,
      'Status': 'Rescheduled',
      'Last Modified': new Date().toISOString(),
    });

    // Send confirmation email
    const dt = new Date(newDateTime);
    const formattedDate = dt.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = dt.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Get the interview link and management link for this candidate
    const baseUrl = process.env.BASE_URL || 'https://bloombuddies.up.railway.app';
    const interviewLink = `${baseUrl}/interview.html?token=${candidate.token}`;
    const managementLink = `${baseUrl}/manage-interview.html?token=${token}`;

    await emailService.sendInterviewConfirmation({
      email: candidate.email,
      name: candidate.name,
      interviewDate: formattedDate,
      interviewTime: formattedTime,
      interviewLink: interviewLink,
      managementLink: managementLink,
    });

    const emailResult = await emailService.sendInterviewConfirmation({
      email: candidate.email,
      name: candidate.name,
      interviewDate: formattedDate,
      interviewTime: formattedTime,
      interviewLink: interviewLink,
      managementLink: managementLink,
    });

    // Check if email was sent
    if (!emailResult.success) {
      console.error('⚠️ Email failed to send for rescheduled interview:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Interview rescheduled but confirmation email failed to send. Please check your email or contact support.',
        emailError: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: 'Interview rescheduled successfully',
      emailMessageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error rescheduling interview:', error);
    res.status(500).json({
      success: false,
      error: 'Server error rescheduling interview',
    });
  }
});

// Interview Management - Cancel
app.post('/api/interview/cancel', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Find candidate
    const candidate = await airtableService.getCandidateByManagementToken(token);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
    }

    // Update status to cancelled
    await airtableService.updateCandidateByManagementToken(token, {
      'Status': 'Cancelled',
      'Last Modified': new Date().toISOString(),
    });

    // Send cancellation confirmation email
    const emailResult = await emailService.sendCancellationConfirmation({
      email: candidate.email,
      name: candidate.name,
    });

    // Check if email was sent
    if (!emailResult.success) {
      console.error('⚠️ Email failed to send for cancellation:', emailResult.error);
      return res.status(500).json({
        success: false,
        error: 'Interview cancelled but confirmation email failed to send. Please check your email or contact support.',
        emailError: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      emailMessageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      error: 'Server error cancelling interview',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the server`);
});

module.exports = app;